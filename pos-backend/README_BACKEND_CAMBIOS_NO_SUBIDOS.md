# Cambios backend pendientes de subir a GitHub

Este documento describe los cambios locales actuales en `pos-backend` que todavia no estan subidos al repositorio remoto. El objetivo principal de estos cambios es agregar devoluciones de ventas, ajustar cuentas por cobrar cuando una venta fiada se devuelve, registrar movimientos de inventario/caja relacionados y bloquear la desactivacion de clientes con saldo pendiente.

No se documentan migraciones anteriores como modificadas: la migracion nueva agregada para esta fase es `V9__create_sale_returns.sql`.

## Resumen funcional

- Se agrego el backend de devoluciones parciales y totales de ventas.
- Se agregaron tablas `sale_returns` y `sale_return_items`.
- Se agrego `returned_quantity` a `sale_items` para controlar cuanto se ha devuelto por articulo.
- Se agregaron estados de venta `PARTIALLY_RETURNED` y `RETURNED`.
- Se agrego el tipo de movimiento de inventario `SALE_RETURN`.
- Se agrego el tipo de movimiento de caja `SALE_REFUND`.
- Se ajustaron cuentas por cobrar con `returned_amount` y `adjusted_amount`.
- Las devoluciones de venta `CASH` generan reembolso en efectivo.
- Las devoluciones de venta `CREDIT` ajustan la cuenta por cobrar y solo reembolsan efectivo si el cliente ya habia pagado mas que el nuevo monto ajustado.
- Se agrego bloqueo para impedir desactivar clientes con saldo pendiente.

## Migracion Flyway

### `src/main/resources/db/migration/V9__create_sale_returns.sql`

Crea y ajusta el esquema necesario para devoluciones:

- Actualiza el `CHECK` de `sales.status` para aceptar:
  - `COMPLETED`
  - `PARTIALLY_RETURNED`
  - `RETURNED`
  - `CANCELLED`
- Agrega `sale_items.returned_quantity`.
  - Sirve para saber cuanto de cada renglon de venta ya fue devuelto.
  - Evita calcular disponibilidad cargando todas las devoluciones en memoria.
- Agrega `receivables.returned_amount`.
  - Guarda el total devuelto acumulado de una venta fiada.
- Agrega `receivables.adjusted_amount`.
  - Representa el monto vigente de la deuda despues de devoluciones.
  - Se calcula como `original_amount - returned_amount`.
- Reemplaza restricciones de `receivables` para que el saldo se calcule contra `adjusted_amount`, no contra `original_amount`.
- Permite el estado `CANCELLED` en cuentas por cobrar cuando una venta fiada queda totalmente devuelta.
- Agrega `SALE_RETURN` a los movimientos de inventario.
- Agrega `SALE_REFUND` a los movimientos de caja.
- Crea `sale_returns`.
  - Guarda la devolucion principal, la venta asociada, usuario que proceso, motivo, total y reembolso en efectivo.
- Crea `sale_return_items`.
  - Guarda los articulos devueltos, cantidad, precio historico y subtotal.
- Agrega indices para consultas por venta, caja, usuario, fecha, articulo y producto.

## Modulo de devoluciones de venta

Paquete nuevo:

`src/main/java/com/angelica/pos/sale/returning`

### Controller

#### `controller/SaleReturnController.java`

Expone los endpoints:

- `POST /api/sales/{saleId}/returns`
  - Registra una devolucion parcial o total.
  - Usa `@AuthenticationPrincipal AuthenticatedUser`.
  - Devuelve `201 Created` con `Location`.
- `GET /api/sales/{saleId}/returns`
  - Lista devoluciones paginadas de una venta.
- `GET /api/sale-returns/{returnId}`
  - Consulta el detalle de una devolucion.

No recibe `userId`, `cashSessionId`, totales ni movimientos desde frontend.

### DTOs

#### `dto/SaleReturnRequest.java`

Request principal para registrar una devolucion.

- Contiene `reason`.
- Contiene lista de articulos `items`.
- No recibe totales, usuario, caja, inventario ni estado nuevo.

#### `dto/SaleReturnItemRequest.java`

Request por articulo a devolver.

- Contiene `saleItemId`.
- Contiene `quantity`.
- El backend valida que pertenezca a la venta y que la cantidad no supere lo disponible.

#### `dto/SaleReturnSummaryResponse.java`

Respuesta resumida para listados.

Incluye:

- ID de devolucion.
- Venta.
- Tipo de venta.
- Total devuelto.
- Reembolso en efectivo.
- Motivo.
- Caja cuando aplique.
- Usuario que proceso.
- Fecha.

#### `dto/SaleReturnDetailResponse.java`

Respuesta de detalle.

Extiende la informacion resumida con:

- Cliente.
- Estado actualizado de venta.
- Cuenta por cobrar actualizada cuando es venta fiada.
- Lista de articulos devueltos.

#### `dto/SaleReturnItemResponse.java`

Respuesta por articulo devuelto.

Incluye:

- `saleItemId`.
- `productId`.
- Nombre historico del producto.
- Codigo historico.
- Unidad.
- Cantidad devuelta.
- Precio unitario historico.
- Subtotal.

### Entities

#### `entity/SaleReturn.java`

Entidad principal de devolucion.

Relaciones:

- `Sale`.
- `CashSession`, opcional.
- `User processedBy`.
- Lista de `SaleReturnItem`.

Sirve como registro auditable e inmutable de una devolucion. Guarda `totalAmount`, `cashRefundAmount`, `reason` y `createdAt`.

#### `entity/SaleReturnItem.java`

Entidad de articulos devueltos.

Relaciones:

- `SaleReturn`.
- `SaleItem`.
- `Product`.

Guarda cantidad, precio historico y subtotal. Permite conservar auditoria aunque el producto cambie despues.

### Mapper

#### `mapper/SaleReturnMapper.java`

Mapper MapStruct para convertir entidades de devolucion a respuestas.

Mapea:

- IDs de venta.
- Tipo de venta.
- Usuario procesador.
- Caja asociada.
- Cliente.
- Items devueltos.

Tambien arma el nombre completo del cliente sin exponer la entidad completa.

### Repository

#### `repository/SaleReturnRepository.java`

Repositorio JPA para devoluciones.

Incluye consultas para:

- Listar devoluciones por venta con paginacion.
- Consultar devolucion por ID con grafo de entidades.
- Sumar monto devuelto por venta cuando el detalle de venta necesita mostrar total devuelto.

### Service

#### `service/SaleReturnService.java`

Contrato del servicio de devoluciones.

Define:

- Registrar devolucion.
- Consultar devoluciones de una venta.
- Consultar devolucion por ID.

#### `service/SaleReturnServiceImpl.java`

Implementacion transaccional de devoluciones.

Responsabilidades principales:

- Valida request, motivo, articulos duplicados, cantidad positiva y escala decimal.
- Obtiene usuario autenticado y verifica que siga activo.
- Bloquea la venta para devolucion.
- Verifica permisos de acceso:
  - `ADMIN` puede operar ventas permitidas.
  - `CASHIER` solo ventas que le correspondan segun reglas actuales.
- Valida que la venta este en estado retornable:
  - `COMPLETED`.
  - `PARTIALLY_RETURNED`.
- Bloquea `SaleItem` solicitados.
- Verifica que los articulos pertenezcan a la venta.
- Calcula cantidad disponible:
  - `quantity - returnedQuantity`.
- Bloquea productos afectados.
- Calcula subtotal con precio historico del `SaleItem`.
- Actualiza `returnedQuantity` en cada `SaleItem`.
- Crea `SaleReturn` y `SaleReturnItem`.
- Restaura inventario mediante `InventoryMovementService.registerSaleReturnMovement`.
- Para venta `CASH`:
  - Reembolsa el total devuelto.
  - Requiere caja abierta.
  - Crea `CashMovement SALE_REFUND`.
- Para venta `CREDIT`:
  - Obtiene y bloquea la cuenta por cobrar.
  - Incrementa `returnedAmount`.
  - Recalcula `adjustedAmount`.
  - Recalcula `paidAmount` y `outstandingBalance`.
  - Cambia estado de cuenta a `PENDING`, `PARTIALLY_PAID`, `PAID` o `CANCELLED`.
  - Solo crea reembolso si el cliente habia pagado mas que el nuevo monto ajustado.
- Actualiza estado de venta:
  - `PARTIALLY_RETURNED` si aun queda cantidad por devolver.
  - `RETURNED` si todos los articulos fueron devueltos.

Toda la operacion se ejecuta en una sola transaccion.

### Excepciones

#### `exception/CreditSaleReceivableRequiredException.java`

Se lanza cuando una venta fiada no tiene cuenta por cobrar asociada y se intenta devolver.

#### `exception/DuplicateSaleReturnItemException.java`

Se lanza cuando el request trae dos veces el mismo `saleItemId`.

#### `exception/SaleItemDoesNotBelongToSaleException.java`

Se lanza cuando el articulo solicitado existe, pero no pertenece a la venta indicada.

#### `exception/SaleReturnItemNotFoundException.java`

Se lanza cuando el `saleItemId` solicitado no existe.

#### `exception/SaleReturnNotAllowedException.java`

Se usa para conflictos de negocio:

- Venta ya devuelta.
- Venta cancelada.
- Estado no retornable.
- Devolucion mayor al monto permitido.

#### `exception/SaleReturnNotFoundException.java`

Se lanza cuando no existe una devolucion por ID.

#### `exception/SaleReturnQuantityExceededException.java`

Se lanza cuando se intenta devolver mas cantidad que la disponible.

## Cambios en ventas

### `sale/entity/SaleStatus.java`

Agrega:

- `PARTIALLY_RETURNED`.
- `RETURNED`.

Sirven para distinguir ventas parcialmente devueltas de ventas completamente devueltas.

### `sale/entity/SaleItem.java`

Agrega `returnedQuantity`.

Sirve para controlar por renglon cuanto ya fue devuelto y calcular disponibilidad sin consultar todas las devoluciones historicas.

### `sale/entity/Sale.java`

Se ajusta la entidad para integrarse con devoluciones y permitir consultar informacion relacionada de forma coherente con el detalle de venta.

### `sale/dto/SaleItemResponse.java`

Agrega informacion de devolucion por articulo:

- Cantidad vendida.
- Cantidad devuelta.
- Cantidad disponible para devolver.

Esto permite al frontend mostrar y validar devoluciones sin consultar productos actuales.

### `sale/dto/SaleDetailResponse.java`

Agrega informacion necesaria para detalle de venta con devoluciones:

- Items con cantidades devueltas/disponibles.
- Total devuelto.
- Cuenta por cobrar actualizada cuando aplique.

### `sale/dto/SaleSummaryResponse.java`

Se ajusta el resumen de venta para incluir informacion de cuenta por cobrar cuando aplica, de forma que historial pueda mostrar estado de pago.

### `sale/dto/SaleReceivableResponse.java`

Agrega campos de cuenta ajustada:

- `returnedAmount`.
- `adjustedAmount`.
- `paidAmount`.
- `outstandingBalance`.
- `status`.

Sirve para que ventas fiadas reflejen correctamente devoluciones y saldo.

### `sale/mapper/SaleMapper.java`

Actualiza el mapeo de respuestas de venta para:

- Exponer cantidades devueltas.
- Exponer cantidades disponibles.
- Mapear datos actualizados de cuenta por cobrar.
- Evitar exponer entidades JPA.

### `sale/repository/SaleRepository.java`

Agrega consultas necesarias para devoluciones:

- Bloqueo pesimista de venta al registrar devolucion.
- Consulta de detalle con relaciones necesarias.
- Resumen de ventas incluyendo informacion de receivable.

Evita condiciones de carrera cuando dos devoluciones intentan operar la misma venta.

### `sale/repository/SaleItemRepository.java`

Repositorio nuevo para operar `SaleItem`.

Incluye consulta con bloqueo pesimista para obtener los renglones solicitados de una venta durante una devolucion. Esto evita que dos devoluciones simultaneas superen la cantidad vendida.

### `sale/service/SaleServiceImpl.java`

Actualiza el detalle y resumen de ventas para considerar devoluciones:

- Calcula o consulta total devuelto.
- Devuelve informacion de cuenta por cobrar actualizada.
- Mantiene reglas de ventas existentes.

### `src/test/java/com/angelica/pos/sale/service/SaleServiceImplTest.java`

Pruebas actualizadas para reflejar que el servicio de ventas ahora depende de informacion de devoluciones al construir respuestas de detalle/resumen.

## Cambios en inventario

### `inventory/movement/entity/InventoryMovementType.java`

Agrega `SALE_RETURN`.

Representa la entrada de inventario generada cuando se devuelve un producto vendido.

### `inventory/movement/service/InventoryMovementService.java`

Agrega contrato interno para registrar movimiento de inventario por devolucion de venta.

### `inventory/movement/service/InventoryMovementServiceImpl.java`

Implementa `registerSaleReturnMovement`.

Responsabilidades:

- Incrementar stock del producto devuelto.
- Crear movimiento `IN`.
- Usar tipo `SALE_RETURN`.
- Asociar la referencia al item de devolucion.
- Participar en la misma transaccion de la devolucion.

### `catalog/product/repository/ProductRepository.java`

Agrega consulta para bloquear productos por ID de forma determinista durante devoluciones.

Esto reduce riesgo de inconsistencias de stock y deadlocks cuando una devolucion afecta varios productos.

## Cambios en caja

### `cash/movement/entity/CashMovementType.java`

Agrega `SALE_REFUND`.

Representa salida de efectivo por reembolso de una devolucion.

### `cash/movement/service/CashMovementService.java`

Agrega contrato interno para registrar reembolso de devolucion de venta.

### `cash/movement/service/CashMovementServiceImpl.java`

Implementa registro de `SALE_REFUND`.

Responsabilidades:

- Crear movimiento `OUTFLOW`.
- Usar monto real reembolsado.
- Asociar caja abierta del usuario que procesa la devolucion.
- Guardar `sourceType` y `sourceId` de la devolucion.
- Participar en la misma transaccion.

Tambien conserva el flujo existente de ventas en efectivo, abonos y movimientos manuales.

## Cambios en cuentas por cobrar

### `receivable/entity/Receivable.java`

Agrega campos:

- `returnedAmount`.
- `adjustedAmount`.

Estos campos permiten que la deuda de una venta fiada se reduzca por devoluciones sin modificar `originalAmount`, que queda como monto historico original.

### `receivable/dto/ReceivableSummaryResponse.java`

Agrega datos de ajuste por devolucion:

- Monto original.
- Monto devuelto.
- Monto ajustado.
- Pagado.
- Saldo pendiente.

Permite que frontend muestre estado de cuenta correcto.

### `receivable/service/ReceivableServiceImpl.java`

Inicializa receivables nuevos con:

- `returnedAmount = 0`.
- `adjustedAmount = originalAmount`.

Mantiene compatibilidad con ventas fiadas nuevas.

### `receivable/repository/ReceivableRepository.java`

Agrega:

- `findBySaleIdForUpdate`.
  - Bloquea la cuenta por cobrar cuando una devolucion fiada la ajusta.
- `existsPendingBalanceByCustomerId`.
  - Verifica si un cliente tiene saldo pendiente antes de desactivarlo.

### `receivable/payment/service/ReceivablePaymentServiceImpl.java`

Ajusta calculos de abonos para usar `adjustedAmount` en lugar de `originalAmount`.

Esto evita que un abono posterior a una devolucion permita pagar mas que el monto vigente de la deuda.

## Cambios en clientes

### `customer/exception/CustomerHasPendingReceivablesException.java`

Excepcion nueva para impedir desactivar clientes que todavia tienen saldo pendiente.

### `customer/service/CustomerServiceImpl.java`

Antes de desactivar un cliente, consulta `ReceivableRepository.existsPendingBalanceByCustomerId`.

Si existe saldo pendiente:

- No desactiva el cliente.
- Lanza `CustomerHasPendingReceivablesException`.
- El handler global responde `409 CONFLICT`.

## Seguridad y errores

### `security/SecurityConfig.java`

Agrega permisos para endpoints de devoluciones:

- `POST /api/sales/{saleId}/returns`.
- `GET /api/sales/{saleId}/returns`.
- `GET /api/sale-returns/{returnId}`.

Respeta JWT, roles y el flujo actual de autenticacion.

### `shared/exception/GlobalExceptionHandler.java`

Integra nuevas excepciones:

- Cliente con saldo pendiente.
- Devolucion no encontrada.
- Item de devolucion no encontrado.
- Item duplicado.
- Venta o item no retornable.
- Cantidad excedida.
- Venta fiada sin receivable.

Mapea errores a:

- `400 BAD_REQUEST` para request invalido.
- `404 NOT_FOUND` para recursos inexistentes.
- `409 CONFLICT` para conflictos de negocio.
- `403 FORBIDDEN` cuando aplica acceso no permitido.

## Reglas de negocio implementadas

### Venta CASH

Una devolucion de venta de contado:

- Restaura inventario.
- Crea un movimiento de inventario `SALE_RETURN` por articulo.
- Reembolsa el total devuelto.
- Requiere caja abierta.
- Crea un movimiento de caja `SALE_REFUND`.

### Venta CREDIT

Una devolucion de venta fiada:

- Restaura inventario.
- Crea movimientos `SALE_RETURN`.
- Ajusta la cuenta por cobrar asociada.
- No reembolsa el total automaticamente.
- Solo reembolsa efectivo si el cliente habia pagado mas que el nuevo `adjustedAmount`.
- Puede no requerir caja si no hay reembolso.

### Estado de venta

La venta queda:

- `PARTIALLY_RETURNED` si queda al menos un articulo con cantidad disponible.
- `RETURNED` si todos los articulos fueron devueltos.

### Estado de cuenta por cobrar

La cuenta por cobrar queda:

- `PENDING` si no hay pagos y aun hay saldo.
- `PARTIALLY_PAID` si hay pago parcial.
- `PAID` si el saldo queda en cero y el monto ajustado es mayor que cero.
- `CANCELLED` si el monto ajustado queda en cero por devolucion total.

## Archivos agregados

- `src/main/java/com/angelica/pos/customer/exception/CustomerHasPendingReceivablesException.java`
- `src/main/java/com/angelica/pos/sale/repository/SaleItemRepository.java`
- `src/main/java/com/angelica/pos/sale/returning/controller/SaleReturnController.java`
- `src/main/java/com/angelica/pos/sale/returning/dto/SaleReturnDetailResponse.java`
- `src/main/java/com/angelica/pos/sale/returning/dto/SaleReturnItemRequest.java`
- `src/main/java/com/angelica/pos/sale/returning/dto/SaleReturnItemResponse.java`
- `src/main/java/com/angelica/pos/sale/returning/dto/SaleReturnRequest.java`
- `src/main/java/com/angelica/pos/sale/returning/dto/SaleReturnSummaryResponse.java`
- `src/main/java/com/angelica/pos/sale/returning/entity/SaleReturn.java`
- `src/main/java/com/angelica/pos/sale/returning/entity/SaleReturnItem.java`
- `src/main/java/com/angelica/pos/sale/returning/exception/CreditSaleReceivableRequiredException.java`
- `src/main/java/com/angelica/pos/sale/returning/exception/DuplicateSaleReturnItemException.java`
- `src/main/java/com/angelica/pos/sale/returning/exception/SaleItemDoesNotBelongToSaleException.java`
- `src/main/java/com/angelica/pos/sale/returning/exception/SaleReturnItemNotFoundException.java`
- `src/main/java/com/angelica/pos/sale/returning/exception/SaleReturnNotAllowedException.java`
- `src/main/java/com/angelica/pos/sale/returning/exception/SaleReturnNotFoundException.java`
- `src/main/java/com/angelica/pos/sale/returning/exception/SaleReturnQuantityExceededException.java`
- `src/main/java/com/angelica/pos/sale/returning/mapper/SaleReturnMapper.java`
- `src/main/java/com/angelica/pos/sale/returning/repository/SaleReturnRepository.java`
- `src/main/java/com/angelica/pos/sale/returning/service/SaleReturnService.java`
- `src/main/java/com/angelica/pos/sale/returning/service/SaleReturnServiceImpl.java`
- `src/main/resources/db/migration/V9__create_sale_returns.sql`

## Archivos modificados

- `src/main/java/com/angelica/pos/cash/movement/entity/CashMovementType.java`
- `src/main/java/com/angelica/pos/cash/movement/service/CashMovementService.java`
- `src/main/java/com/angelica/pos/cash/movement/service/CashMovementServiceImpl.java`
- `src/main/java/com/angelica/pos/catalog/product/repository/ProductRepository.java`
- `src/main/java/com/angelica/pos/customer/service/CustomerServiceImpl.java`
- `src/main/java/com/angelica/pos/inventory/movement/entity/InventoryMovementType.java`
- `src/main/java/com/angelica/pos/inventory/movement/service/InventoryMovementService.java`
- `src/main/java/com/angelica/pos/inventory/movement/service/InventoryMovementServiceImpl.java`
- `src/main/java/com/angelica/pos/receivable/dto/ReceivableSummaryResponse.java`
- `src/main/java/com/angelica/pos/receivable/entity/Receivable.java`
- `src/main/java/com/angelica/pos/receivable/payment/service/ReceivablePaymentServiceImpl.java`
- `src/main/java/com/angelica/pos/receivable/repository/ReceivableRepository.java`
- `src/main/java/com/angelica/pos/receivable/service/ReceivableServiceImpl.java`
- `src/main/java/com/angelica/pos/sale/dto/SaleDetailResponse.java`
- `src/main/java/com/angelica/pos/sale/dto/SaleItemResponse.java`
- `src/main/java/com/angelica/pos/sale/dto/SaleReceivableResponse.java`
- `src/main/java/com/angelica/pos/sale/dto/SaleSummaryResponse.java`
- `src/main/java/com/angelica/pos/sale/entity/Sale.java`
- `src/main/java/com/angelica/pos/sale/entity/SaleItem.java`
- `src/main/java/com/angelica/pos/sale/entity/SaleStatus.java`
- `src/main/java/com/angelica/pos/sale/mapper/SaleMapper.java`
- `src/main/java/com/angelica/pos/sale/repository/SaleRepository.java`
- `src/main/java/com/angelica/pos/sale/service/SaleServiceImpl.java`
- `src/main/java/com/angelica/pos/security/SecurityConfig.java`
- `src/main/java/com/angelica/pos/shared/exception/GlobalExceptionHandler.java`
- `src/test/java/com/angelica/pos/sale/service/SaleServiceImplTest.java`

## Verificacion pendiente

En esta maquina no se pudo ejecutar `./mvnw clean verify` porque no hay Java disponible o `JAVA_HOME` no esta configurado correctamente. Tampoco existe `mvn` instalado en el entorno.

Comandos intentados anteriormente:

```bash
./mvnw clean verify
mvn clean verify
```

Resultado:

- `./mvnw clean verify`: falla por `JAVA_HOME`.
- `mvn clean verify`: falla porque `mvn` no esta instalado.

Para validar estos cambios se debe ejecutar en un entorno con JDK configurado:

```bash
cd pos-backend
./mvnw clean verify
```

