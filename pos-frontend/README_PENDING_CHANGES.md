# Cambios pendientes de subir a GitHub - Frontend

Este documento resume los cambios locales no subidos a GitHub en `pos-frontend`.
El objetivo principal es agregar el modulo visual de movimientos de inventario,
siguiendo la arquitectura limpia por feature que ya usa el proyecto.

## Resumen general

Se agrego el feature:

`src/features/inventory/movement`

El modulo permite que un usuario `ADMIN`:

- Consulte el historial paginado de movimientos de inventario.
- Filtre movimientos por busqueda, producto, direccion, tipo y fechas.
- Registre entradas manuales.
- Registre salidas manuales.
- Consulte stock anterior y posterior por movimiento.
- Seleccione productos activos usando el modulo existente de productos.
- Vea errores normalizados del backend, incluido stock insuficiente.

Tambien se ajusto el modulo de productos para respetar el nuevo contrato:

- Al crear producto, `currentStock` se trata como `Stock inicial`.
- Al editar producto, el stock ya no se envia al backend.
- En edicion, el stock se muestra como solo lectura.
- Se muestra el mensaje: `Las existencias se modifican desde Movimientos de inventario.`

No se agregaron dependencias nuevas.

## Arquitectura agregada

La estructura nueva es:

```text
src/features/inventory/movement
├── application
│   └── useCases
├── domain
│   ├── entities
│   └── repositories
├── infrastructure
│   ├── mappers
│   └── InventoryMovementRepositoryImpl.ts
├── ui
│   ├── components
│   ├── hooks
│   ├── pages
│   └── schemas
├── dependencies.ts
└── index.ts
```

La separacion de capas queda asi:

- `domain`: tipos y contratos puros. No importa React, Axios, MUI, AG Grid,
  Zod ni React Hook Form.
- `application`: casos de uso. Solo coordinan el contrato del repositorio.
- `infrastructure`: implementacion HTTP con `httpClient` y mappers de API.
- `ui`: componentes, hooks, pagina, formulario y validaciones visuales.
- `dependencies.ts`: instancia unica del repositorio y casos de uso.
- `index.ts`: exportaciones publicas del feature.

## Flujo de datos

### Consulta de historial

1. `InventoryMovementsPage` usa `useInventoryMovements`.
2. `useInventoryMovements` mantiene filtros, pagina, tamano, loading y error.
3. El hook ejecuta `GetInventoryMovementsUseCase`.
4. El caso de uso llama al contrato `InventoryMovementRepository`.
5. `InventoryMovementRepositoryImpl` usa `httpClient.get('/inventory-movements')`.
6. `InventoryMovementMapper.toPage(...)` convierte la respuesta del backend a
   dominio.
7. La pagina renderiza filtros, tabla AG Grid y paginacion.

### Registro de entrada

1. El ADMIN abre el dialogo `Registrar entrada`.
2. `ManualInventoryMovementForm` valida producto, cantidad y motivo con Zod.
3. La UI envia solamente:
   - `productId`
   - `quantity`
   - `description`
4. `useCreateInventoryEntry` ejecuta `CreateInventoryEntryUseCase`.
5. `InventoryMovementRepositoryImpl.createEntry(...)` llama:
   - `POST /inventory-movements/entries`
6. Si el backend responde correctamente:
   - Se cierra el dialogo.
   - Se muestra Snackbar de exito.
   - Se refresca el historial desde backend.

### Registro de salida

1. El ADMIN abre el dialogo `Registrar salida`.
2. El formulario muestra producto, stock visible, cantidad que saldra y stock
   estimado posterior.
3. Esa validacion visual no reemplaza al backend; el backend sigue siendo la
   autoridad final.
4. `useCreateInventoryExit` ejecuta `CreateInventoryExitUseCase`.
5. `InventoryMovementRepositoryImpl.createExit(...)` llama:
   - `POST /inventory-movements/exits`
6. Si el backend responde `409 CONFLICT` por stock insuficiente, el error se
   normaliza con `normalizeApiError` y se muestra en el dialogo/pagina.

## Endpoints consumidos

Todos se consumen mediante el `httpClient` compartido:

```text
POST /inventory-movements/entries
POST /inventory-movements/exits
GET  /inventory-movements
GET  /inventory-movements/{id}
GET  /products/{productId}/inventory-movements
```

No se duplica `/api`, porque el `baseURL` del cliente HTTP ya lo maneja.

## Archivos creados

### `src/features/inventory/movement/domain/entities/InventoryMovement.ts`

Define los modelos de dominio del modulo:

- `InventoryMovementDirection`: `IN` u `OUT`.
- `InventoryMovementType`: `INITIAL_STOCK`, `MANUAL_ENTRY`, `MANUAL_EXIT`,
  `SALE` o `RETURN`.
- `InventoryMovement`: shape usado por la UI y casos de uso.
- `ManualInventoryMovementData`: datos permitidos para registrar una entrada o
  salida manual.
- `InventoryMovementFilters`: filtros de historial paginado.

Tambien define labels visuales:

- `INVENTORY_MOVEMENT_DIRECTION_LABELS`
- `INVENTORY_MOVEMENT_TYPE_LABELS`

Estos labels traducen valores tecnicos del backend a texto de interfaz:

- `IN` -> `Entrada`
- `OUT` -> `Salida`
- `INITIAL_STOCK` -> `Stock inicial`
- `MANUAL_ENTRY` -> `Entrada manual`
- `MANUAL_EXIT` -> `Salida manual`
- `SALE` -> `Venta`
- `RETURN` -> `Devolucion`

### `src/features/inventory/movement/domain/repositories/InventoryMovementRepository.ts`

Contrato del repositorio de dominio.

Metodos:

- `createEntry(data)`
- `createExit(data)`
- `getAll(filters)`
- `getById(id)`
- `getByProduct(productId, page, size, sort)`

Esta interfaz permite que la aplicacion dependa de una abstraccion y no de
Axios directamente.

### `src/features/inventory/movement/application/useCases/CreateInventoryEntryUseCase.ts`

Caso de uso para registrar entradas.

Recibe `InventoryMovementRepository` por constructor y expone:

```ts
execute(data: ManualInventoryMovementData): Promise<InventoryMovement>
```

No contiene logica visual ni HTTP.

### `src/features/inventory/movement/application/useCases/CreateInventoryExitUseCase.ts`

Caso de uso para registrar salidas.

Recibe el repositorio por constructor y delega en:

```ts
repository.createExit(data)
```

No decide permisos, UI ni errores visuales.

### `src/features/inventory/movement/application/useCases/GetInventoryMovementsUseCase.ts`

Caso de uso para consultar historial general.

Recibe filtros paginados y devuelve:

```ts
Promise<PageResponse<InventoryMovement>>
```

Conserva la metadata del backend: contenido, pagina, tamano, totales, `first`
y `last`.

### `src/features/inventory/movement/application/useCases/GetInventoryMovementByIdUseCase.ts`

Caso de uso para consultar un movimiento especifico por id.

Queda preparado para dialogos de detalle o pantallas futuras.

### `src/features/inventory/movement/application/useCases/GetProductInventoryMovementsUseCase.ts`

Caso de uso para consultar movimientos de un producto especifico.

Recibe:

- `productId`
- `page`
- `size`
- `sort`

Devuelve `PageResponse<InventoryMovement>`.

### `src/features/inventory/movement/infrastructure/mappers/InventoryMovementMapper.ts`

Mapper entre contrato HTTP y dominio.

Tipos creados:

- `BackendInventoryMovementResponse`
- `BackendManualInventoryMovementRequest`

Funciones:

- `toEntity(response)`: convierte respuesta backend a `InventoryMovement`.
- `toPage(response)`: convierte `PageResponse<BackendInventoryMovementResponse>`
  a `PageResponse<InventoryMovement>`.
- `toRequest(data)`: prepara request manual, haciendo `trim()` de
  `description`.

Importante:

- Solo envia `productId`, `quantity` y `description`.
- No envia usuario, direccion, tipo, stock anterior, stock posterior, fecha,
  `sourceType` ni `sourceId`.

### `src/features/inventory/movement/infrastructure/InventoryMovementRepositoryImpl.ts`

Implementacion HTTP del repositorio.

Recibe `AxiosInstance` por constructor:

```ts
constructor(client: AxiosInstance)
```

Responsabilidades:

- Usar el `httpClient` compartido.
- Consumir endpoints reales del backend.
- Convertir fechas de filtros a ISO con `toISOString()`.
- Omitir filtros vacios usando `undefined`.
- Mantener sort por defecto `createdAt,DESC`.
- Convertir respuestas con `InventoryMovementMapper`.

No contiene estado de UI ni usa componentes.

### `src/features/inventory/movement/dependencies.ts`

Punto de inyeccion de dependencias del feature.

Crea una sola instancia de:

```ts
const inventoryMovementRepository = new InventoryMovementRepositoryImpl(httpClient)
```

Luego crea una instancia de cada caso de uso:

- `createInventoryEntryUseCase`
- `createInventoryExitUseCase`
- `getInventoryMovementsUseCase`
- `getInventoryMovementByIdUseCase`
- `getProductInventoryMovementsUseCase`

Esto evita crear repositories dentro de hooks o componentes.

### `src/features/inventory/movement/index.ts`

Exportacion publica del feature.

Exporta:

- `InventoryMovementsPage`
- Tipos principales de dominio.

Permite importar desde `features/inventory/movement` sin imports profundos.

### `src/features/inventory/movement/ui/schemas/manualInventoryMovementSchema.ts`

Schema Zod del formulario manual.

Validaciones:

- `productId` positivo.
- `quantity` obligatoria.
- `quantity > 0`.
- `quantity <= 99999999.99`.
- Maximo dos decimales.
- `description` con `trim()`.
- `description` obligatoria.
- `description` maximo 255 caracteres.

El helper `hasUpToTwoDecimals` valida precision decimal sin instalar
dependencias.

### `src/features/inventory/movement/ui/hooks/useInventoryMovements.ts`

Hook principal del historial.

Estado que maneja:

- `movements`
- `filters`
- `page`
- `size`
- `totalElements`
- `totalPages`
- `loading`
- `error`

Funciones expuestas:

- `refetch`
- `setFilters`
- `setPage`
- `setSize`
- `clearFilters`

Detalles importantes:

- Filtros iniciales: `page = 0`, `size = 10`, `sort = createdAt,DESC`.
- Debounce de busqueda de 300 ms.
- Al cambiar filtros vuelve a pagina 0.
- Valida que `from` no sea posterior a `to`.
- Normaliza errores con `normalizeApiError`.

### `src/features/inventory/movement/ui/hooks/useCreateInventoryEntry.ts`

Hook de mutacion para entrada manual.

Estado:

- `loading`
- `error`

Funcion:

- `createEntry(data)`

Evita envios duplicados si ya esta cargando. Devuelve el movimiento creado o
`null` cuando falla.

### `src/features/inventory/movement/ui/hooks/useCreateInventoryExit.ts`

Hook de mutacion para salida manual.

Estado:

- `loading`
- `error`

Funcion:

- `createExit(data)`

Tambien evita doble envio y normaliza errores.

### `src/features/inventory/movement/ui/hooks/useInventoryMovementDetails.ts`

Hook para cargar un movimiento por id.

Estado:

- `movement`
- `loading`
- `error`

Funcion:

- `loadMovement(id)`

Actualmente queda preparado para detalle. No introduce endpoint nuevo; usa el
caso de uso existente.

### `src/features/inventory/movement/ui/components/ManualInventoryMovementForm.tsx`

Formulario reutilizable para entradas y salidas.

Usa:

- React Hook Form.
- Zod.
- `zodResolver`.
- Material UI.
- Productos existentes mediante `productDependencies.getProductsUseCase`.

Campos:

- Producto.
- Cantidad.
- Motivo.

Comportamiento:

- Busca productos con debounce de 300 ms.
- Usa `Autocomplete` de MUI.
- Muestra nombre, codigo de barras, unidad y stock.
- No filtra localmente las opciones; respeta la busqueda del backend.
- Reinicia valores al abrir.
- Deshabilita controles cuando guarda.
- Hace `trim()` al motivo antes de enviar.
- No usa `parseInt`, conserva decimales.

Para salidas:

- Muestra stock actual visible.
- Muestra cantidad que saldra.
- Muestra stock estimado posterior.
- Si la cantidad supera el stock visible, muestra advertencia.
- El backend sigue validando el stock definitivo.

### `src/features/inventory/movement/ui/components/ManualInventoryMovementModal.tsx`

Dialogo reutilizable para entrada y salida.

Modo `entry`:

- Titulo: `Registrar entrada de inventario`
- Descripcion: `Agrega existencias al producto seleccionado.`
- Icono: `AddRoundedIcon`
- Boton: `Registrar entrada`

Modo `exit`:

- Titulo: `Registrar salida de inventario`
- Descripcion: `Retira existencias por dano, perdida u otro motivo autorizado.`
- Icono: `RemoveRoundedIcon`
- Boton: `Registrar salida`

El dialogo no llama HTTP directamente; delega al `onSubmit` recibido desde la
pagina.

### `src/features/inventory/movement/ui/components/InventoryMovementFilters.tsx`

Componente de filtros del historial.

Filtros disponibles:

- Busqueda por nombre o codigo de barras.
- Producto con `Autocomplete`.
- Direccion: todas, entrada, salida.
- Tipo de movimiento.
- Fecha inicial.
- Fecha final.
- Limpiar filtros.

Detalles:

- Carga productos usando el caso de uso existente del modulo Products.
- Usa debounce de 300 ms para busqueda de producto.
- No filtra solo datos de la pagina actual.
- Envia filtros hacia el hook para que el backend consulte paginado.
- Muestra error de carga de productos si ocurre.

### `src/features/inventory/movement/ui/components/InventoryMovementsGrid.tsx`

Tabla AG Grid del historial.

Usa:

- `ag-grid-community`
- `ag-grid-react`
- Tema `ag-theme-balham`
- Clase compartida `pos-data-grid`

Columnas:

- Fecha y hora.
- Producto.
- Codigo de barras.
- Tipo.
- Direccion.
- Cantidad.
- Stock anterior.
- Stock posterior.
- Usuario.
- Descripcion.

Detalles visuales:

- Traduce tipo y direccion con labels de dominio.
- Usa `Chip` para direccion.
- Usa `formatDateTime` para fechas.
- Usa `formatNumber` para numeros.
- Muestra solo el numero en cantidad/stock, sin unidad, para evitar textos
  raros como `10 Pieza`.
- No muestra acciones de editar ni eliminar.
- Tiene estado vacio propio de AG Grid.

### `src/features/inventory/movement/ui/pages/InventoryMovementsPage.tsx`

Pagina principal del modulo.

Incluye:

- `PageHeader`.
- Botones `Registrar entrada`, `Registrar salida` y `Actualizar`.
- `DataGridShell`.
- `InventoryMovementFilters`.
- `InventoryMovementsGrid`.
- `TablePagination`.
- `EmptyState`.
- `Alert` para errores.
- Dialogo reutilizable para entrada/salida.
- `Snackbar` de exito.

Mensajes de exito:

- `Entrada de inventario registrada`
- `Salida de inventario registrada`

Despues de crear un movimiento:

1. Cierra el modal.
2. Muestra Snackbar.
3. Refresca el historial desde backend.

La pagina no actualiza stock localmente con sumas/restas manuales. Vuelve a
consultar la fuente de verdad.

### `src/shared/routes/RoleProtectedRoute.tsx`

Guard de rol reutilizable.

Recibe:

```ts
roles: UserRole[]
```

Comportamiento:

- Lee el usuario actual con `useAuth`.
- Si no hay usuario o el rol no coincide, redirige a dashboard.
- Si el rol esta permitido, renderiza `Outlet`.

Se usa para proteger la ruta de movimientos de inventario con `ADMIN`.

## Archivos modificados

### `src/app/router/routes.tsx`

Cambios:

- Importa `InventoryMovementsPage`.
- Importa `RoleProtectedRoute`.
- Agrega ruta protegida por `ADMIN`:

```text
/inventory/movements
```

La ruta queda dentro de:

- `ProtectedRoute`
- `DashboardLayout`
- `RoleProtectedRoute roles={['ADMIN']}`

No usa `RequireOpenCashSession`; inventario no depende de caja abierta.

### `src/shared/routes/routePaths.ts`

Agrega:

```ts
inventoryMovements: '/inventory/movements'
```

Esto centraliza la ruta igual que el resto del proyecto.

### `src/shared/ui/layout/DashboardLayout.tsx`

Cambios:

- Importa `InventoryRoundedIcon`.
- Agrega soporte de `roles?: UserRole[]` en `NavigationItem`.
- Filtra items principales por rol.
- Filtra hijos de secciones por rol.
- Oculta secciones que se quedan sin hijos visibles.
- Agrega menu:

```text
Movimientos de inventario
```

Ubicacion:

- Dentro de la seccion `Catalogo`.

Permiso:

- Visible solo para `ADMIN`.

Tambien se marco `Usuarios` como visible solo para `ADMIN`.

### `src/features/catalog/products/domain/entities/Product.ts`

Cambio:

- `ProductMutation.currentStock` paso de obligatorio a opcional.

Motivo:

- En creacion se puede enviar como stock inicial.
- En actualizacion ya no se envia stock al backend.

### `src/features/catalog/products/infrastructure/ProductRepositoryImpl.ts`

Cambio:

- `update(...)` ahora usa `ProductMapper.toUpdateRequest(data)`.

Motivo:

- Evitar enviar `currentStock` en `PUT /products/{id}`.

### `src/features/catalog/products/infrastructure/mappers/ProductMapper.ts`

Cambios:

- Crea `BackendProductUpdateRequest` como request sin `currentStock`.
- `toRequest(...)` conserva `currentStock` para creacion, usando `0` si viene
  undefined.
- `toUpdateRequest(...)` arma el request de edicion sin `currentStock`.
- Normaliza `barcode`, `name` y `description`.

Motivo:

- Cumplir el contrato del backend: crear producto puede auditar stock inicial,
  editar producto no modifica existencias.

### `src/features/catalog/products/ui/components/ProductForm.tsx`

Cambios:

- En creacion muestra campo `Stock inicial`.
- En edicion muestra `Stock actual` deshabilitado.
- En edicion muestra helper y alerta:

```text
Las existencias se modifican desde Movimientos de inventario.
```

Motivo:

- El usuario ve el stock actual, pero no puede modificarlo desde la edicion
  normal del producto.

### `src/features/catalog/products/ui/schemas/productSchema.ts`

Cambios:

- Agrega helper `hasUpToTwoDecimals`.
- `currentStock` ahora valida como stock inicial:
  - mayor o igual a cero.
  - maximo dos decimales.
- `minimumStock` tambien valida maximo dos decimales.

Motivo:

- Mantener compatibilidad con `NUMERIC(10,2)` y el contrato del backend.

## Permisos implementados

- La ruta `/inventory/movements` esta protegida para `ADMIN`.
- El menu `Movimientos de inventario` solo aparece para `ADMIN`.
- Los botones de entrada/salida estan dentro de una pagina que solo ADMIN puede
  abrir.
- CASHIER no tiene acceso visual al modulo.
- El backend sigue siendo la autoridad final para permisos y puede responder
  `403`.

## Manejo de errores

El modulo usa:

- `normalizeApiError`
- `NormalizedApiError`
- errores de validacion del backend cuando vienen en `validationErrors`

Errores mostrados:

- Error de historial en la pagina.
- Error de mutacion en la pagina y dentro del modal.
- Error de carga de productos en formulario/filtros.
- Error visual de fecha inicial posterior a fecha final.
- Error visual de salida mayor al stock visible.

No se muestran objetos Axios, stack traces ni JSON tecnico.

## Integracion con Products

El modulo reutiliza `productDependencies.getProductsUseCase` para buscar
productos en:

- Formulario de entrada/salida.
- Filtros por producto.

La seleccion muestra:

```text
Nombre · Codigo de barras · Stock: numero
```

En el dropdown tambien muestra unidad traducida con `PRODUCT_UNIT_LABELS`.

No se duplico repository de productos ni se uso Axios directo desde la UI.

## Lo que NO se implemento

Estos cambios no agregan:

- Ventas.
- Devoluciones.
- Compras.
- Proveedores.
- Reportes avanzados.
- Ajustes masivos.
- Edicion de movimientos.
- Eliminacion de movimientos.
- Funcionalidades para CASHIER.
- Cambio directo de `currentStock`.
- Dependencia con sesion de caja.
- Nuevas dependencias.

## Verificacion conocida

Scripts disponibles en `package.json`:

```json
{
  "build": "tsc -b && vite build",
  "lint": "oxlint"
}
```

Durante la integracion del modulo se ejecuto:

```text
npm run build
npm run lint
```

Ambos terminaron correctamente. `npm run build` mostro solamente advertencia de
tamano de chunk de Vite, no error de TypeScript ni de compilacion.

No existe script de pruebas configurado en `package.json`, por eso no hay
comando `npm test` documentado para este frontend.

## Lista de archivos pendientes segun Git

Archivos modificados:

- `src/app/router/routes.tsx`
- `src/features/catalog/products/domain/entities/Product.ts`
- `src/features/catalog/products/infrastructure/ProductRepositoryImpl.ts`
- `src/features/catalog/products/infrastructure/mappers/ProductMapper.ts`
- `src/features/catalog/products/ui/components/ProductForm.tsx`
- `src/features/catalog/products/ui/schemas/productSchema.ts`
- `src/shared/routes/routePaths.ts`
- `src/shared/ui/layout/DashboardLayout.tsx`

Archivos nuevos:

- `src/features/inventory/movement/application/useCases/CreateInventoryEntryUseCase.ts`
- `src/features/inventory/movement/application/useCases/CreateInventoryExitUseCase.ts`
- `src/features/inventory/movement/application/useCases/GetInventoryMovementByIdUseCase.ts`
- `src/features/inventory/movement/application/useCases/GetInventoryMovementsUseCase.ts`
- `src/features/inventory/movement/application/useCases/GetProductInventoryMovementsUseCase.ts`
- `src/features/inventory/movement/dependencies.ts`
- `src/features/inventory/movement/domain/entities/InventoryMovement.ts`
- `src/features/inventory/movement/domain/repositories/InventoryMovementRepository.ts`
- `src/features/inventory/movement/index.ts`
- `src/features/inventory/movement/infrastructure/InventoryMovementRepositoryImpl.ts`
- `src/features/inventory/movement/infrastructure/mappers/InventoryMovementMapper.ts`
- `src/features/inventory/movement/ui/components/InventoryMovementFilters.tsx`
- `src/features/inventory/movement/ui/components/InventoryMovementsGrid.tsx`
- `src/features/inventory/movement/ui/components/ManualInventoryMovementForm.tsx`
- `src/features/inventory/movement/ui/components/ManualInventoryMovementModal.tsx`
- `src/features/inventory/movement/ui/hooks/useCreateInventoryEntry.ts`
- `src/features/inventory/movement/ui/hooks/useCreateInventoryExit.ts`
- `src/features/inventory/movement/ui/hooks/useInventoryMovementDetails.ts`
- `src/features/inventory/movement/ui/hooks/useInventoryMovements.ts`
- `src/features/inventory/movement/ui/pages/InventoryMovementsPage.tsx`
- `src/features/inventory/movement/ui/schemas/manualInventoryMovementSchema.ts`
- `src/shared/routes/RoleProtectedRoute.tsx`
- `README_PENDING_CHANGES.md`

