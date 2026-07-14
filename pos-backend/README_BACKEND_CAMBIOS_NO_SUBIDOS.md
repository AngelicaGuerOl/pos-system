# Documentacion de cambios backend no subidos

Este documento resume los cambios pendientes en `pos-backend` relacionados con ventas fiadas, cuentas por cobrar y abonos. La documentacion se basa en el estado actual del repositorio local y esta enfocada en explicar que se agrego o modifico, para que sirve cada parte y como se integra con la arquitectura existente.

## Alcance

- Se trabajo solo en el backend Spring Boot.
- No se agregaron dependencias nuevas.
- No se modificaron migraciones anteriores.
- Se mantuvo `spring.jpa.hibernate.ddl-auto=validate`.
- Se conservaron las capas existentes: controller, service, repository, mapper, DTOs, entity, exceptions y migraciones Flyway.
- No se implemento frontend, devoluciones, cancelaciones de ventas, intereses, limite de credito ni cierre de caja.

## Resumen funcional

Se agregaron dos capacidades principales:

1. Ventas fiadas con `saleType = CREDIT`.
   - La venta se registra como completada.
   - El inventario se descuenta.
   - No se crea movimiento de efectivo.
   - Se crea automaticamente una cuenta por cobrar.

2. Abonos en efectivo a cuentas por cobrar.
   - El abono actualiza saldo pagado, saldo pendiente y estado de la deuda.
   - El abono crea automaticamente un `CashMovement` de entrada.
   - La operacion completa corre en una sola transaccion.
   - Se bloquea la cuenta por cobrar al registrar el abono para evitar saldos incorrectos por concurrencia.

## Migraciones Flyway

### `src/main/resources/db/migration/V7__create_receivables.sql`

Crea la base de datos para cuentas por cobrar y ajusta ventas para soportar fiado.

Cambios principales:

- Ajusta `sales.cash_received` y `sales.change_amount` para permitir `NULL`.
- Reemplaza las restricciones anteriores de efectivo por `chk_sales_payment_fields_by_type`.
- Para ventas `CASH` exige:
  - `cash_received IS NOT NULL`.
  - `change_amount IS NOT NULL`.
  - `cash_received >= total`.
  - `change_amount = cash_received - total`.
- Para ventas `CREDIT` exige:
  - `customer_id IS NOT NULL`.
  - `cash_received IS NULL`.
  - `change_amount IS NULL`.
- Crea la tabla `receivables`.
- Garantiza una sola cuenta por cobrar por venta mediante `sale_id UNIQUE`.
- Agrega llaves foraneas a `sales` y `customers` con `ON DELETE RESTRICT` y `ON UPDATE RESTRICT`.
- Agrega estados permitidos:
  - `PENDING`
  - `PARTIALLY_PAID`
  - `PAID`
  - `CANCELLED`
- Agrega restricciones de importes y consistencia del saldo.
- Agrega indices por `customer_id`, `status` y `created_at`.

### `src/main/resources/db/migration/V8__create_receivable_payments.sql`

Crea la tabla de abonos a cuentas por cobrar.

Cambios principales:

- Crea `receivable_payments`.
- Relaciona cada abono con:
  - `receivables`.
  - `cash_sessions`.
  - `users`.
- Exige `amount > 0`.
- Permite `notes` opcional de hasta 255 caracteres.
- Agrega indices por:
  - `receivable_id`.
  - `cash_session_id`.
  - `received_by_user_id`.
  - `created_at`.

## Cambios en ventas

### `src/main/java/com/angelica/pos/sale/dto/SaleRequest.java`

Se ajusto el request de venta para soportar ventas en efectivo y fiadas con reglas distintas:

- `saleType` sigue siendo obligatorio.
- `cashReceived` ahora puede ser `null` para ventas `CREDIT`.
- Para ventas `CASH`, el servicio sigue exigiendo efectivo recibido.
- Para ventas `CREDIT`, el servicio rechaza efectivo recibido.

Esto permite que el frontend envie:

```json
{
  "saleType": "CREDIT",
  "customerId": 15,
  "cashReceived": null,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

### `src/main/java/com/angelica/pos/sale/entity/Sale.java`

Se ajusto la entidad para representar ambos tipos de venta:

- `cashReceived` puede ser `null` en ventas fiadas.
- `changeAmount` puede ser `null` en ventas fiadas.
- Se agrego la relacion uno a uno con `Receivable`.

La venta sigue siendo la fuente de la entrega de productos; el estado de la deuda se controla aparte en `Receivable`.

### `src/main/java/com/angelica/pos/sale/service/SaleServiceImpl.java`

Se extendio el flujo transaccional de `POST /api/sales`.

Para `CASH`:

- Requiere caja abierta.
- El cliente es opcional.
- Requiere `cashReceived`.
- Calcula `changeAmount`.
- Crea `Sale` y `SaleItems`.
- Descuenta inventario.
- Crea `InventoryMovement` por articulo.
- Crea `CashMovement` tipo `CASH_SALE`.
- No crea `Receivable`.

Para `CREDIT`:

- Requiere caja abierta.
- Requiere cliente activo.
- Rechaza `cashReceived`.
- Deja `changeAmount` en `null`.
- Calcula el total en backend.
- Crea `Sale` y `SaleItems`.
- Descuenta inventario.
- Crea `InventoryMovement` por articulo.
- No crea `CashMovement`.
- Crea una cuenta por cobrar con estado `PENDING`.

Todo se ejecuta dentro de la misma transaccion. Si falla la creacion de la cuenta por cobrar, se revierte la venta, sus items, movimientos de inventario y cambios de stock.

### `src/main/java/com/angelica/pos/sale/mapper/SaleMapper.java`

Se integro el mapeo de informacion de cuenta por cobrar en las respuestas de venta usando MapStruct y el mapper de `Receivable`.

### DTOs de ventas modificados

- `src/main/java/com/angelica/pos/sale/dto/SaleResponse.java`
- `src/main/java/com/angelica/pos/sale/dto/SaleDetailResponse.java`
- `src/main/java/com/angelica/pos/sale/dto/SaleSummaryResponse.java`

Ahora pueden incluir informacion opcional de la cuenta por cobrar asociada. Para ventas en efectivo, este objeto queda en `null`.

### `src/main/java/com/angelica/pos/sale/dto/SaleReceivableResponse.java`

DTO nuevo para exponer un resumen de la cuenta por cobrar dentro de respuestas de venta:

- `id`.
- `originalAmount`.
- `paidAmount`.
- `outstandingBalance`.
- `status`.

No expone entidades JPA.

### `src/main/java/com/angelica/pos/sale/repository/SaleRepository.java`

Se ajustaron consultas para traer correctamente la informacion necesaria de ventas con cliente, usuario, items y cuenta por cobrar, evitando problemas de carga perezosa en detalle e historial.

### Excepciones nuevas de ventas

- `src/main/java/com/angelica/pos/sale/exception/CreditSaleCustomerRequiredException.java`
  - Se usa cuando una venta fiada no trae cliente.
- `src/main/java/com/angelica/pos/sale/exception/CreditSaleCashReceivedNotAllowedException.java`
  - Se usa cuando una venta fiada intenta enviar efectivo recibido.

## Modulo de cuentas por cobrar

Paquete principal:

`src/main/java/com/angelica/pos/receivable`

### Entidades

#### `entity/Receivable.java`

Representa la deuda generada por una venta fiada.

Campos principales:

- `id`.
- `sale`.
- `customer`.
- `originalAmount`.
- `paidAmount`.
- `outstandingBalance`.
- `status`.
- `createdAt`.
- `paidAt`.

Usa relaciones `LAZY`, `BigDecimal` para importes y `OffsetDateTime` para fechas.

#### `entity/ReceivableStatus.java`

Enum de estados:

- `PENDING`: deuda creada sin abonos.
- `PARTIALLY_PAID`: deuda con abonos parciales.
- `PAID`: deuda liquidada.
- `CANCELLED`: estado reservado para cancelacion futura, sin implementar flujo de cancelacion.

### DTOs

#### `dto/ReceivableSummaryResponse.java`

Respuesta resumida para listados paginados:

- ID de cuenta.
- ID de venta.
- ID de cliente.
- Nombre completo del cliente.
- Importe original.
- Pagado.
- Saldo pendiente.
- Estado.
- Fechas.

#### `dto/ReceivableDetailResponse.java`

Respuesta de detalle:

- Informacion del resumen.
- Venta asociada.
- Usuario que registro la venta.
- Fecha de venta.
- Datos basicos del cliente.

#### `dto/ReceivableCustomerResponse.java`

DTO auxiliar para exponer datos basicos del cliente sin entregar la entidad completa.

### Mapper

#### `mapper/ReceivableMapper.java`

MapStruct centraliza la conversion de entidad a DTO:

- Convierte `Receivable` a respuesta resumida.
- Convierte `Receivable` a detalle.
- Construye nombre completo del cliente.
- Mapea informacion asociada de venta y cliente.

### Repository

#### `repository/ReceivableRepository.java`

Responsabilidades:

- Buscar cuentas por cobrar.
- Validar existencia por venta.
- Obtener detalle con relaciones necesarias.
- Buscar y bloquear una cuenta por cobrar para registrar abonos.

La busqueda bloqueada usa bloqueo pesimista para evitar que dos abonos simultaneos superen el saldo pendiente.

### Service

#### `service/ReceivableService.java`

Contrato del modulo de cuentas por cobrar.

#### `service/ReceivableServiceImpl.java`

Responsabilidades:

- Crear la cuenta por cobrar desde una venta fiada.
- Consultar historial global paginado.
- Consultar detalle por ID.
- Consultar cuentas por cliente.
- Validar rango de fechas.
- Limitar tamano de pagina a 50.
- Usar `PageResponse` compartido.

Los filtros se aplican en base de datos mediante `Specification`, no en memoria.

### Controller

#### `controller/ReceivableController.java`

Endpoints agregados:

- `GET /api/receivables`
  - Historial global.
  - Solo `ADMIN`.
  - Filtros: `customerId`, `saleId`, `status`, `from`, `to`.
  - Paginado.
  - Orden por defecto: `createdAt DESC`.

- `GET /api/receivables/{id}`
  - Detalle de cuenta.
  - `ADMIN` y `CASHIER`.
  - Valida ID positivo.

- `GET /api/customers/{customerId}/receivables`
  - Cuentas por cobrar de un cliente.
  - `ADMIN` y `CASHIER`.
  - Valida cliente.
  - Filtro opcional por `status`.
  - Paginado.

### Excepciones de cuentas por cobrar

- `exception/ReceivableNotFoundException.java`
  - Cuenta por cobrar inexistente.
- `exception/SaleAlreadyHasReceivableException.java`
  - Evita crear mas de una cuenta por cobrar para la misma venta.

## Modulo de abonos

Paquete principal:

`src/main/java/com/angelica/pos/receivable/payment`

### Entidad

#### `entity/ReceivablePayment.java`

Representa un abono en efectivo registrado sobre una cuenta por cobrar.

Campos:

- `id`.
- `receivable`.
- `cashSession`.
- `receivedBy`.
- `amount`.
- `notes`.
- `createdAt`.

Los abonos son registros de auditoria: no se agregaron endpoints para editar o eliminar.

### DTOs

#### `dto/ReceivablePaymentRequest.java`

Request para registrar abonos:

```json
{
  "amount": 300.00,
  "notes": "Abono semanal"
}
```

Validaciones:

- `amount` obligatorio.
- Mayor que cero.
- Hasta dos decimales.
- `notes` opcional.
- `notes` maximo 255 caracteres.

El frontend no debe enviar `receivableId`, usuario, caja, saldo, estado ni movimiento de caja.

#### `dto/ReceivablePaymentResponse.java`

Respuesta del abono:

- ID del abono.
- ID de cuenta por cobrar.
- ID de venta.
- ID y nombre del cliente.
- ID de caja.
- ID y username del usuario que recibio.
- Monto.
- Notas.
- Fecha.
- `paidAmount` actualizado.
- `outstandingBalance` actualizado.
- `receivableStatus` actualizado.

### Mapper

#### `mapper/ReceivablePaymentMapper.java`

MapStruct transforma `ReceivablePayment` a `ReceivablePaymentResponse`, incluyendo datos relacionados de cuenta, venta, cliente, caja y usuario.

### Repository

#### `repository/ReceivablePaymentRepository.java`

Responsabilidades:

- Consultar abonos paginados por cuenta.
- Consultar detalle de un abono con sus relaciones.
- Ordenar por `createdAt DESC` desde el `Pageable`.

### Service

#### `service/ReceivablePaymentService.java`

Contrato del modulo de abonos.

#### `service/ReceivablePaymentServiceImpl.java`

Implementa el flujo transaccional de registro de abono:

1. Valida request.
2. Obtiene el usuario autenticado y verifica que este activo.
3. Busca la caja abierta del usuario.
4. Bloquea la cuenta por cobrar con bloqueo pesimista.
5. Rechaza cuentas `PAID` o `CANCELLED`.
6. Rechaza abonos mayores al saldo pendiente.
7. Actualiza:
   - `paidAmount = paidAmount + amount`.
   - `outstandingBalance = originalAmount - paidAmount`.
8. Si el saldo queda en cero:
   - cambia estado a `PAID`.
   - asigna `paidAt`.
9. Si queda saldo:
   - cambia estado a `PARTIALLY_PAID`.
   - mantiene `paidAt = null`.
10. Guarda el abono.
11. Crea el `CashMovement` de entrada mediante el servicio de caja.

La transaccion no usa `REQUIRES_NEW`. Si falla cualquier paso, se revierte el abono, el saldo de la cuenta y el movimiento de caja.

### Controller

#### `controller/ReceivablePaymentController.java`

Endpoints agregados:

- `POST /api/receivables/{receivableId}/payments`
  - Registra un abono.
  - Roles: `ADMIN`, `CASHIER`.
  - Responde `201 Created`.
  - Agrega header `Location` hacia `/api/receivable-payments/{id}`.

- `GET /api/receivables/{receivableId}/payments`
  - Consulta abonos de una cuenta.
  - Roles: `ADMIN`, `CASHIER`.
  - Paginado.
  - Orden por defecto: `createdAt DESC`.
  - Tamano maximo: 50.

- `GET /api/receivable-payments/{id}`
  - Consulta un abono por ID.
  - Roles: `ADMIN`, `CASHIER`.
  - Devuelve 404 cuando no existe.

### Excepciones de abonos

- `exception/ReceivablePaymentNotFoundException.java`
  - Abono inexistente.
- `exception/ReceivableAlreadyPaidException.java`
  - Se intenta abonar una cuenta ya pagada.
- `exception/ReceivableCancelledException.java`
  - Se intenta abonar una cuenta cancelada.
- `exception/ReceivablePaymentExceedsBalanceException.java`
  - El abono supera el saldo pendiente.

## Integracion con movimientos de caja

### `src/main/java/com/angelica/pos/cash/movement/service/CashMovementService.java`

Se agrego un metodo interno para registrar entradas de efectivo por abonos a cuentas por cobrar.

### `src/main/java/com/angelica/pos/cash/movement/service/CashMovementServiceImpl.java`

Se agrego `registerReceivablePayment(...)`.

Comportamiento:

- Crea un movimiento `INFLOW`.
- Usa tipo `RECEIVABLE_PAYMENT`.
- Usa descripcion `Abono a cuenta por cobrar`.
- Usa `sourceType = RECEIVABLE_PAYMENT`.
- Usa `sourceId = paymentId`.
- Participa en la misma transaccion del abono.
- No se expone como endpoint manual.

El flujo existente de ventas en efectivo, entradas manuales y salidas manuales se conserva.

## Seguridad

### `src/main/java/com/angelica/pos/security/SecurityConfig.java`

Se agregaron reglas respetando el orden existente.

Permisos de ventas:

- `POST /api/sales`
  - `ADMIN`
  - `CASHIER`

Permisos de cuentas por cobrar:

- `GET /api/receivables`
  - Solo `ADMIN`.
- `GET /api/receivables/{id}`
  - `ADMIN`
  - `CASHIER`.
- `GET /api/customers/{customerId}/receivables`
  - `ADMIN`
  - `CASHIER`.

Permisos de abonos:

- `POST /api/receivables/{receivableId}/payments`
  - `ADMIN`
  - `CASHIER`.
- `GET /api/receivables/{receivableId}/payments`
  - `ADMIN`
  - `CASHIER`.
- `GET /api/receivable-payments/{id}`
  - `ADMIN`
  - `CASHIER`.

Se mantiene JWT, CORS, `MustChangePasswordFilter` y el manejo actual de 401/403.

## Manejo de errores

### `src/main/java/com/angelica/pos/shared/exception/GlobalExceptionHandler.java`

Se integraron las nuevas excepciones al manejador global existente. No se creo otro `@RestControllerAdvice`.

Codigos usados:

- `400 Bad Request`
  - Validaciones invalidas.
  - IDs no positivos.
  - Rango de fechas invalido.
  - Tamano de pagina mayor a 50.
- `404 Not Found`
  - Cuenta por cobrar inexistente.
  - Abono inexistente.
  - Cliente inexistente o inactivo.
- `409 Conflict`
  - Caja abierta requerida.
  - Venta ya asociada a una cuenta por cobrar.
  - Cuenta ya pagada.
  - Cuenta cancelada.
  - Abono mayor al saldo pendiente.

## Concurrencia

Para abonos se usa bloqueo pesimista sobre `Receivable` desde `ReceivableRepository.findByIdForUpdate(...)`.

Objetivo:

- Evitar que dos abonos simultaneos lean el mismo saldo pendiente.
- Evitar que la suma de abonos supere la deuda real.
- Mantener consistentes `paidAmount`, `outstandingBalance`, `status` y `paidAt`.

No se usaron bloqueos en memoria ni `synchronized`.

## Paginacion

Se reutiliza `PageResponse` compartido.

Se aplica tamano maximo de pagina de 50 en:

- Historial global de cuentas por cobrar.
- Cuentas por cobrar de cliente.
- Abonos de una cuenta.

Los filtros de cuentas por cobrar se ejecutan en base de datos mediante `Specification`.

## Pruebas agregadas o modificadas

### Ventas

- `src/test/java/com/angelica/pos/sale/controller/SaleControllerTest.java`
- `src/test/java/com/angelica/pos/sale/dto/SaleRequestValidationTest.java`
- `src/test/java/com/angelica/pos/sale/service/SaleServiceImplTest.java`

Cubren principalmente:

- Venta `CASH` existente.
- Venta `CREDIT` valida.
- Cliente obligatorio para venta fiada.
- Rechazo de efectivo recibido en venta fiada.
- Creacion de receivable desde venta fiada.
- Que venta fiada no cree `CashMovement`.
- Respuestas de venta con informacion de cuenta por cobrar.

### Cuentas por cobrar

- `src/test/java/com/angelica/pos/receivable/service/ReceivableServiceImplTest.java`
- `src/test/java/com/angelica/pos/receivable/controller/ReceivableControllerTest.java`

Cubren principalmente:

- Creacion automatica de cuenta por cobrar.
- Consulta paginada.
- Filtros basicos.
- Detalle por ID.
- Cuentas por cobrar por cliente.
- Permisos `ADMIN` y `CASHIER`.
- 404 cuando no existe.

### Abonos

- `src/test/java/com/angelica/pos/receivable/payment/service/ReceivablePaymentServiceImplTest.java`
- `src/test/java/com/angelica/pos/receivable/payment/controller/ReceivablePaymentControllerTest.java`

Cubren principalmente:

- Abono parcial.
- Abono total.
- Cambio de estado a `PAID`.
- Creacion de `CashMovement` tipo `RECEIVABLE_PAYMENT`.
- Rechazo de abono mayor al saldo.
- Rechazo de cuentas `PAID` o `CANCELLED`.
- Rechazo cuando no hay caja abierta.
- Reversion si falla el movimiento de caja.
- Permisos de `ADMIN` y `CASHIER`.
- Usuario no autenticado.

## Contratos principales

### Crear venta fiada

Endpoint:

`POST /api/sales`

Request:

```json
{
  "saleType": "CREDIT",
  "customerId": 15,
  "cashReceived": null,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

Reglas:

- Requiere caja abierta.
- Requiere cliente activo.
- No permite efectivo recibido.
- No crea movimiento de caja.
- Crea cuenta por cobrar.

### Crear venta en efectivo

Endpoint:

`POST /api/sales`

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

Reglas:

- Requiere caja abierta.
- Cliente opcional.
- Requiere efectivo recibido.
- Calcula cambio.
- Crea movimiento de caja `CASH_SALE`.
- No crea cuenta por cobrar.

### Registrar abono

Endpoint:

`POST /api/receivables/{receivableId}/payments`

Request:

```json
{
  "amount": 300.00,
  "notes": "Abono semanal"
}
```

Reglas:

- Requiere usuario autenticado.
- Requiere usuario activo.
- Requiere caja abierta.
- Rechaza cuentas pagadas o canceladas.
- Rechaza monto mayor al saldo.
- Actualiza saldo y estado.
- Crea movimiento de caja `RECEIVABLE_PAYMENT`.

## Archivos creados

### Migraciones

- `src/main/resources/db/migration/V7__create_receivables.sql`
- `src/main/resources/db/migration/V8__create_receivable_payments.sql`

### Modulo `receivable`

- `src/main/java/com/angelica/pos/receivable/entity/Receivable.java`
- `src/main/java/com/angelica/pos/receivable/entity/ReceivableStatus.java`
- `src/main/java/com/angelica/pos/receivable/dto/ReceivableSummaryResponse.java`
- `src/main/java/com/angelica/pos/receivable/dto/ReceivableDetailResponse.java`
- `src/main/java/com/angelica/pos/receivable/dto/ReceivableCustomerResponse.java`
- `src/main/java/com/angelica/pos/receivable/mapper/ReceivableMapper.java`
- `src/main/java/com/angelica/pos/receivable/repository/ReceivableRepository.java`
- `src/main/java/com/angelica/pos/receivable/service/ReceivableService.java`
- `src/main/java/com/angelica/pos/receivable/service/ReceivableServiceImpl.java`
- `src/main/java/com/angelica/pos/receivable/controller/ReceivableController.java`
- `src/main/java/com/angelica/pos/receivable/exception/ReceivableNotFoundException.java`
- `src/main/java/com/angelica/pos/receivable/exception/SaleAlreadyHasReceivableException.java`

### Modulo `receivable.payment`

- `src/main/java/com/angelica/pos/receivable/payment/entity/ReceivablePayment.java`
- `src/main/java/com/angelica/pos/receivable/payment/dto/ReceivablePaymentRequest.java`
- `src/main/java/com/angelica/pos/receivable/payment/dto/ReceivablePaymentResponse.java`
- `src/main/java/com/angelica/pos/receivable/payment/mapper/ReceivablePaymentMapper.java`
- `src/main/java/com/angelica/pos/receivable/payment/repository/ReceivablePaymentRepository.java`
- `src/main/java/com/angelica/pos/receivable/payment/service/ReceivablePaymentService.java`
- `src/main/java/com/angelica/pos/receivable/payment/service/ReceivablePaymentServiceImpl.java`
- `src/main/java/com/angelica/pos/receivable/payment/controller/ReceivablePaymentController.java`
- `src/main/java/com/angelica/pos/receivable/payment/exception/ReceivablePaymentNotFoundException.java`
- `src/main/java/com/angelica/pos/receivable/payment/exception/ReceivableAlreadyPaidException.java`
- `src/main/java/com/angelica/pos/receivable/payment/exception/ReceivableCancelledException.java`
- `src/main/java/com/angelica/pos/receivable/payment/exception/ReceivablePaymentExceedsBalanceException.java`

### Ventas

- `src/main/java/com/angelica/pos/sale/dto/SaleReceivableResponse.java`
- `src/main/java/com/angelica/pos/sale/exception/CreditSaleCustomerRequiredException.java`
- `src/main/java/com/angelica/pos/sale/exception/CreditSaleCashReceivedNotAllowedException.java`

### Pruebas

- `src/test/java/com/angelica/pos/receivable/service/ReceivableServiceImplTest.java`
- `src/test/java/com/angelica/pos/receivable/controller/ReceivableControllerTest.java`
- `src/test/java/com/angelica/pos/receivable/payment/service/ReceivablePaymentServiceImplTest.java`
- `src/test/java/com/angelica/pos/receivable/payment/controller/ReceivablePaymentControllerTest.java`

## Archivos modificados

- `src/main/java/com/angelica/pos/cash/movement/service/CashMovementService.java`
- `src/main/java/com/angelica/pos/cash/movement/service/CashMovementServiceImpl.java`
- `src/main/java/com/angelica/pos/sale/dto/SaleDetailResponse.java`
- `src/main/java/com/angelica/pos/sale/dto/SaleRequest.java`
- `src/main/java/com/angelica/pos/sale/dto/SaleResponse.java`
- `src/main/java/com/angelica/pos/sale/dto/SaleSummaryResponse.java`
- `src/main/java/com/angelica/pos/sale/entity/Sale.java`
- `src/main/java/com/angelica/pos/sale/mapper/SaleMapper.java`
- `src/main/java/com/angelica/pos/sale/repository/SaleRepository.java`
- `src/main/java/com/angelica/pos/sale/service/SaleServiceImpl.java`
- `src/main/java/com/angelica/pos/security/SecurityConfig.java`
- `src/main/java/com/angelica/pos/shared/exception/GlobalExceptionHandler.java`
- `src/test/java/com/angelica/pos/sale/controller/SaleControllerTest.java`
- `src/test/java/com/angelica/pos/sale/dto/SaleRequestValidationTest.java`
- `src/test/java/com/angelica/pos/sale/service/SaleServiceImplTest.java`

## Verificacion local

Intentos realizados previamente:

```bash
./mvnw clean verify
```

Resultado:

```text
The JAVA_HOME environment variable is not defined correctly,
this environment variable is needed to run this program.
```

Tambien se intento:

```bash
mvn clean verify
```

Resultado:

```text
mvn: command not found
```

Por lo tanto, la verificacion completa queda pendiente hasta configurar correctamente Java/Maven en el entorno local.

## Confirmaciones

- No se modificaron migraciones anteriores a `V7`.
- No se agregaron dependencias nuevas.
- No se crearon endpoints publicos para crear cuentas por cobrar manualmente.
- No se implementaron abonos con tarjeta o transferencia.
- No se implementaron edicion ni eliminacion de abonos.
- No se implementaron devoluciones.
- No se implementaron cancelaciones.
- No se implementaron intereses.
- No se implemento limite de credito.
- No se implemento frontend en estos cambios backend.
