# Documentacion de cambios frontend no subidos

Este documento resume los cambios pendientes en `pos-frontend` relacionados con ventas fiadas, cuentas por cobrar y abonos. Explica que se agrego o modifico, para que sirve cada archivo y como se conectan las capas de la aplicacion.

## Alcance

- Se trabajo solo en el frontend React.
- No se agregaron dependencias nuevas.
- No se modifico el backend.
- No se uso Axios directamente desde paginas, componentes ni hooks.
- Las llamadas HTTP siguen pasando por `httpClient`, repositorios, casos de uso y hooks.
- Se reutilizaron rutas, layout, guards, `PageResponse`, `normalizeApiError`, componentes compartidos y formatters existentes.
- No se implemento tarjeta, transferencia, devoluciones, cancelaciones, intereses, impresion, cierre de caja ni frontend para editar o eliminar abonos.

## Resumen funcional

Se agregaron o extendieron tres areas principales:

1. Ventas.
   - El dialogo de cobro ahora permite elegir `Efectivo` o `Fiado`.
   - Una venta fiada exige cliente.
   - Una venta fiada no muestra efectivo recibido ni cambio.
   - El request de venta fiada envia `saleType = CREDIT`, `customerId` y `cashReceived = null`.
   - El historial y detalle de ventas muestran `Efectivo` o `Fiado`.
   - Cuando la venta tiene cuenta por cobrar, se muestra su resumen.

2. Cuentas por cobrar.
   - Se creo el feature `src/features/receivables`.
   - Se agrego la ruta `/receivables` para `ADMIN`.
   - Se agrego listado global paginado con filtros.
   - Se agrego detalle en Drawer.
   - Se agrego consulta de cuentas por cobrar por cliente.

3. Abonos.
   - Se agrego registro de abonos en efectivo desde el Drawer de una cuenta por cobrar.
   - Se agrego historial paginado de abonos por cuenta.
   - Se agrego detalle de abono.
   - Se refresca la cuenta, el listado y la caja despues de un abono.
   - Si no hay caja abierta, se usa el flujo existente de apertura de caja.

## Arquitectura respetada

Los cambios siguen la arquitectura por feature:

```text
src/features/{feature}/
├── application/
│   └── useCases/
├── domain/
│   ├── entities/
│   └── repositories/
├── infrastructure/
│   ├── mappers/
│   └── RepositoryImpl.ts
├── ui/
│   ├── components/
│   ├── hooks/
│   └── pages/
├── dependencies.ts
└── index.ts
```

Responsabilidad de cada capa:

- `domain`: tipos de negocio y contratos de repositorio. No contiene React ni HTTP.
- `application`: casos de uso. Orquestan acciones sobre repositorios.
- `infrastructure`: implementacion tecnica HTTP y mappers.
- `ui`: paginas, componentes, dialogs, drawers y hooks.
- `dependencies.ts`: arma las instancias con inyeccion manual de dependencias.
- `index.ts`: expone la API publica del feature.

## Endpoints consumidos

El `httpClient` ya usa el `baseURL` del backend, por eso los repositorios llaman rutas sin `/api`.

### Ventas

- `POST /sales`
- `GET /sales/current-session`
- `GET /sales`
- `GET /sales/{id}`

### Cuentas por cobrar

- `GET /receivables`
- `GET /receivables/{id}`
- `GET /customers/{customerId}/receivables`

### Abonos

- `POST /receivables/{receivableId}/payments`
- `GET /receivables/{receivableId}/payments`
- `GET /receivable-payments/{paymentId}`

## Cambios en ventas

Paquete principal:

`src/features/sales`

### `domain/entities/Sale.ts`

Se extendieron los tipos para soportar ventas en efectivo y fiadas.

Tipos relevantes:

- `SaleType = 'CASH' | 'CREDIT'`.
- `SaleReceivable`, resumen de cuenta por cobrar asociado a una venta.
- `Sale`, ahora permite:
  - `customerId: number | null`.
  - `cashReceived: number | null`.
  - `changeAmount: number | null`.
  - `receivable: SaleReceivable | null`.
- `SaleSummary`, ahora incluye `receivable`.
- `CreateSaleData`, request unificado para ventas `CASH` y `CREDIT`.

Tambien se agregaron traducciones:

- `CASH` -> `Efectivo`.
- `CREDIT` -> `Fiado`.

### `application/useCases/CreateSaleUseCase.ts`

Reemplaza el caso de uso especifico de venta en efectivo.

Sirve para crear cualquier venta soportada por el backend:

- Venta en efectivo.
- Venta fiada.

### Archivo eliminado: `application/useCases/CreateCashSaleUseCase.ts`

Se elimino porque el flujo ya no es exclusivamente para ventas en efectivo. La responsabilidad paso a `CreateSaleUseCase`.

### `domain/repositories/SaleRepository.ts`

Se actualizo el contrato del repositorio para crear ventas usando el modelo general `CreateSaleData`, no solo efectivo.

### `infrastructure/SaleRepositoryImpl.ts`

Implementa el request real hacia `POST /sales`.

Reglas importantes:

- Para venta `CASH`, envia `saleType`, `customerId`, `cashReceived` e `items`.
- Para venta `CREDIT`, envia `saleType = CREDIT`, `customerId` y `cashReceived = null`.
- No envia usuario, caja, total, cambio, saldo ni movimientos.

### `infrastructure/mappers/SaleMapper.ts`

Mapea respuestas del backend hacia modelos de dominio.

Se agrego soporte para:

- `saleType` `CASH` y `CREDIT`.
- `cashReceived` nullable.
- `changeAmount` nullable.
- `receivable` nullable.
- Resumen de cuenta por cobrar en ventas.

### `dependencies.ts`

Se actualizo la inyeccion de dependencias para usar `CreateSaleUseCase`.

### `ui/hooks/useCreateSale.ts`

Hook nuevo que reemplaza el flujo anterior de `useCreateCashSale`.

Responsabilidades:

- Ejecutar el caso de uso de creacion de venta.
- Manejar `loading`.
- Manejar errores con `normalizeApiError`.
- Guardar el resultado.
- Exponer `reset`.

### Archivo eliminado: `ui/hooks/useCreateCashSale.ts`

Se elimino porque el hook anterior estaba limitado a efectivo. El nuevo hook soporta efectivo y fiado.

### `ui/components/CashCheckoutDialog.tsx`

Se extendio el dialogo de cobro.

Cambios:

- Agrega selector de tipo de venta con `ToggleButtonGroup`.
- Permite elegir:
  - `Efectivo`.
  - `Fiado`.
- Para `Efectivo`:
  - Muestra campo `Efectivo recibido`.
  - Muestra cambio estimado.
  - No exige cliente.
  - Envia `saleType = CASH`.
- Para `Fiado`:
  - Oculta efectivo recibido.
  - Oculta cambio.
  - Muestra selector obligatorio de cliente.
  - Envia `saleType = CREDIT`.
  - Envia `cashReceived = null`.
  - Muestra texto indicando que el total quedara como deuda.
- Bloquea la confirmacion si una venta fiada no tiene cliente.

### `ui/pages/SalesPage.tsx`

Se actualizo el flujo de creacion de venta para usar `useCreateSale`.

Ahora el checkout construye el request segun el tipo de venta:

- `CASH`: efectivo recibido.
- `CREDIT`: cliente obligatorio y efectivo nulo.

Tambien conserva el carrito, busqueda y flujo de escaneo existentes.

### `ui/components/SaleSuccessDialog.tsx`

Se extendio el resultado de venta exitosa.

Para ventas fiadas muestra informacion devuelta por el backend:

- Folio de venta.
- Cliente.
- Total.
- Estado de cuenta por cobrar.
- Saldo pendiente.
- Accion opcional para ver la cuenta por cobrar.

Para ventas en efectivo conserva el resumen de cobro.

### `ui/components/SalesHistoryGrid.tsx`

Se actualizo la tabla de historial para distinguir:

- `CASH` como `Efectivo`.
- `CREDIT` como `Fiado`.

Tambien muestra informacion relacionada con cuenta por cobrar cuando existe.

### `ui/components/SaleDetailDrawer.tsx`

Se actualizo el detalle de venta.

Para ventas fiadas muestra una seccion de cuenta por cobrar:

- Monto original.
- Monto pagado.
- Saldo pendiente.
- Estado.

Para ventas en efectivo esta seccion no aparece.

### `index.ts`

Exporta los nuevos tipos, hooks y dependencias necesarios del feature de ventas.

## Selector de clientes

### `src/features/customers/ui/components/CustomerSelector.tsx`

Componente nuevo reutilizable para seleccionar clientes.

Responsabilidades:

- Buscar clientes con debounce de 300 ms.
- Usar el caso de uso existente de customers.
- Buscar por texto usando el endpoint existente de clientes.
- Mostrar solo clientes activos.
- Mostrar nombre y telefono.
- Permitir limpiar seleccion.
- Mostrar estado de carga.
- Mostrar estado vacio.
- Mostrar errores normalizados.

No crea clientes rapidamente y no duplica repositorios de customers.

### `src/features/customers/index.ts`

Se exporto `CustomerSelector` y tipos necesarios para reutilizarlo desde ventas.

## Integracion con Customers

### `src/features/customers/ui/components/CustomersGrid.tsx`

Se agrego una accion para consultar cuentas por cobrar del cliente.

La accion abre el Drawer de cuentas por cobrar del cliente y reutiliza el feature `receivables`.

### `src/features/customers/ui/pages/CustomersPage.tsx`

Se integro el Drawer de cuentas por cobrar por cliente.

Responsabilidades agregadas:

- Mantener cliente seleccionado.
- Abrir/cerrar deudas del cliente.
- Abrir detalle de una cuenta desde el listado del cliente.
- Refrescar informacion relacionada cuando se registra un abono.

## Feature de cuentas por cobrar

Paquete principal:

`src/features/receivables`

### `domain/entities/Receivable.ts`

Define los modelos de dominio:

- `ReceivableStatus`.
- `ReceivableCustomer`.
- `Receivable`.
- `ReceivableDetail`.
- `ReceivableFilters`.
- `CustomerReceivableFilters`.

Tambien define etiquetas:

- `PENDING` -> `Pendiente`.
- `PARTIALLY_PAID` -> `Parcialmente pagada`.
- `PAID` -> `Pagada`.
- `CANCELLED` -> `Cancelada`.

### `domain/repositories/ReceivableRepository.ts`

Contrato del repositorio:

- Consultar historial global.
- Consultar detalle por ID.
- Consultar cuentas por cobrar de un cliente.

### Casos de uso

- `application/useCases/GetReceivablesUseCase.ts`
  - Consulta el historial global.
- `application/useCases/GetReceivableByIdUseCase.ts`
  - Consulta el detalle de una cuenta.
- `application/useCases/GetCustomerReceivablesUseCase.ts`
  - Consulta deudas por cliente.

### `infrastructure/ReceivableRepositoryImpl.ts`

Implementa las llamadas HTTP:

- `GET /receivables`.
- `GET /receivables/{id}`.
- `GET /customers/{customerId}/receivables`.

Usa `httpClient` compartido.

### `infrastructure/mappers/ReceivableMapper.ts`

Convierte respuestas HTTP del backend a modelos de dominio.

Tambien:

- Limpia parametros vacios.
- Construye parametros de filtros.
- Mapea `PageResponse`.

### `dependencies.ts`

Registra repositorio y casos de uso del feature:

- `getReceivablesUseCase`.
- `getReceivableByIdUseCase`.
- `getCustomerReceivablesUseCase`.
- Casos de uso de abonos.

### `index.ts`

Exporta la pagina, dependencias, componentes y tipos publicos del feature.

## Pagina global de cuentas por cobrar

### `ui/pages/ReceivablesPage.tsx`

Pagina nueva para `/receivables`.

Responsabilidades:

- Mostrar titulo `Cuentas por cobrar`.
- Mostrar descripcion.
- Mostrar filtros.
- Mostrar tabla con `ReceivablesGrid`.
- Usar paginacion del backend.
- Mostrar loading.
- Mostrar estado vacio.
- Mostrar errores normalizados.
- Abrir detalle en Drawer.
- Soportar apertura directa por query param `?id=`.

Solo debe acceder `ADMIN` por ruta protegida.

### `ui/components/ReceivablesFilters.tsx`

Componente de filtros.

Filtros disponibles:

- Cliente.
- Venta.
- Estado.
- Fecha desde.
- Fecha hasta.

Al cambiar filtros, el hook reinicia a pagina 0.

### `ui/components/ReceivablesGrid.tsx`

Tabla de cuentas por cobrar usando la infraestructura visual existente.

Columnas principales:

- Folio de deuda.
- Venta.
- Fecha.
- Cliente.
- Monto original.
- Pagado.
- Saldo pendiente.
- Estado.
- Accion para ver detalle.

### `ui/components/ReceivableStatusChip.tsx`

Componente visual para mostrar el estado de una cuenta por cobrar con etiquetas en espanol.

### `ui/components/ReceivableDetailDrawer.tsx`

Drawer responsive de detalle de cuenta por cobrar.

Muestra:

- ID de cuenta.
- Folio de venta.
- Cliente.
- Fecha de venta.
- Usuario que registro.
- Fecha de cuenta.
- Monto original.
- Total pagado.
- Saldo pendiente.
- Fecha de pago.
- Estado.

Tambien integra la seccion de abonos:

- Boton `Registrar abono`.
- Historial paginado de abonos.
- Detalle de abono.
- Mensajes para cuentas pagadas o canceladas.

El boton de abono solo aparece para:

- `PENDING`.
- `PARTIALLY_PAID`.

No aparece para:

- `PAID`.
- `CANCELLED`.

### `ui/components/CustomerReceivablesDrawer.tsx`

Drawer para consultar cuentas por cobrar de un cliente desde el modulo de clientes.

Responsabilidades:

- Consultar `GET /customers/{customerId}/receivables`.
- Filtrar por estado.
- Usar paginacion backend.
- Permitir abrir detalle de una cuenta.
- Refrescar cuando cambia `refreshKey`.

## Hooks de cuentas por cobrar

### `ui/hooks/useReceivables.ts`

Maneja la pagina global:

- Datos.
- Filtros.
- Paginacion.
- Loading.
- Error normalizado.
- Refetch.
- Limpieza de filtros.

### `ui/hooks/useReceivableDetails.ts`

Maneja el detalle:

- Apertura del Drawer.
- Consulta por ID.
- Loading.
- Error.
- Cierre.
- Refresco del detalle.

### `ui/hooks/useCustomerReceivables.ts`

Maneja cuentas por cobrar de cliente:

- Cliente activo.
- Filtro por estado.
- Paginacion.
- Loading.
- Error normalizado.
- Refetch.

## Modulo de abonos

Paquete principal:

`src/features/receivables/payment`

### `domain/entities/ReceivablePayment.ts`

Define:

- `ReceivablePayment`.
- `CreateReceivablePaymentRequest`.
- `ReceivablePaymentFilters`.

El modelo contiene datos devueltos por backend:

- ID del abono.
- ID de cuenta por cobrar.
- ID de venta.
- ID y nombre del cliente.
- ID de caja.
- ID y username de quien recibio.
- Monto.
- Notas.
- Fecha.
- Saldo pagado acumulado.
- Saldo pendiente.
- Estado de la cuenta despues del abono.

### `domain/repositories/ReceivablePaymentRepository.ts`

Contrato del repositorio:

- `createPayment(receivableId, request)`.
- `getPaymentsByReceivable(receivableId, filters)`.
- `getPaymentById(paymentId)`.

### Casos de uso

- `application/useCases/CreateReceivablePaymentUseCase.ts`
  - Registra un abono.
- `application/useCases/GetReceivablePaymentsUseCase.ts`
  - Consulta historial paginado de abonos por cuenta.
- `application/useCases/GetReceivablePaymentByIdUseCase.ts`
  - Consulta detalle de un abono.

### `infrastructure/ReceivablePaymentRepositoryImpl.ts`

Implementa:

- `POST /receivables/{receivableId}/payments`.
- `GET /receivables/{receivableId}/payments`.
- `GET /receivable-payments/{paymentId}`.

No envia datos prohibidos:

- No envia `receivableId` dentro del body.
- No envia usuario.
- No envia caja.
- No envia saldo.
- No envia estado.
- No envia `CashMovement`.
- No envia `sourceType` ni `sourceId`.

### `infrastructure/mappers/ReceivablePaymentMapper.ts`

Responsabilidades:

- Convertir request de dominio a request HTTP.
- Enviar `notes` como `null` cuando esta vacio.
- Mapear respuesta HTTP a `ReceivablePayment`.
- Construir parametros de paginacion.
- Mapear `PageResponse`.

### `ui/hooks/useCreateReceivablePayment.ts`

Maneja registro de abonos:

- `submit`.
- `loading`.
- Error normalizado.
- Resultado.
- `reset`.
- Ultimo error para detectar casos 409 como caja cerrada o saldo cambiado.

### `ui/hooks/useReceivablePayments.ts`

Maneja historial de abonos:

- `receivableId`.
- Lista paginada.
- Pagina.
- Tamano.
- Total de elementos.
- Total de paginas.
- Loading.
- Error normalizado.
- Refetch.

Usa orden por defecto `createdAt,DESC`.

### `ui/hooks/useReceivablePaymentDetails.ts`

Maneja detalle de abono:

- ID seleccionado.
- Apertura/cierre.
- Consulta por ID.
- Loading.
- Error.

### `ui/components/CreateReceivablePaymentDialog.tsx`

Dialog para registrar abono.

Muestra:

- Cliente.
- Venta.
- Saldo pendiente.
- Campo de monto.
- Campo de notas.
- Vista previa de saldo restante.
- Boton `Cancelar`.
- Boton `Registrar abono`.

Validaciones frontend:

- Monto obligatorio.
- Monto numerico.
- Mayor que cero.
- Maximo dos decimales.
- No superar saldo pendiente.
- Notas maximo 255 caracteres.
- Notas se envian con `trim`.
- Notas vacias se envian como `null`.

El monto se mantiene como texto durante la edicion y solo se convierte al construir el request.

### `ui/components/ReceivablePaymentsList.tsx`

Lista paginada de abonos dentro del Drawer de cuenta.

Muestra:

- Fecha y hora.
- Monto.
- Usuario que recibio.
- Notas.
- Accion `Ver detalle`.

Usa:

- Paginacion backend.
- Tamanos 5, 10 y 20.
- Loading.
- Estado vacio.
- Error normalizado.

### `ui/components/ReceivablePaymentDetailDialog.tsx`

Dialog de detalle de abono.

Muestra:

- ID del abono.
- Fecha.
- Cliente.
- Venta asociada.
- Monto.
- Notas.
- Usuario que recibio.
- Sesion de caja.
- Saldo pagado acumulado despues del abono.
- Saldo pendiente despues del abono.
- Estado de la cuenta despues del abono.

No incluye acciones para editar ni eliminar.

## Integracion con CashSession

La pagina de cuentas por cobrar no esta protegida completa por caja abierta.

Solo al presionar `Registrar abono`:

1. Se refresca la caja actual con `useCashSession`.
2. Si hay caja abierta, se abre el dialogo.
3. Si no hay caja abierta, se muestra mensaje y navega a apertura de caja.
4. Se conserva retorno seguro usando `location`.

Si el backend responde `409` por caja no abierta:

- Se cierra el dialogo.
- Se refresca la caja.
- Se muestra mensaje claro.
- Se redirige al flujo existente de apertura.

Despues de un abono exitoso:

- Se cierra el dialogo.
- Se muestra Snackbar.
- Se refresca el historial de abonos.
- Se refresca el detalle de la cuenta.
- Se refresca el listado global cuando esta abierto.
- Se refresca el contexto de caja.
- Se mantiene abierto el Drawer principal.

## Rutas y menu

### `src/shared/routes/routePaths.ts`

Se agrego:

```ts
receivables: '/receivables'
```

### `src/app/router/routes.tsx`

Se agrego la ruta:

```text
/receivables
```

Proteccion:

- Solo `ADMIN`.

Tambien se mantiene:

- Ventas protegidas por caja abierta.
- Historial de ventas para `ADMIN` y `CASHIER`.
- Apertura de caja fuera de `RequireOpenCashSession`.

### `src/shared/ui/layout/DashboardLayout.tsx`

Se agrego opcion de menu:

```text
Cuentas por cobrar
```

Ubicacion:

- Grupo `Ventas`.

Visibilidad:

- Solo `ADMIN`.

Icono:

- `RequestQuoteRoundedIcon`.

## Permisos frontend

### ADMIN

Puede:

- Registrar venta en efectivo.
- Registrar venta fiada.
- Ver historial global de cuentas por cobrar.
- Ver detalle de cuenta.
- Ver cuentas por cliente.
- Ver abonos.
- Registrar abonos si tiene caja abierta.
- Ver detalle de abono.

### CASHIER

Puede:

- Registrar venta en efectivo.
- Registrar venta fiada.
- Ver historial de ventas permitido.
- Ver cuentas por cliente.
- Ver detalle de cuenta si backend lo permite.
- Ver abonos si backend lo permite.
- Registrar abonos si tiene caja abierta.

No puede acceder al historial global `/receivables` porque la ruta esta protegida para `ADMIN`.

El backend sigue siendo la autoridad final.

## Manejo de errores

Se usa `normalizeApiError` en hooks y componentes que consultan API.

Casos contemplados:

- Cliente obligatorio para fiado.
- Caja no abierta.
- Stock insuficiente.
- Cuenta por cobrar inexistente.
- Abono inexistente.
- Acceso prohibido.
- Monto invalido.
- Cuenta pagada.
- Cuenta cancelada.
- Abono mayor al saldo.
- Saldo cambiado por concurrencia.
- Errores de red.

No se usa `alert()` y no se muestran objetos Axios.

## Archivos creados

### Customers

- `src/features/customers/ui/components/CustomerSelector.tsx`

### Receivables

- `src/features/receivables/index.ts`
- `src/features/receivables/dependencies.ts`
- `src/features/receivables/domain/entities/Receivable.ts`
- `src/features/receivables/domain/repositories/ReceivableRepository.ts`
- `src/features/receivables/application/useCases/GetReceivablesUseCase.ts`
- `src/features/receivables/application/useCases/GetReceivableByIdUseCase.ts`
- `src/features/receivables/application/useCases/GetCustomerReceivablesUseCase.ts`
- `src/features/receivables/infrastructure/ReceivableRepositoryImpl.ts`
- `src/features/receivables/infrastructure/mappers/ReceivableMapper.ts`
- `src/features/receivables/ui/pages/ReceivablesPage.tsx`
- `src/features/receivables/ui/components/ReceivablesGrid.tsx`
- `src/features/receivables/ui/components/ReceivablesFilters.tsx`
- `src/features/receivables/ui/components/ReceivableDetailDrawer.tsx`
- `src/features/receivables/ui/components/ReceivableStatusChip.tsx`
- `src/features/receivables/ui/components/CustomerReceivablesDrawer.tsx`
- `src/features/receivables/ui/hooks/useReceivables.ts`
- `src/features/receivables/ui/hooks/useReceivableDetails.ts`
- `src/features/receivables/ui/hooks/useCustomerReceivables.ts`

### Receivable payments

- `src/features/receivables/payment/domain/entities/ReceivablePayment.ts`
- `src/features/receivables/payment/domain/repositories/ReceivablePaymentRepository.ts`
- `src/features/receivables/payment/application/useCases/CreateReceivablePaymentUseCase.ts`
- `src/features/receivables/payment/application/useCases/GetReceivablePaymentsUseCase.ts`
- `src/features/receivables/payment/application/useCases/GetReceivablePaymentByIdUseCase.ts`
- `src/features/receivables/payment/infrastructure/ReceivablePaymentRepositoryImpl.ts`
- `src/features/receivables/payment/infrastructure/mappers/ReceivablePaymentMapper.ts`
- `src/features/receivables/payment/ui/components/CreateReceivablePaymentDialog.tsx`
- `src/features/receivables/payment/ui/components/ReceivablePaymentsList.tsx`
- `src/features/receivables/payment/ui/components/ReceivablePaymentDetailDialog.tsx`
- `src/features/receivables/payment/ui/hooks/useCreateReceivablePayment.ts`
- `src/features/receivables/payment/ui/hooks/useReceivablePayments.ts`
- `src/features/receivables/payment/ui/hooks/useReceivablePaymentDetails.ts`

### Sales

- `src/features/sales/application/useCases/CreateSaleUseCase.ts`
- `src/features/sales/ui/hooks/useCreateSale.ts`

## Archivos modificados

- `src/app/router/routes.tsx`
- `src/features/customers/index.ts`
- `src/features/customers/ui/components/CustomersGrid.tsx`
- `src/features/customers/ui/pages/CustomersPage.tsx`
- `src/features/sales/dependencies.ts`
- `src/features/sales/domain/entities/Sale.ts`
- `src/features/sales/domain/repositories/SaleRepository.ts`
- `src/features/sales/index.ts`
- `src/features/sales/infrastructure/SaleRepositoryImpl.ts`
- `src/features/sales/infrastructure/mappers/SaleMapper.ts`
- `src/features/sales/ui/components/CashCheckoutDialog.tsx`
- `src/features/sales/ui/components/SaleDetailDrawer.tsx`
- `src/features/sales/ui/components/SaleSuccessDialog.tsx`
- `src/features/sales/ui/components/SalesHistoryGrid.tsx`
- `src/features/sales/ui/pages/SalesPage.tsx`
- `src/shared/routes/routePaths.ts`
- `src/shared/ui/layout/DashboardLayout.tsx`

## Archivos eliminados

- `src/features/sales/application/useCases/CreateCashSaleUseCase.ts`
- `src/features/sales/ui/hooks/useCreateCashSale.ts`

Se eliminaron porque la creacion de ventas ya no es exclusivamente en efectivo. El flujo general quedo en `CreateSaleUseCase` y `useCreateSale`.

## Flujos principales

### Venta en efectivo

```text
SalesPage
  -> CashCheckoutDialog con saleType CASH
  -> useCreateSale
  -> CreateSaleUseCase
  -> SaleRepository.createSale
  -> SaleRepositoryImpl.post('/sales')
  -> SaleMapper.toEntity
```

Request esperado:

```json
{
  "saleType": "CASH",
  "customerId": null,
  "cashReceived": 400,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

### Venta fiada

```text
SalesPage
  -> CashCheckoutDialog con saleType CREDIT
  -> CustomerSelector
  -> useCreateSale
  -> CreateSaleUseCase
  -> SaleRepository.createSale
  -> SaleRepositoryImpl.post('/sales')
  -> SaleMapper.toEntity
  -> SaleSuccessDialog con receivable
```

Request esperado:

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

### Historial global de cuentas por cobrar

```text
ReceivablesPage
  -> useReceivables
  -> GetReceivablesUseCase
  -> ReceivableRepository.getReceivables
  -> ReceivableRepositoryImpl.get('/receivables')
  -> ReceivableMapper.toPage
  -> ReceivablesGrid
```

### Cuentas por cobrar por cliente

```text
CustomersPage
  -> CustomerReceivablesDrawer
  -> useCustomerReceivables
  -> GetCustomerReceivablesUseCase
  -> ReceivableRepository.getCustomerReceivables
  -> ReceivableRepositoryImpl.get('/customers/{customerId}/receivables')
  -> ReceivablesGrid
```

### Registrar abono

```text
ReceivableDetailDrawer
  -> refreshCurrentSession
  -> CreateReceivablePaymentDialog
  -> useCreateReceivablePayment
  -> CreateReceivablePaymentUseCase
  -> ReceivablePaymentRepository.createPayment
  -> ReceivablePaymentRepositoryImpl.post('/receivables/{id}/payments')
  -> ReceivablePaymentMapper.toEntity
  -> refetch detalle, historial y caja
```

Request esperado:

```json
{
  "amount": 300,
  "notes": "Abono semanal"
}
```

## Verificacion local

Este documento solo agrega documentacion. No se ejecutaron `npm run build` ni `npm run lint` durante esta tarea de documentacion.

Para verificar el frontend completo:

```bash
npm run build
npm run lint
```

## Confirmaciones

- No se agregaron dependencias.
- No se modifico el backend.
- No se uso Axios directo en UI.
- No se crearon datos simulados.
- No se implemento tarjeta ni transferencia.
- No se implemento edicion ni eliminacion de abonos.
- No se implementaron devoluciones.
- No se implementaron cancelaciones.
- No se implementaron intereses.
- No se implemento impresion.
- No se implemento cierre de caja.
