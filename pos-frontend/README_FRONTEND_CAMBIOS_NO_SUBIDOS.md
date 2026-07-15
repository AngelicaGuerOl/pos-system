# Cambios frontend pendientes de subir a GitHub

Este documento describe los cambios locales actuales en `pos-frontend` que todavia no estan subidos al repositorio remoto. Los cambios principales son:

- Soporte visual y funcional para ventas fiadas.
- Nueva experiencia de cuentas por cobrar por cliente.
- Registro de abonos a cuentas por cobrar.
- Flujo de devoluciones parciales y totales dentro del detalle de venta.
- Reestructuracion del historial y detalle de ventas.
- Nuevo calendario compartido sin seleccion de hora.
- Limpieza de drawers, dialogs, hooks y use cases que quedaron obsoletos.

No se agregaron dependencias nuevas.

## Resumen funcional

### Ventas

- El flujo de venta soporta `CASH` y `CREDIT`.
- El dialog de cobro permite registrar ventas fiadas.
- Las respuestas de venta muestran informacion opcional de cuenta por cobrar.
- El historial de ventas distingue tipo de venta, estado de venta y estado de pago.
- El detalle de venta ahora usa un `Dialog` grande en lugar de `Drawer`.
- Las devoluciones se registran dentro del mismo dialog de detalle, sin abrir un segundo modal.

### Cuentas por cobrar

- La pagina principal muestra clientes agrupados por deuda, no una fila por venta.
- El estado de cuenta de un cliente es una pagina completa.
- El estado de cuenta tiene pestañas:
  - Compras fiadas.
  - Abonos.
- Las compras fiadas se muestran agrupadas por venta y con sus productos visibles directamente.
- Los abonos se muestran como tabla simple.
- El registro de abono usa un dialog pequeño.
- El abono se valida contra el saldo total del cliente y se aplica a las cuentas abiertas.

### Devoluciones

- Se agrego el modulo frontend `sales/returns`.
- Permite registrar devoluciones con motivo, articulos y cantidades.
- Muestra historial de devoluciones dentro del detalle de venta.
- Actualiza detalle, historial, cuenta por cobrar y caja despues de registrar una devolucion.

### Calendarios

- Se agrego un componente compartido `CalendarioPicker`.
- Se quitaron campos `datetime-local`.
- Los filtros muestran solo fecha, sin hora.
- Internamente se convierten fechas a inicio/fin del dia para no romper filtros del backend.

## Archivos agregados

### Cuentas por cobrar

#### `src/features/receivables/ui/pages/CustomerAccountPage.tsx`

Pagina completa para el estado de cuenta de un cliente.

Sirve para:

- Mostrar nombre del cliente.
- Mostrar resumen financiero.
- Mostrar pestañas de compras fiadas y abonos.
- Registrar abonos.
- Refrescar datos despues de un abono.
- Distribuir un abono entre cuentas abiertas del cliente, empezando por las mas antiguas.

#### `src/features/receivables/ui/components/AccountsReceivableCustomersTable.tsx`

Tabla de clientes con deuda.

Sirve para:

- Mostrar clientes agrupados.
- Mostrar compras fiadas, total abonado y saldo pendiente.
- Dar acceso directo a `Ver estado de cuenta`.

#### `src/features/receivables/ui/components/AccountsReceivableFilters.tsx`

Filtros simples para cuentas por cobrar.

Incluye:

- Busqueda por nombre o telefono.
- Estado: con saldo, liquidados o todos.
- Boton limpiar.

Reemplaza filtros tecnicos basados en IDs.

#### `src/features/receivables/ui/components/CustomerAccountSummary.tsx`

Resumen financiero del estado de cuenta.

Muestra:

- Total de compras fiadas.
- Total abonado.
- Saldo pendiente.

#### `src/features/receivables/ui/components/CreditSalesTab.tsx`

Pestana de compras fiadas del cliente.

Sirve para:

- Paginar por ventas.
- Ordenar primero ventas con saldo pendiente.
- Renderizar cada venta como bloque agrupado.

#### `src/features/receivables/ui/components/CreditSaleGroup.tsx`

Bloque visual de una compra fiada.

Agrupa:

- Encabezado de venta.
- Tabla de productos de esa venta.

Evita mezclar productos de varias ventas en una sola tabla plana.

#### `src/features/receivables/ui/components/CreditSaleHeader.tsx`

Encabezado compacto de una venta fiada.

Muestra:

- Folio.
- Fecha.
- Estado de cuenta.
- Total.
- Abonado.
- Saldo pendiente.

#### `src/features/receivables/ui/components/CreditSaleProductsTable.tsx`

Tabla de productos de una venta fiada.

Muestra:

- Producto.
- Codigo de barras como texto secundario.
- Cantidad.
- Precio historico.
- Subtotal.

No consulta precios actuales del catalogo.

#### `src/features/receivables/ui/components/PaymentsTab.tsx`

Pestana de abonos.

Muestra:

- Fecha y hora.
- Monto.
- Usuario que recibio.
- Venta a la que se aplico.
- Saldo despues.

Se elimino el detalle expandible de abonos y no se muestran IDs tecnicos innecesarios.

#### `src/features/receivables/ui/components/RegisterAccountPaymentDialog.tsx`

Dialog para registrar abono.

Sirve para:

- Mostrar cliente y saldo pendiente.
- Capturar monto.
- Usar saldo completo.
- Mostrar vista previa de saldo despues del abono.
- Validar monto mayor que cero.
- Validar maximo dos decimales.
- Evitar montos superiores al saldo pendiente total.

No solicita notas. El frontend envia solo `amount`.

#### `src/features/receivables/ui/hooks/useCustomerAccount.ts`

Hook para cargar el estado de cuenta.

Obtiene:

- Cuentas por cobrar del cliente.
- Detalle de ventas asociadas.
- Abonos de las cuentas.
- Totales del estado de cuenta.

Centraliza carga, error, loading y refetch.

#### `src/features/receivables/ui/hooks/useReceivableCustomerContacts.ts`

Hook auxiliar para obtener telefonos de clientes en la lista de cuentas por cobrar.

Sirve para que la busqueda por telefono funcione en la pagina principal.

#### `src/features/receivables/ui/types/accountsReceivable.ts`

Tipos de UI para cuentas por cobrar.

Define:

- Filtros de estado de deuda.
- Resumen agrupado por cliente.
- Relacion entre receivable y venta.
- Datos del estado de cuenta.

#### `src/features/receivables/ui/utils/accountsReceivable.ts`

Utilidades para cuentas por cobrar.

Incluye:

- Agrupar receivables por cliente.
- Filtrar por busqueda y estado.
- Encontrar cuentas abiertas para aplicar abonos.

### Devoluciones de venta

#### `src/features/sales/returns/domain/entities/SaleReturn.ts`

Modelos de dominio de devoluciones.

Define:

- Request de devolucion.
- Item solicitado.
- Resumen de devolucion.
- Detalle de devolucion.
- Item devuelto.
- Filtros paginados.

#### `src/features/sales/returns/domain/repositories/SaleReturnRepository.ts`

Contrato del repositorio de devoluciones.

Define:

- Crear devolucion.
- Consultar devoluciones por venta.
- Consultar devolucion por ID.

#### `src/features/sales/returns/application/useCases/CreateSaleReturnUseCase.ts`

Caso de uso para registrar devolucion.

Mantiene la arquitectura `UI -> hook -> use case -> repository -> httpClient`.

#### `src/features/sales/returns/application/useCases/GetSaleReturnsUseCase.ts`

Caso de uso para consultar historial paginado de devoluciones de una venta.

#### `src/features/sales/returns/application/useCases/GetSaleReturnByIdUseCase.ts`

Caso de uso para consultar el detalle de una devolucion.

#### `src/features/sales/returns/infrastructure/SaleReturnRepositoryImpl.ts`

Implementacion HTTP de devoluciones.

Consume:

- `POST /sales/{saleId}/returns`.
- `GET /sales/{saleId}/returns`.
- `GET /sale-returns/{returnId}`.

Usa `httpClient`; no se usa Axios directamente desde UI.

#### `src/features/sales/returns/infrastructure/mappers/SaleReturnMapper.ts`

Mapea DTOs del backend a modelos de dominio frontend.

Tambien arma requests enviando solo:

- `reason`.
- `saleItemId`.
- `quantity`.

No envia totales, precios, usuario, caja, estado ni movimientos.

#### `src/features/sales/returns/ui/hooks/useCreateSaleReturn.ts`

Hook de mutacion para registrar devolucion.

Maneja:

- Loading.
- Error normalizado.
- Resultado.
- Reset.
- Ultimo error para flujos como caja no abierta.

#### `src/features/sales/returns/ui/hooks/useSaleReturns.ts`

Hook para historial paginado de devoluciones por venta.

Maneja:

- Pagina.
- Tamano.
- Total de elementos.
- Loading.
- Error.
- Refetch.

#### `src/features/sales/returns/ui/hooks/useSaleReturnDetails.ts`

Hook para cargar detalle de una devolucion cuando se expande en el historial.

#### `src/features/sales/returns/ui/hooks/useSaleReturnForm.ts`

Hook de estado del formulario de devolucion.

Maneja:

- Articulos seleccionados.
- Cantidades.
- Motivo.
- Validaciones.
- Resumen estimado.
- Request final.

#### `src/features/sales/returns/ui/utils/returnQuantity.ts`

Utilidades para cantidades de devolucion.

Sirve para:

- Calcular cantidad inicial.
- Limitar cantidad entre minimo y maximo.
- Elegir incrementos apropiados segun unidad/cantidad.

### Detalle de venta y devoluciones

#### `src/features/sales/ui/components/SaleDetailsDialog.tsx`

Dialog principal de detalle de venta.

Reemplaza el drawer anterior.

Tiene dos modos internos:

- `DETAIL`: consulta de venta.
- `RETURN`: formulario de devolucion.

Responsabilidades:

- Mostrar encabezado de venta.
- Mostrar resumen compacto.
- Mostrar articulos.
- Mostrar historial de devoluciones.
- Cambiar a modo devolucion sin abrir otro dialog.
- Validar caja abierta cuando una devolucion genera reembolso.
- Registrar devolucion.
- Refrescar detalle, historial y caja.

#### `src/features/sales/ui/components/details/SaleDetailsSummary.tsx`

Resumen visual compacto del detalle de venta.

Muestra:

- Tipo de venta.
- Estado de venta.
- Estado de pago cuando aplica.
- Cliente.
- Cajero.
- Total.
- Saldo pendiente cuando aplica.

Evita datos nulos, guiones y campos repetidos.

#### `src/features/sales/ui/components/details/SaleItemsTable.tsx`

Tabla de articulos vendidos en modo detalle.

Muestra:

- Producto.
- Cantidad.
- Precio.
- Subtotal.

Usa datos historicos de la venta.

#### `src/features/sales/ui/components/details/SaleReturnForm.tsx`

Formulario visual de devolucion dentro del mismo dialog.

Muestra:

- Checkbox por articulo.
- Producto.
- Precio.
- Cantidad a devolver.
- Subtotal.
- Motivo.
- Resumen.

No abre otro modal.

#### `src/features/sales/ui/components/details/ReturnQuantityControl.tsx`

Control compacto de cantidad:

`[-] cantidad [+]`

Respeta:

- Minimo 1 si el articulo esta seleccionado.
- Maximo `returnableQuantity`.
- Sin botones cuando la cantidad maxima es 1.

#### `src/features/sales/ui/components/details/SaleReturnsSection.tsx`

Seccion de devoluciones registradas.

Muestra:

- Estado vacio cuando no hay devoluciones.
- Accordions compactos.
- Detalle de devolucion dentro de la misma seccion.
- Paginacion simple cuando aplica.

### Shared

#### `src/shared/ui/components/CalendarioPicker.tsx`

Componente compartido para seleccionar fechas sin hora.

Props principales:

- `label`.
- `value`.
- `onChange`.
- `error`.
- `helperText`.
- `mayorDeEdad`.
- `sx`.

Usa `TextField type="date"` porque el proyecto no tiene `@mui/x-date-pickers` ni `dayjs`.

#### `src/shared/utils/dateFilters.ts`

Utilidades para filtros de fecha.

Convierte fechas `YYYY-MM-DD` a:

- Inicio del dia para `from`.
- Fin del dia para `to`.

Permite quitar horas de la UI sin romper endpoints que esperan fechas con hora.

## Archivos modificados

### Rutas y navegacion

#### `src/shared/routes/routePaths.ts`

Agrega rutas para cuentas por cobrar:

- `/receivables`.
- `/sales/accounts-receivable/customers/:customerId`.

#### `src/app/router/routes.tsx`

Registra:

- Pagina principal de cuentas por cobrar.
- Pagina de estado de cuenta de cliente.

Mantiene protecciones de rol existentes.

### Clientes

#### `src/features/customers/ui/pages/CustomersPage.tsx`

Integra acceso al estado de cuenta del cliente.

Permite navegar desde clientes hacia la gestion de cuentas por cobrar sin duplicar la funcionalidad dentro del modulo de clientes.

### Inventario

#### `src/features/inventory/movement/domain/entities/InventoryMovement.ts`

Agrega tipo frontend:

- `SALE_RETURN`.

Etiqueta:

- `Devolucion de venta`.

Evita que la UI muestre el valor tecnico `SALE_RETURN`.

#### `src/features/inventory/movement/infrastructure/InventoryMovementRepositoryImpl.ts`

Actualiza conversion de fechas.

Ahora usa:

- `toStartOfDayISOString`.
- `toEndOfDayISOString`.

#### `src/features/inventory/movement/ui/components/InventoryMovementFilters.tsx`

Reemplaza campos `datetime-local` por `CalendarioPicker`.

La UI ya no pide hora en filtros.

### Cuentas por cobrar

#### `src/features/receivables/dependencies.ts`

Actualiza dependencias disponibles para el nuevo flujo:

- Listado global.
- Cuentas por cliente.
- Crear abono.
- Consultar abonos por cuenta.

Elimina dependencias de detalle global que ya no se usan en la UI.

#### `src/features/receivables/domain/entities/Receivable.ts`

Agrega campos:

- `returnedAmount`.
- `adjustedAmount`.

Permite mostrar deudas afectadas por devoluciones.

#### `src/features/receivables/domain/repositories/ReceivableRepository.ts`

Conserva solo operaciones necesarias para el nuevo flujo:

- Obtener cuentas por cobrar globales.
- Obtener cuentas por cliente.

#### `src/features/receivables/infrastructure/ReceivableRepositoryImpl.ts`

Actualiza implementacion HTTP para el nuevo repositorio.

#### `src/features/receivables/infrastructure/mappers/ReceivableMapper.ts`

Mapea nuevos campos:

- `returnedAmount`.
- `adjustedAmount`.

Tambien limpia parametros vacios en filtros.

#### `src/features/receivables/index.ts`

Actualiza exports publicos para rutas y modelos usados por otros features.

#### `src/features/receivables/ui/pages/ReceivablesPage.tsx`

Reestructura la pagina principal.

Antes mostraba cuentas por cobrar individuales.

Ahora muestra clientes agrupados con:

- Compras fiadas.
- Total abonado.
- Saldo pendiente.
- Estado.
- Accion para ver estado de cuenta.

### Abonos

#### `src/features/receivables/payment/domain/entities/ReceivablePayment.ts`

Define modelo de abono usado en UI.

Se elimino `notes` del modelo frontend porque ya no se solicita ni se muestra.

#### `src/features/receivables/payment/domain/repositories/ReceivablePaymentRepository.ts`

Mantiene operaciones necesarias:

- Crear abono.
- Consultar abonos por cuenta.

Se elimino consulta de detalle individual porque la UI ya no abre dialog separado de abono.

#### `src/features/receivables/payment/infrastructure/ReceivablePaymentRepositoryImpl.ts`

Implementa endpoints de abono:

- `POST /receivables/{receivableId}/payments`.
- `GET /receivables/{receivableId}/payments`.

#### `src/features/receivables/payment/infrastructure/mappers/ReceivablePaymentMapper.ts`

Mapea abonos.

El request ahora envia solo:

- `amount`.

No envia `notes`.

### Ventas

#### `src/features/sales/dependencies.ts`

Registra dependencias del modulo de devoluciones:

- Crear devolucion.
- Consultar devoluciones.
- Consultar detalle de devolucion.

#### `src/features/sales/domain/entities/Sale.ts`

Agrega modelos y estados necesarios para:

- Venta fiada.
- Cuenta por cobrar en venta.
- Estados `PARTIALLY_RETURNED` y `RETURNED`.
- Cantidades devueltas y disponibles por item.

#### `src/features/sales/infrastructure/mappers/SaleMapper.ts`

Mapea:

- `receivable`.
- `returnedAmount`.
- `adjustedAmount`.
- `totalReturnedAmount`.
- `soldQuantity`.
- `returnedQuantity`.
- `returnableQuantity`.

Tambien convierte filtros de fecha con inicio/fin de dia.

#### `src/features/sales/index.ts`

Exporta tipos publicos de ventas y devoluciones.

#### `src/features/sales/ui/hooks/useSaleDetails.ts`

Actualiza carga de detalle para usarse con el nuevo dialog.

#### `src/features/sales/ui/pages/SalesHistoryPage.tsx`

Integra `SaleDetailsDialog`.

Despues de registrar una devolucion:

- Refresca detalle.
- Refresca historial.

#### `src/features/sales/ui/components/SalesHistoryGrid.tsx`

Mejora tabla de historial.

Cambios:

- Columnas mas compactas.
- Menos necesidad de scroll horizontal.
- Oculta columnas secundarias en pantallas pequenas.
- Muestra accion `Ver detalle`.
- Muestra estado de pago cuando aplica.

#### `src/features/sales/ui/components/SalesHistoryFilters.tsx`

Reemplaza fechas con `CalendarioPicker`.

Los filtros ya no muestran hora.

#### `src/features/sales/ui/components/SaleSuccessDialog.tsx`

Actualiza resultado de venta para mostrar informacion de cuenta por cobrar cuando la venta es fiada.

#### `src/features/sales/ui/pages/SalesPage.tsx`

Integra venta fiada y flujo de cliente obligatorio para credito.

Mantiene venta de contado.

## Archivos eliminados u obsoletos

### Ventas

#### `src/features/sales/ui/components/SaleDetailDrawer.tsx`

Eliminado porque el detalle de venta ahora se muestra en `SaleDetailsDialog`.

### Cuentas por cobrar

#### `src/features/receivables/application/useCases/GetReceivableByIdUseCase.ts`

Eliminado porque la UI ya no consulta detalle global de una cuenta en drawer/dialog.

#### `src/features/receivables/ui/components/CustomerReceivablesDrawer.tsx`

Eliminado porque el estado de cuenta del cliente ahora es pagina completa.

#### `src/features/receivables/ui/components/ReceivableDetailDrawer.tsx`

Eliminado porque ya no se usa drawer para detalle de cuenta por cobrar.

#### `src/features/receivables/ui/components/ReceivablesFilters.tsx`

Eliminado porque fue reemplazado por `AccountsReceivableFilters`.

#### `src/features/receivables/ui/components/ReceivablesGrid.tsx`

Eliminado porque fue reemplazado por `AccountsReceivableCustomersTable`.

#### `src/features/receivables/ui/hooks/useCustomerReceivables.ts`

Eliminado porque el estado de cuenta usa `useCustomerAccount`.

#### `src/features/receivables/ui/hooks/useReceivableDetails.ts`

Eliminado porque ya no existe drawer/dialog de detalle individual de receivable.

### Abonos

#### `src/features/receivables/payment/application/useCases/GetReceivablePaymentByIdUseCase.ts`

Eliminado porque la UI ya no abre detalle individual de abono.

#### `src/features/receivables/payment/ui/components/CreateReceivablePaymentDialog.tsx`

Eliminado porque el nuevo dialog de abono del estado de cuenta es `RegisterAccountPaymentDialog`.

#### `src/features/receivables/payment/ui/components/ReceivablePaymentDetailDialog.tsx`

Eliminado porque ya no se consulta detalle individual de abono.

#### `src/features/receivables/payment/ui/components/ReceivablePaymentsList.tsx`

Eliminado porque la pestana `PaymentsTab` muestra los abonos.

#### `src/features/receivables/payment/ui/hooks/useReceivablePaymentDetails.ts`

Eliminado porque no hay detalle individual de abono.

#### `src/features/receivables/payment/ui/hooks/useReceivablePayments.ts`

Eliminado porque `useCustomerAccount` centraliza la carga de abonos del estado de cuenta.

## Flujo final de ventas y devoluciones

1. Usuario entra a historial de ventas.
2. Presiona `Ver detalle`.
3. Se abre `SaleDetailsDialog`.
4. En modo detalle se ve resumen, articulos y devoluciones.
5. Si la venta permite devolucion, aparece `Devolver articulos`.
6. El mismo dialog cambia a modo devolucion.
7. Usuario selecciona articulos y cantidades.
8. Ingresa motivo.
9. Confirma devolucion.
10. Frontend envia solo `reason`, `saleItemId` y `quantity`.
11. Backend responde.
12. Frontend refresca detalle, historial, devoluciones, caja y cuenta por cobrar cuando aplica.

## Flujo final de cuentas por cobrar

1. Usuario entra a cuentas por cobrar.
2. Ve clientes agrupados por deuda.
3. Filtra por nombre, telefono o estado.
4. Abre estado de cuenta del cliente.
5. Ve resumen financiero.
6. Consulta compras fiadas agrupadas por venta.
7. Consulta abonos.
8. Registra abono.
9. Frontend valida monto contra saldo total.
10. Frontend aplica el monto a cuentas abiertas usando endpoints existentes.
11. Refresca estado de cuenta.

## Endpoints consumidos nuevos o ajustados

### Devoluciones

- `POST /sales/{saleId}/returns`.
- `GET /sales/{saleId}/returns`.
- `GET /sale-returns/{returnId}`.

### Cuentas por cobrar

- `GET /receivables`.
- `GET /customers/{customerId}/receivables`.

### Abonos

- `POST /receivables/{receivableId}/payments`.
- `GET /receivables/{receivableId}/payments`.

### Ventas

- `POST /sales`.
- `GET /sales`.
- `GET /sales/current-session`.
- `GET /sales/{id}`.

## Verificacion ejecutada

Se ejecuto:

```bash
cd pos-frontend
npm run build
npm run lint
```

Resultado:

- `npm run build`: correcto.
- `npm run lint`: correcto.

Nota: Vite muestra una advertencia no bloqueante por tamano de bundle mayor a 500 kB.

## Confirmaciones

- No se agregaron dependencias nuevas.
- No se modifico el backend desde estos cambios de frontend.
- No se implemento impresion.
- No se implemento cierre de caja.
- No se implemento edicion o eliminacion de devoluciones.
- No se implemento cancelacion de devoluciones.
- No se implemento pago con tarjeta o transferencia.

