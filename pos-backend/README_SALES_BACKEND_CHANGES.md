# Backend - Módulo de Ventas

Este documento explica los cambios del backend para el módulo `com.angelica.pos.sale`.
La idea es que puedas usarlo como guía para entender cómo se arma un módulo completo en este proyecto con Spring Boot, JPA, MapStruct, Flyway, Bean Validation, seguridad, servicios, repositorios, excepciones y pruebas.

## Alcance Implementado

El módulo de ventas permite actualmente:

- Crear ventas en efectivo.
- Consultar el detalle completo de una venta.
- Consultar ventas de la sesión de caja actual.
- Consultar historial global de ventas para ADMIN.
- Paginar listados con `PageResponse`.
- Filtrar historial global.
- Validar permisos de ADMIN y CASHIER.
- Registrar movimientos de inventario por venta.
- Registrar un movimiento de caja por venta.

No se implementó todavía:

- Venta fiada.
- Abonos.
- Cuentas por cobrar.
- Devoluciones.
- Cancelaciones.
- Edición o eliminación de ventas.
- Tickets.
- Reportes agregados.
- Frontend dentro del backend.

## Estructura del Módulo

El módulo vive en:

```text
src/main/java/com/angelica/pos/sale
```

Estructura:

```text
sale/
├── controller/
│   └── SaleController.java
├── dto/
│   ├── SaleRequest.java
│   ├── SaleItemRequest.java
│   ├── SaleResponse.java
│   ├── SaleSummaryResponse.java
│   ├── SaleDetailResponse.java
│   └── SaleItemResponse.java
├── entity/
│   ├── Sale.java
│   ├── SaleItem.java
│   ├── SaleType.java
│   └── SaleStatus.java
├── exception/
│   ├── CreditSaleNotAvailableException.java
│   ├── InsufficientCashReceivedException.java
│   ├── SaleAccessDeniedException.java
│   └── SaleNotFoundException.java
├── mapper/
│   └── SaleMapper.java
├── repository/
│   └── SaleRepository.java
└── service/
    ├── SaleService.java
    └── SaleServiceImpl.java
```

La migración está en:

```text
src/main/resources/db/migration/V6__create_sales.sql
```

Las pruebas están en:

```text
src/test/java/com/angelica/pos/sale
```

## Migración Flyway

Archivo:

```text
src/main/resources/db/migration/V6__create_sales.sql
```

Crea dos tablas:

- `sales`
- `sale_items`

### Tabla `sales`

Guarda la cabecera de la venta:

- `id`: folio interno de la venta.
- `cash_session_id`: caja en la que se registró la venta.
- `created_by_user_id`: usuario que registró la venta.
- `customer_id`: cliente opcional.
- `sale_type`: tipo de venta. Hoy sólo se permite `CASH`.
- `status`: estado. Hoy se crea como `COMPLETED`.
- `total`: total calculado por backend.
- `cash_received`: efectivo recibido.
- `change_amount`: cambio calculado.
- `created_at`: fecha de creación.
- `cancelled_at`: preparado para cancelación futura.

Relaciones:

- `cash_session_id` apunta a `cash_sessions`.
- `created_by_user_id` apunta a `users`.
- `customer_id` apunta a `customers`.

Todas usan `ON DELETE RESTRICT` para evitar borrar datos históricos relacionados con ventas.

### Tabla `sale_items`

Guarda los artículos vendidos:

- `sale_id`: venta padre.
- `product_id`: producto vendido.
- `product_name`: nombre histórico del producto.
- `product_barcode`: código histórico.
- `product_unit`: unidad histórica.
- `quantity`: cantidad vendida.
- `unit_price`: precio de venta histórico.
- `unit_cost`: costo histórico. No se expone al frontend.
- `line_total`: importe de la línea.

El punto más importante es que `sale_items` guarda snapshots históricos. Si mañana cambia el nombre o precio del producto, el detalle de la venta sigue mostrando lo que se vendió realmente en ese momento.

## Entidades JPA

### `Sale.java`

Representa la cabecera de la venta.

Relaciones:

```java
@ManyToOne(fetch = FetchType.LAZY)
private CashSession cashSession;

@ManyToOne(fetch = FetchType.LAZY)
private User createdBy;

@ManyToOne(fetch = FetchType.LAZY)
private Customer customer;

@OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
private List<SaleItem> items;
```

Decisiones importantes:

- Las relaciones son `LAZY` para no cargar datos innecesarios.
- `items` usa `cascade = CascadeType.ALL`, porque los artículos pertenecen a la venta.
- `orphanRemoval = true` mantiene consistencia si se removieran artículos desde la entidad.
- Se usa `BigDecimal` para dinero y cantidades.
- Se usa `OffsetDateTime` para fechas.

Método importante:

```java
public void addItem(SaleItem item) {
    items.add(item);
    item.setSale(this);
}
```

Este método mantiene correctamente ambos lados de la relación:

- Agrega el item a la lista de la venta.
- Asigna la venta dentro del item.

Esto evita errores típicos de JPA donde el hijo queda sin referencia al padre.

`@PrePersist`:

```java
@PrePersist
public void prePersist() {
    if (createdAt == null) {
        createdAt = OffsetDateTime.now();
    }
}
```

Antes de insertar, asigna `createdAt` si todavía no existe.

### `SaleItem.java`

Representa una línea de venta.

Campos importantes:

- `product`: relación al producto actual.
- `productName`: snapshot histórico.
- `productBarcode`: snapshot histórico.
- `productUnit`: snapshot histórico.
- `quantity`: cantidad vendida.
- `unitPrice`: precio histórico.
- `unitCost`: costo histórico.
- `lineTotal`: total de línea.

Aunque existe relación con `Product`, el detalle al usuario debe mostrar los snapshots guardados en `sale_items`, no el nombre o precio actual del producto.

### `SaleType.java`

```java
public enum SaleType {
    CASH,
    CREDIT
}
```

`CREDIT` existe en base de datos y dominio para crecimiento futuro, pero el servicio lo rechaza en esta fase.

### `SaleStatus.java`

```java
public enum SaleStatus {
    COMPLETED,
    CANCELLED
}
```

`CANCELLED` existe para futuro, pero no se implementó cancelación.

## DTOs

El proyecto no expone entidades JPA. Todo pasa por DTOs.

### `SaleRequest.java`

Request para crear una venta.

Recibe únicamente:

- `saleType`
- `customerId`
- `cashReceived`
- `items`

No recibe:

- usuario
- caja
- precio
- costo
- total
- cambio
- fecha
- estado
- stock

El backend es la fuente de verdad.

### `SaleItemRequest.java`

Request de cada artículo:

- `productId`
- `quantity`

El frontend no manda precio ni costo.

### `SaleResponse.java`

Respuesta usada al crear una venta.

Incluye:

- datos generales de venta
- total
- efectivo recibido
- cambio
- artículos

### `SaleSummaryResponse.java`

Respuesta ligera para listados.

Incluye:

- `id`
- `createdAt`
- `createdById`
- `createdByUsername`
- `customerId`
- `customerFullName`
- `saleType`
- `status`
- `total`
- `totalItems`

No incluye todos los artículos. Esto evita listados pesados y problemas de rendimiento.

### `SaleDetailResponse.java`

Respuesta completa para el detalle.

Incluye:

- `id`
- `cashSessionId`
- `createdById`
- `createdByUsername`
- `customerId`
- `customerFullName`
- `saleType`
- `status`
- `total`
- `cashReceived`
- `changeAmount`
- `createdAt`
- `cancelledAt`
- `items`

Se usa para:

```text
GET /api/sales/{id}
```

### `SaleItemResponse.java`

Respuesta de cada artículo vendido:

- `id`
- `productId`
- `productName`
- `productBarcode`
- `productUnit`
- `quantity`
- `unitPrice`
- `lineTotal`

No expone `unitCost`.

## Mapper MapStruct

Archivo:

```text
SaleMapper.java
```

Convierte entidades JPA a DTOs.

Métodos:

```java
SaleResponse toResponse(Sale sale);
SaleDetailResponse toDetailResponse(Sale sale);
SaleItemResponse toItemResponse(SaleItem saleItem);
List<SaleResponse> toResponseList(List<Sale> sales);
```

Mapeos importantes:

```java
@Mapping(target = "cashSessionId", source = "cashSession.id")
@Mapping(target = "createdById", source = "createdBy.id")
@Mapping(target = "createdByUsername", source = "createdBy.username")
@Mapping(target = "customerId", source = "customer.id")
@Mapping(target = "customerFullName", expression = "java(toCustomerFullName(sale.getCustomer()))")
```

Esto permite que el response tenga IDs y nombres simples sin exponer entidades completas.

Método auxiliar:

```java
default String toCustomerFullName(Customer customer) {
    if (customer == null) {
        return null;
    }
    return customer.getFirstName() + " " + customer.getLastName();
}
```

Si no hay cliente, devuelve `null`. En listados se usa `Público general` desde la consulta.

## Repositorio

Archivo:

```text
SaleRepository.java
```

Extiende:

```java
JpaRepository<Sale, Long>
```

### `findByIdWithDetails`

```java
@EntityGraph(attributePaths = {"cashSession", "createdBy", "customer", "items", "items.product"})
@Query("""
        SELECT s
        FROM Sale s
        WHERE s.id = :id
        """)
Optional<Sale> findByIdWithDetails(@Param("id") Long id);
```

Sirve para el detalle de venta.

Usa `@EntityGraph` para cargar:

- caja
- usuario
- cliente
- artículos
- producto de cada artículo

Esto evita `LazyInitializationException` y evita N+1 en el detalle.

No se usa para listados paginados porque cargar colecciones en una paginación puede romper o volver muy pesada la consulta.

### `findSummariesByCashSessionId`

Consulta ventas de una caja específica.

Se usa en:

```text
GET /api/sales/current-session
```

Devuelve directamente `SaleSummaryResponse` desde JPQL:

```java
SELECT new com.angelica.pos.sale.dto.SaleSummaryResponse(...)
```

Ventaja:

- No carga entidades completas.
- No carga todos los artículos.
- Calcula `COUNT(item.id)` en base de datos.
- Devuelve sólo lo necesario para la tabla.

### `findSummaries`

Consulta el historial global con filtros:

- `id`
- `customerId`
- `createdByUserId`
- `status`
- `saleType`
- `from`
- `to`

También devuelve `SaleSummaryResponse` directamente.

Importante:

```java
AND s.createdAt >= COALESCE(:from, s.createdAt)
AND s.createdAt <= COALESCE(:to, s.createdAt)
```

Esta forma evita un error de PostgreSQL:

```text
ERROR: could not determine data type of parameter
```

Ese error ocurría cuando se usaba:

```sql
:from IS NULL OR s.createdAt >= :from
```

Cuando `from` era `null`, PostgreSQL no podía inferir el tipo del parámetro. Con `COALESCE(:from, s.createdAt)`, el parámetro toma el tipo de `createdAt`.

## Servicio

Archivos:

```text
SaleService.java
SaleServiceImpl.java
```

El controller no contiene reglas de negocio. Sólo recibe requests y delega al servicio.

### Métodos públicos

```java
SaleResponse create(SaleRequest request, AuthenticatedUser authenticatedUser);
SaleDetailResponse findById(Long id, AuthenticatedUser authenticatedUser);
PageResponse<SaleSummaryResponse> findCurrentSession(AuthenticatedUser authenticatedUser, Pageable pageable);
PageResponse<SaleSummaryResponse> findAll(...);
```

### `create`

Crea una venta en efectivo dentro de una sola transacción:

```java
@Transactional
public SaleResponse create(...)
```

Flujo:

1. Valida el request.
2. Obtiene el usuario autenticado activo.
3. Busca la caja abierta del usuario.
4. Busca cliente si se envió `customerId`.
5. Agrupa productos repetidos.
6. Ordena IDs de productos.
7. Bloquea productos activos con estrategia de inventario.
8. Valida existencia y stock.
9. Toma precio y costo desde base de datos.
10. Calcula líneas y total.
11. Valida efectivo suficiente.
12. Calcula cambio.
13. Guarda la venta y sus items.
14. Crea movimientos de inventario por item.
15. Crea un movimiento de caja por el total.

Todo ocurre en la misma transacción. Si falla cualquier paso, no se guarda nada.

### `validateCreateRequest`

Valida:

- sólo `CASH`
- no permite `CREDIT`
- lista de artículos obligatoria
- máximo de líneas
- efectivo recibido
- cada item

### `validateCashReceived`

Valida:

- no nulo
- mayor que cero
- máximo dos decimales
- máximo de dígitos enteros

### `validateSaleItem`

Valida:

- item no nulo
- `productId` positivo
- cantidad obligatoria
- cantidad mayor que cero
- máximo dos decimales
- máximo de dígitos enteros

### `groupQuantities`

Agrupa productos repetidos:

```java
quantitiesByProductId.merge(item.getProductId(), item.getQuantity(), BigDecimal::add);
```

Si el frontend manda dos veces el mismo producto, backend crea un solo `SaleItem` con cantidad sumada.

### `validateProductsAndStock`

Valida que cada producto:

- exista
- esté activo
- tenga stock suficiente

Si no hay stock, lanza `InsufficientStockException`.

### `findById`

Consulta detalle:

```java
@Transactional(readOnly = true)
public SaleDetailResponse findById(...)
```

Flujo:

1. Valida usuario activo.
2. Busca venta con detalle.
3. Si no existe, lanza `SaleNotFoundException`.
4. Si el usuario no es ADMIN y no creó la venta, lanza `SaleAccessDeniedException`.
5. Devuelve `SaleDetailResponse`.

Regla:

- ADMIN consulta cualquier venta.
- CASHIER sólo consulta ventas propias.

### `findCurrentSession`

Consulta ventas de la caja abierta del usuario:

```java
@Transactional(readOnly = true)
public PageResponse<SaleSummaryResponse> findCurrentSession(...)
```

Flujo:

1. Valida tamaño máximo de página.
2. Valida usuario activo.
3. Busca caja abierta.
4. Si no existe, lanza `OpenCashSessionRequiredException`.
5. Consulta resumen paginado por `cashSessionId`.

### `findAll`

Consulta historial global:

```java
@Transactional(readOnly = true)
public PageResponse<SaleSummaryResponse> findAll(...)
```

Valida:

- tamaño máximo de página 50
- `from` no puede ser posterior a `to`

Después delega a `SaleRepository.findSummaries`.

Este método lo consume sólo ADMIN por seguridad.

### `toSummaryPageResponse`

Convierte `Page<SaleSummaryResponse>` a `PageResponse<SaleSummaryResponse>`.

El proyecto usa `PageResponse` compartido para tener una respuesta estable:

- `content`
- `page`
- `size`
- `totalElements`
- `totalPages`
- `first`
- `last`

## Controller

Archivo:

```text
SaleController.java
```

Base path:

```text
/api/sales
```

### Crear venta

```http
POST /api/sales
```

Request:

```json
{
  "saleType": "CASH",
  "customerId": null,
  "cashReceived": 400.00,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

Respuesta:

- `201 Created`
- Header `Location`
- `SaleResponse`

El usuario se obtiene con:

```java
@AuthenticationPrincipal AuthenticatedUser authenticatedUser
```

### Ventas de sesión actual

```http
GET /api/sales/current-session
```

Roles:

- ADMIN
- CASHIER

Devuelve:

```java
PageResponse<SaleSummaryResponse>
```

Si no hay caja abierta:

```http
409 Conflict
```

### Detalle de venta

```http
GET /api/sales/{id}
```

Valida:

```java
@Positive(message = "Sale id must be positive")
```

Devuelve:

```java
SaleDetailResponse
```

Reglas:

- ADMIN puede consultar cualquiera.
- CASHIER sólo las propias.
- Si no existe: `404`.
- Si no tiene acceso: `403`.

### Historial global

```http
GET /api/sales
```

Sólo ADMIN.

Filtros:

- `id`
- `folio`
- `customerId`
- `createdByUserId`
- `status`
- `saleType`
- `from`
- `to`
- `page`
- `size`
- `sort`

`folio` e `id` apuntan al mismo valor efectivo:

```java
Long effectiveId = id == null ? folio : id;
```

Esto permite que frontend use la palabra "folio" sin cambiar la entidad.

## Seguridad

Archivo:

```text
SecurityConfig.java
```

Reglas relevantes:

```java
.requestMatchers(HttpMethod.POST, "/api/sales")
    .hasAnyRole("ADMIN", "CASHIER")
.requestMatchers(HttpMethod.GET, "/api/sales/current-session")
    .hasAnyRole("ADMIN", "CASHIER")
.requestMatchers(HttpMethod.GET, "/api/sales/*")
    .hasAnyRole("ADMIN", "CASHIER")
.requestMatchers(HttpMethod.GET, "/api/sales")
    .hasRole("ADMIN")
```

Además, el servicio valida propiedad:

```java
if (authenticated.getRole() != Role.ADMIN
        && !sale.getCreatedBy().getId().equals(authenticated.getId())) {
    throw new SaleAccessDeniedException();
}
```

Esto es importante porque la seguridad por ruta sólo sabe si el usuario puede entrar al endpoint. La regla de negocio sobre "esta venta es mía o no" vive en el servicio.

## Excepciones

### `SaleNotFoundException`

Se usa cuando una venta no existe.

HTTP:

```text
404 Not Found
```

### `SaleAccessDeniedException`

Se usa cuando un CASHIER intenta consultar una venta ajena.

HTTP:

```text
403 Forbidden
```

### `CreditSaleNotAvailableException`

Se usa cuando intentan crear una venta `CREDIT`.

HTTP:

```text
409 Conflict
```

### `InsufficientCashReceivedException`

Se usa cuando el efectivo recibido no cubre el total.

HTTP:

```text
409 Conflict
```

### `OpenCashSessionRequiredException`

Viene del módulo de caja.

Se usa cuando no hay caja abierta.

HTTP:

```text
409 Conflict
```

Todas se integran en:

```text
GlobalExceptionHandler.java
```

No se creó otro `@RestControllerAdvice`.

## Integración con Inventario

Al crear venta, por cada `SaleItem` se llama:

```java
inventoryMovementService.registerSaleMovement(
    item.getProduct(),
    item.getQuantity(),
    item.getId(),
    user
);
```

Esto registra un movimiento:

- `direction = OUT`
- `type = SALE`
- `sourceType = SALE_ITEM`
- `sourceId = id del SaleItem`

No se expone endpoint público para crear movimientos `SALE` manualmente.

## Integración con Caja

Al crear venta se llama:

```java
cashMovementService.registerCashSale(cashSession, user, total, savedSale.getId());
```

Esto registra un movimiento:

- `direction = INFLOW`
- `type = CASH_SALE`
- `amount = total`
- `sourceType = SALE`
- `sourceId = id de la venta`

Importante:

Si la venta cuesta `$185`, el cliente paga `$400` y recibe `$215` de cambio, el movimiento de caja es `$185`, no `$400`.

## Transacciones

Crear venta usa:

```java
@Transactional
```

Esto protege el flujo completo:

- venta
- items
- stock
- movimientos de inventario
- movimiento de caja

Si algo falla, la transacción hace rollback.

Consultas usan:

```java
@Transactional(readOnly = true)
```

Esto comunica que no modifican datos y permite optimizaciones.

No se usa `REQUIRES_NEW`.

## Concurrencia

Para crear venta:

1. Se agrupan productos.
2. Se ordenan IDs.
3. Se bloquean productos con el método existente de inventario.

Ordenar IDs reduce el riesgo de deadlocks cuando dos usuarios venden productos similares al mismo tiempo.

El stock se valida después de bloquear.

## Paginación

El tamaño máximo es:

```java
private static final int MAX_PAGE_SIZE = 50;
```

Si se pide más:

```java
throw new IllegalArgumentException("El tamano de pagina no debe superar 50 registros");
```

`GlobalExceptionHandler` convierte `IllegalArgumentException` en:

```text
400 Bad Request
```

## Filtros del Historial

Filtros disponibles:

```text
id
folio
customerId
createdByUserId
status
saleType
from
to
```

Reglas:

- IDs deben ser positivos.
- `from` no puede ser posterior a `to`.
- Los filtros se ejecutan en base de datos.
- No se cargan ventas en memoria para filtrar.

## Estrategia para Evitar N+1

Listados:

- Devuelven `SaleSummaryResponse` directo desde JPQL.
- No cargan entidades completas.
- No cargan colección completa de items.
- Usan `COUNT(item.id)` para calcular líneas.

Detalle:

- Usa `@EntityGraph`.
- Carga todo lo necesario para una venta específica.
- No se usa paginación en detalle.

Esto evita:

- N+1.
- `LazyInitializationException`.
- `JOIN FETCH` de colecciones en listados paginados.

## Pruebas

Archivos:

```text
SaleServiceImplTest.java
SaleControllerTest.java
SaleRequestValidationTest.java
```

Cubren, entre otros:

- Venta válida.
- Total y cambio correctos.
- Agrupación de productos repetidos.
- Cliente opcional.
- Stock insuficiente.
- Efectivo insuficiente.
- CREDIT rechazado.
- Caja abierta requerida.
- CASHIER consulta venta propia.
- CASHIER no consulta venta ajena.
- ADMIN consulta historial.
- Historial con filtros.
- Rango de fechas inválido.
- Tamaño de página mayor a 50.
- Detalle con snapshots históricos.
- No persistir nada si falla una venta con varios productos.

## Cómo Crear un Módulo Similar

Para crear otro módulo siguiendo esta arquitectura:

1. Crear migración Flyway.
2. Crear entidades JPA con relaciones `LAZY`.
3. Crear enums si hay estados o tipos.
4. Crear DTOs separados para request, resumen y detalle.
5. Crear mapper MapStruct.
6. Crear repository con consultas específicas.
7. Crear interface de servicio.
8. Crear implementación con transacciones.
9. Crear controller delgado.
10. Agregar excepciones propias.
11. Integrar excepciones en `GlobalExceptionHandler`.
12. Agregar reglas en `SecurityConfig`.
13. Agregar pruebas de servicio, controller y validación.

Regla clave:

El controller no debe tener lógica de negocio. La lógica vive en el servicio.

## Checklist Mental

Antes de dar por terminado un módulo:

- ¿Hay migración Flyway?
- ¿`ddl-auto` sigue en `validate`?
- ¿Los DTOs no exponen entidades?
- ¿Los endpoints tienen seguridad?
- ¿El servicio valida permisos finos?
- ¿Las operaciones de escritura son transaccionales?
- ¿Los listados son paginados?
- ¿Los filtros ocurren en base de datos?
- ¿Se evita N+1?
- ¿Las excepciones llegan al `GlobalExceptionHandler`?
- ¿Hay pruebas?

## Verificación

Comandos esperados:

```bash
./mvnw clean verify
```

Si no existe wrapper:

```bash
mvn clean verify
```

En este entorno de trabajo no se pudo ejecutar Maven porque Java/Maven no están disponibles:

```text
The JAVA_HOME environment variable is not defined correctly
```

Y el fallback:

```text
mvn: command not found
```

Para verificar localmente, ejecuta el comando desde `pos-backend` con Java 17 configurado.
