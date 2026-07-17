package com.angelica.pos.shared.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.IntegerSchema;
import io.swagger.v3.oas.models.media.MapSchema;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

@Configuration
public class OpenApiConfig {

    public static final String BEARER_AUTH = "bearerAuth";
    private static final String ERROR_RESPONSE_REF = "#/components/schemas/ErrorResponse";
    private static final String EXCEL_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    @Bean
    public OpenAPI posOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("NovaPOS API")
                        .version("v1")
                        .description("""
                                API REST del sistema POS para autenticación, catálogos, ventas, caja,
                                inventario, cuentas por cobrar, reportes y control de mercancía por proveedor.

                                Flujo para probar endpoints protegidos desde Swagger UI:
                                1. Ejecuta `POST /api/auth/login`.
                                2. Copia el token JWT devuelto.
                                3. Pulsa `Authorize`.
                                4. Pega el JWT en el esquema `bearerAuth`.
                                5. Ejecuta endpoints protegidos. Swagger UI enviará `Authorization: Bearer {token}`.
                                """)
                        .contact(new Contact()
                                .name("NovaPOS")
                                .email("support@example.com")))
                .servers(List.of(new Server()
                        .url("http://localhost:8080")
                        .description("Servidor local de desarrollo")))
                .components(new Components()
                        .addSchemas("ErrorResponse", errorResponseSchema())
                        .addSecuritySchemes(BEARER_AUTH, new SecurityScheme()
                                .name(BEARER_AUTH)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }

    @Bean
    public OpenApiCustomizer posOpenApiCustomizer() {
        return openApi -> {
            if (openApi.getPaths() == null) {
                return;
            }

            openApi.getPaths().forEach((path, pathItem) ->
                    pathItem.readOperationsMap().forEach((method, operation) -> {
                        applyOperationDocumentation(path, method, operation);
                        applyCommonResponses(operation);
                        if (!isPublicOperation(path, method)) {
                            operation.addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH));
                        }
                    })
            );
        };
    }

    private void applyOperationDocumentation(String path, PathItem.HttpMethod method, Operation operation) {
        OperationDoc doc = operationDocs().get(method.name() + " " + path);
        if (doc == null) {
            doc = fallbackDoc(path, method);
        }

        if (operation.getSummary() == null) {
            operation.setSummary(doc.summary());
        }
        if (operation.getDescription() == null) {
            operation.setDescription(doc.description());
        }
        if (operation.getTags() == null || operation.getTags().isEmpty()) {
            operation.setTags(List.of(doc.tag()));
        }

        if (path.endsWith("/export") && method == PathItem.HttpMethod.GET) {
            ensureResponses(operation);
            operation.getResponses().addApiResponse("200", new ApiResponse()
                    .description("Archivo Excel .xlsx del corte finalizado")
                    .content(new Content().addMediaType(EXCEL_CONTENT_TYPE, new MediaType()
                            .schema(new Schema<>().type("string").format("binary")))));
        }
    }

    private void applyCommonResponses(Operation operation) {
        ensureResponses(operation);
        operation.getResponses().addApiResponse("400", errorResponse("Solicitud inválida o validación fallida"));
        operation.getResponses().addApiResponse("401", errorResponse("No autenticado o token JWT inválido"));
        operation.getResponses().addApiResponse("403", errorResponse("Acceso prohibido para el rol autenticado"));
        operation.getResponses().addApiResponse("404", errorResponse("Recurso no encontrado"));
        operation.getResponses().addApiResponse("409", errorResponse("Conflicto de negocio"));
        operation.getResponses().addApiResponse("500", errorResponse("Error interno del servidor"));
    }

    private ApiResponse errorResponse(String description) {
        return new ApiResponse()
                .description(description)
                .content(new Content().addMediaType(org.springframework.http.MediaType.APPLICATION_JSON_VALUE,
                        new MediaType().schema(new Schema<>().$ref(ERROR_RESPONSE_REF))));
    }

    private Schema<?> errorResponseSchema() {
        return new ObjectSchema()
                .description("Respuesta estándar de error generada por GlobalExceptionHandler")
                .addProperty("timestamp", new StringSchema()
                        .format("date-time")
                        .description("Fecha y hora del error")
                        .example("2026-07-17T12:00:00-06:00"))
                .addProperty("status", new IntegerSchema()
                        .description("Código HTTP")
                        .example(400))
                .addProperty("error", new StringSchema()
                        .description("Nombre del estado HTTP")
                        .example("Bad Request"))
                .addProperty("message", new StringSchema()
                        .description("Mensaje legible del error")
                        .example("La solicitud no es valida. Revisa los datos ingresados."))
                .addProperty("path", new StringSchema()
                        .description("Ruta solicitada")
                        .example("/api/products"))
                .addProperty("validationErrors", new MapSchema()
                        .description("Errores de validación por campo, cuando existen")
                        .additionalProperties(new StringSchema()));
    }

    private void ensureResponses(Operation operation) {
        if (operation.getResponses() == null) {
            operation.setResponses(new ApiResponses());
        }
    }

    private boolean isPublicOperation(String path, PathItem.HttpMethod method) {
        return method == PathItem.HttpMethod.POST && "/api/auth/login".equals(path);
    }

    private OperationDoc fallbackDoc(String path, PathItem.HttpMethod method) {
        String tag = tagForPath(path);
        return new OperationDoc(
                tag,
                method.name() + " " + path,
                "Operación protegida por JWT según las reglas de seguridad del sistema. Revisa roles permitidos en SecurityConfig."
        );
    }

    private String tagForPath(String path) {
        if (path.startsWith("/api/auth")) return OpenApiTags.AUTH;
        if (path.startsWith("/api/users")) return OpenApiTags.USERS;
        if (path.startsWith("/api/categories")) return OpenApiTags.CATEGORIES;
        if (path.startsWith("/api/products")) return OpenApiTags.PRODUCTS;
        if (path.startsWith("/api/customers")) return OpenApiTags.CUSTOMERS;
        if (path.startsWith("/api/inventory-movements")) return OpenApiTags.INVENTORY_MOVEMENTS;
        if (path.startsWith("/api/cash-sessions") && path.contains("closing")) return OpenApiTags.CASH_CLOSING;
        if (path.startsWith("/api/cash-sessions")) return OpenApiTags.CASH_SESSIONS;
        if (path.startsWith("/api/cash-movements")) return OpenApiTags.CASH_MOVEMENTS;
        if (path.startsWith("/api/sales") && path.endsWith("/cancel")) return OpenApiTags.SALE_CANCELLATIONS;
        if (path.contains("/returns") || path.startsWith("/api/sale-returns")) return OpenApiTags.SALE_RETURNS;
        if (path.startsWith("/api/sales") && methodIsGetPath(path)) return OpenApiTags.SALES_HISTORY;
        if (path.startsWith("/api/sales")) return OpenApiTags.SALES;
        if (path.startsWith("/api/receivable-payments")) return OpenApiTags.RECEIVABLE_PAYMENTS;
        if (path.startsWith("/api/receivables")) return OpenApiTags.RECEIVABLES;
        if (path.startsWith("/api/reports")) return OpenApiTags.REPORTS;
        if (path.startsWith("/api/dashboard")) return OpenApiTags.DASHBOARD;
        if (path.contains("/inventory-baseline")) return OpenApiTags.SUPPLIER_BASELINES;
        if (path.startsWith("/api/supplier-entries") || path.endsWith("/entries")) return OpenApiTags.SUPPLIER_ENTRIES;
        if (path.endsWith("/export")) return OpenApiTags.SUPPLIER_SETTLEMENT_EXPORT;
        if (path.startsWith("/api/supplier-settlements")) return OpenApiTags.SUPPLIER_SETTLEMENTS;
        if (path.startsWith("/api/suppliers")) return OpenApiTags.SUPPLIERS;
        return "API";
    }

    private boolean methodIsGetPath(String path) {
        return path.startsWith("/api/sales/current-session") || path.matches("/api/sales(/\\{[^}]+})?");
    }

    private Map<String, OperationDoc> operationDocs() {
        return Map.ofEntries(
                entry("POST /api/auth/login", OpenApiTags.AUTH, "Iniciar sesión", "Endpoint público. Valida credenciales y devuelve un JWT para usar en `Authorize`."),
                entry("GET /api/auth/me", OpenApiTags.AUTH, "Consultar usuario autenticado", "Devuelve los datos públicos del usuario autenticado."),
                entry("POST /api/auth/change-password", OpenApiTags.AUTH, "Cambiar contraseña", "Permite cambiar contraseña del usuario autenticado. La contraseña se envía como campo write-only."),
                entry("GET /api/dashboard/summary", OpenApiTags.DASHBOARD, "Consultar resumen de dashboard", "Devuelve resumen real calculado en backend. ADMIN recibe información global; CASHIER solo su caja y ventas permitidas."),
                entry("POST /api/sales", OpenApiTags.SALES, "Crear venta", "Una venta CASH requiere caja abierta y crea movimiento de caja. Una venta CREDIT genera una cuenta por cobrar."),
                entry("GET /api/sales/current-session", OpenApiTags.SALES_HISTORY, "Listar ventas de la caja actual", "Devuelve ventas de la sesión abierta del cajero autenticado."),
                entry("GET /api/sales", OpenApiTags.SALES_HISTORY, "Listar historial de ventas", "ADMIN puede consultar el historial con filtros. CASHIER mantiene los permisos definidos por seguridad."),
                entry("POST /api/sales/{saleId}/returns", OpenApiTags.SALE_RETURNS, "Registrar devolución", "Registra devolución de venta. Puede generar reembolso de caja o ajustar una cuenta por cobrar."),
                entry("POST /api/sales/{saleId}/cancel", OpenApiTags.SALE_CANCELLATIONS, "Cancelar venta", "La cancelación no elimina físicamente la venta y registra efectos de caja/cuenta según el caso."),
                entry("POST /api/cash-sessions/open", OpenApiTags.CASH_SESSIONS, "Abrir caja", "Abre una sesión de caja para el usuario autenticado. Solo puede existir una caja abierta por usuario."),
                entry("POST /api/cash-sessions/current/close", OpenApiTags.CASH_CLOSING, "Cerrar caja actual", "Cierra la sesión abierta y guarda snapshot de totales. El cierre bloquea nuevas operaciones en esa sesión."),
                entry("POST /api/cash-movements/entries", OpenApiTags.CASH_MOVEMENTS, "Registrar entrada de caja", "Registra entrada manual de efectivo en la caja abierta del usuario."),
                entry("POST /api/cash-movements/exits", OpenApiTags.CASH_MOVEMENTS, "Registrar salida de caja", "Registra salida manual de efectivo en la caja abierta del usuario."),
                entry("POST /api/products", OpenApiTags.PRODUCTS, "Crear producto", "Crea producto activo con precios, stock inicial, categoría y proveedor opcional."),
                entry("POST /api/receivables/{receivableId}/payments", OpenApiTags.RECEIVABLE_PAYMENTS, "Registrar abono", "Registra pago a una cuenta por cobrar y actualiza saldos en backend."),
                entry("POST /api/suppliers", OpenApiTags.SUPPLIERS, "Crear proveedor", "Crea proveedor activo. No permite nombres duplicados ignorando mayúsculas/minúsculas."),
                entry("POST /api/suppliers/{supplierId}/inventory-baseline", OpenApiTags.SUPPLIER_BASELINES, "Registrar inventario inicial", "Registra una sola vez el inventario inicial por proveedor y actualiza stock."),
                entry("POST /api/supplier-entries", OpenApiTags.SUPPLIER_ENTRIES, "Registrar mercancía", "Registra productos recibidos de un proveedor, actualiza stock/precios y crea movimientos de inventario."),
                entry("POST /api/supplier-settlements", OpenApiTags.SUPPLIER_SETTLEMENTS, "Iniciar corte por proveedor", "Crea borrador de corte. El periodo inicial se calcula en backend desde baseline o último corte finalizado."),
                entry("PUT /api/supplier-settlements/{id}", OpenApiTags.SUPPLIER_SETTLEMENTS, "Guardar borrador de corte", "Actualiza conteos finales, importe entregado y observaciones sin modificar inventario real."),
                entry("POST /api/supplier-settlements/{id}/finalize", OpenApiTags.SUPPLIER_SETTLEMENTS, "Finalizar corte por proveedor", "Operación transaccional e irreversible. Bloquea el corte y actualiza stock con inventario contado."),
                entry("GET /api/supplier-settlements/{id}/export", OpenApiTags.SUPPLIER_SETTLEMENT_EXPORT, "Exportar corte finalizado a Excel", "Devuelve archivo `.xlsx`. Solo se permite para cortes FINALIZED.")
        );
    }

    private static Map.Entry<String, OperationDoc> entry(String key, String tag, String summary, String description) {
        return Map.entry(key, new OperationDoc(tag, summary, description));
    }

    private record OperationDoc(String tag, String summary, String description) {
    }
}
