# Frontend - Guía Completa de Cambios Pendientes

Este documento explica los cambios actuales de `pos-frontend` que todavía no están subidos a GitHub.

La intención no es sólo listar archivos. También explica por qué existe cada archivo, qué hace cada tipo, qué hace cada método, cómo se conectan las capas y cómo puedes repetir este patrón para crear otro módulo sola.

## Resumen del Cambio

Se extendió el feature existente:

```text
src/features/sales
```

para agregar historial y detalle de ventas.

Funcionalidad nueva:

- Ruta `/sales/history`.
- Historial paginado de ventas.
- Historial global para `ADMIN`.
- Historial de sesión actual para `CASHIER`.
- Filtros para `ADMIN`.
- Tabla con AG Grid.
- Drawer lateral para detalle.
- Consulta de detalle por folio.
- Integración con `ROUTE_PATHS`.
- Integración con router.
- Integración con menú lateral.
- Manejo de errores con `normalizeApiError`.
- Uso de `PageResponse`.
- Reutilización de `customers`, `users`, `auth` y `cash/session`.

No se agregaron dependencias.

No se implementó:

- Venta fiada.
- Abonos.
- Devoluciones.
- Cancelaciones.
- Edición.
- Eliminación.
- Impresión.
- Reportes agregados.

## Endpoints Consumidos

El frontend consume estos endpoints del backend:

```text
GET /sales/current-session
GET /sales
GET /sales/{id}
```

Recuerda que el `httpClient` ya tiene configurado el `baseURL`:

```ts
VITE_API_BASE_URL=http://localhost:8080/api
```

Por eso en el repositorio se escribe:

```ts
this.client.get('/sales')
```

y no:

```ts
this.client.get('http://localhost:8080/api/sales')
```

## Arquitectura Usada

El feature sigue la arquitectura existente:

```text
src/features/sales/
├── application/
│   └── useCases/
├── domain/
│   ├── entities/
│   └── repositories/
├── infrastructure/
│   ├── mappers/
│   └── SaleRepositoryImpl.ts
├── ui/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   └── schemas/
├── dependencies.ts
└── index.ts
```

La responsabilidad de cada capa es:

- `domain`: tipos y contratos puros. No React. No Axios. No Material UI.
- `application`: casos de uso. Orquestan acciones del dominio.
- `infrastructure`: implementación técnica. Aquí vive HTTP.
- `ui`: React, hooks, páginas y componentes.
- `dependencies.ts`: crea instancias e inyecta dependencias.
- `index.ts`: exporta la API pública del feature.

## Flujo Completo de Datos

Cuando ADMIN abre `/sales/history`:

```text
SalesHistoryPage
  -> useSalesHistory
    -> GetSalesHistoryUseCase
      -> SaleRepository.getSalesHistory
        -> SaleRepositoryImpl.getSalesHistory
          -> httpClient.get('/sales')
          -> SaleMapper.toSummaryEntity
```

Cuando CASHIER abre `/sales/history`:

```text
SalesHistoryPage
  -> useSalesHistory
    -> GetCurrentSessionSalesUseCase
      -> SaleRepository.getCurrentSessionSales
        -> SaleRepositoryImpl.getCurrentSessionSales
          -> httpClient.get('/sales/current-session')
          -> SaleMapper.toSummaryEntity
```

Cuando se da clic en `Ver detalle`:

```text
SalesHistoryGrid
  -> onViewDetails(id)
    -> useSaleDetails.openDetails(id)
      -> GetSaleByIdUseCase
        -> SaleRepository.getById
          -> SaleRepositoryImpl.getById
            -> httpClient.get('/sales/{id}')
            -> SaleMapper.toEntity
              -> SaleDetailDrawer
```

## TypeScript Usado

### `type`

Se usan `type` para definir la forma de los datos:

```ts
export type SaleSummary = {
  id: number
  createdAt: string
  total: number
}
```

Esto le dice a TypeScript qué propiedades debe tener un objeto.

### Union Types

Ejemplo:

```ts
export type SaleType = 'CASH' | 'CREDIT'
```

Esto significa que `SaleType` sólo puede tener esos valores.

Si escribes:

```ts
const type: SaleType = 'CARD'
```

TypeScript marcaría error porque `CARD` no existe en el tipo.

### `Record`

Ejemplo:

```ts
export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  CASH: 'Efectivo',
  CREDIT: 'Fiado',
}
```

`Record<SaleType, string>` significa:

- debe haber una clave por cada valor de `SaleType`
- cada clave debe tener un texto

Si agregas un nuevo `SaleType`, TypeScript te obliga a agregar su traducción.

### `Promise`

Ejemplo:

```ts
execute(id: number): Promise<Sale>
```

Significa que el método es asíncrono y en algún momento devolverá un `Sale`.

Se consume con:

```ts
const sale = await useCase.execute(id)
```

### `import type`

Ejemplo:

```ts
import type { Sale } from '../../domain/entities/Sale'
```

`import type` importa sólo tipos. No genera código JavaScript en runtime.

Se usa para mantener el bundle limpio y evitar imports innecesarios.

### `as const`

En `dependencies.ts`:

```ts
export const saleDependencies = {
  createCashSaleUseCase: new CreateCashSaleUseCase(saleRepository),
} as const
```

`as const` hace que el objeto sea de sólo lectura a nivel de tipos.

## Archivos Nuevos

## 1. `GetCurrentSessionSalesUseCase.ts`

Ruta:

```text
src/features/sales/application/useCases/GetCurrentSessionSalesUseCase.ts
```

Código principal:

```ts
export class GetCurrentSessionSalesUseCase {
  private readonly saleRepository: SaleRepository

  constructor(saleRepository: SaleRepository) {
    this.saleRepository = saleRepository
  }

  execute(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>> {
    return this.saleRepository.getCurrentSessionSales(filters)
  }
}
```

### Qué hace

Consulta las ventas de la sesión de caja actual.

### Por qué existe

La UI no debe hablar directo con el repositorio. La UI habla con casos de uso. Esto mantiene una separación clara:

- UI: eventos y presentación.
- Caso de uso: acción de negocio.
- Repositorio: datos.

### `private readonly saleRepository`

```ts
private readonly saleRepository: SaleRepository
```

Significa:

- `private`: sólo esta clase puede usarlo.
- `readonly`: se asigna en constructor y no se cambia después.
- `SaleRepository`: depende del contrato, no de la implementación.

Eso permite que el caso de uso no sepa si los datos vienen de Axios, fetch o pruebas.

### `constructor`

```ts
constructor(saleRepository: SaleRepository) {
  this.saleRepository = saleRepository
}
```

Recibe el repositorio desde afuera. Eso es inyección de dependencias.

### `execute`

```ts
execute(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>>
```

Recibe filtros y devuelve una página de ventas resumidas.

No contiene lógica de React ni HTTP.

## 2. `GetSalesHistoryUseCase.ts`

Ruta:

```text
src/features/sales/application/useCases/GetSalesHistoryUseCase.ts
```

Hace lo mismo que el anterior, pero consulta historial global:

```ts
execute(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>> {
  return this.saleRepository.getSalesHistory(filters)
}
```

Lo usa ADMIN.

## 3. `GetSaleByIdUseCase.ts`

Ruta:

```text
src/features/sales/application/useCases/GetSaleByIdUseCase.ts
```

Código principal:

```ts
execute(id: number): Promise<Sale> {
  return this.saleRepository.getById(id)
}
```

### Qué hace

Consulta una venta completa por ID.

### Qué devuelve

Devuelve `Sale`, que contiene:

- cabecera
- totales
- efectivo
- cambio
- items

## 4. `useSalesHistory.ts`

Ruta:

```text
src/features/sales/ui/hooks/useSalesHistory.ts
```

Este es el hook más importante del historial.

### Estados internos

```ts
const [sales, setSales] = useState<SaleSummary[]>([])
```

Guarda las ventas de la página actual.

```ts
const [filters, setFilters] = useState<SaleHistoryFilters>(INITIAL_FILTERS)
```

Guarda filtros actuales.

```ts
const [debouncedFolio, setDebouncedFolio] = useState<number | undefined>(undefined)
```

Guarda el folio después del debounce. Sirve para no consultar el backend en cada tecla.

```ts
const [loading, setLoading] = useState(true)
```

Indica si hay una consulta activa.

```ts
const [error, setError] = useState<NormalizedApiError | null>(null)
```

Guarda errores normalizados.

```ts
const [totalElements, setTotalElements] = useState(0)
const [totalPages, setTotalPages] = useState(0)
```

Datos de paginación del backend.

### Detectar rol

```ts
const isAdmin = user?.role === 'ADMIN'
```

Esta variable decide qué endpoint se usará.

### Debounce de folio

```ts
useEffect(() => {
  const timeout = window.setTimeout(() => {
    setDebouncedFolio(filters.folio)
  }, FOLIO_DEBOUNCE_MS)

  return () => window.clearTimeout(timeout)
}, [filters.folio])
```

Qué hace:

1. Espera 300 ms después del último cambio.
2. Copia `filters.folio` a `debouncedFolio`.
3. Si el usuario sigue escribiendo, cancela el timeout anterior.

Esto evita llamadas excesivas al backend.

### Limpiar filtros antes de enviar

```ts
const cleanFilters = (filters: SaleHistoryFilters): SaleHistoryFilters => ({
  ...filters,
  id: filters.id || undefined,
  folio: filters.folio || undefined,
  customerId: filters.customerId || undefined,
  createdByUserId: filters.createdByUserId || undefined,
  status: filters.status || undefined,
  saleType: filters.saleType || undefined,
  from: filters.from || undefined,
  to: filters.to || undefined,
})
```

Convierte valores vacíos a `undefined`.

Eso importa porque Axios no debe mandar parámetros vacíos como:

```text
status=
customerId=
```

### `requestFilters`

```ts
const requestFilters = useMemo<SaleHistoryFilters>(
  () =>
    cleanFilters({
      ...filters,
      folio: debouncedFolio,
    }),
  [debouncedFolio, filters],
)
```

`useMemo` recalcula los filtros sólo cuando cambian `filters` o `debouncedFolio`.

### `fetchSales`

```ts
const fetchSales = useCallback(
  async (nextFilters: SaleHistoryFilters = requestFilters) => {
    ...
  },
  [...]
)
```

`useCallback` mantiene estable la función entre renders.

Dentro hace:

1. Valida usuario.
2. Valida rango de fechas.
3. Activa loading.
4. Limpia error anterior.
5. Decide endpoint según rol.
6. Guarda resultado.
7. Normaliza errores.
8. Si CASHIER no tiene caja, redirige.

Decisión de endpoint:

```ts
const page = isAdmin
  ? await saleDependencies.getSalesHistoryUseCase.execute(nextFilters)
  : await saleDependencies.getCurrentSessionSalesUseCase.execute(nextFilters)
```

### Manejo de caja cerrada

```ts
if (!isAdmin && normalizedError.status === 409) {
  await refreshCurrentSession()
  navigate(ROUTE_PATHS.cashSessionOpen, {
    replace: true,
    state: { from: location },
  })
}
```

Si CASHIER no tiene caja abierta:

- refresca contexto de caja
- navega a apertura
- conserva desde dónde venía

### Cambiar filtros

```ts
const updateFilters = useCallback((nextFilters: Partial<SaleHistoryFilters>) => {
  setFilters((currentFilters) => ({
    ...currentFilters,
    ...nextFilters,
    page: 0,
  }))
}, [])
```

Cada cambio de filtro regresa a página 0.

### Cambiar página

```ts
const setPage = useCallback((nextPage: number) => {
  setFilters((currentFilters) => ({
    ...currentFilters,
    page: nextPage,
  }))
}, [])
```

### Cambiar tamaño

```ts
const setSize = useCallback((nextSize: number) => {
  setFilters((currentFilters) => ({
    ...currentFilters,
    page: 0,
    size: nextSize,
  }))
}, [])
```

Si cambia tamaño, vuelve a página 0.

## 5. `useSaleDetails.ts`

Ruta:

```text
src/features/sales/ui/hooks/useSaleDetails.ts
```

Estados:

```ts
const [sale, setSale] = useState<Sale | null>(null)
const [open, setOpen] = useState(false)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<NormalizedApiError | null>(null)
```

### `openDetails`

```ts
const openDetails = useCallback(async (id: number) => {
  setOpen(true)
  setLoading(true)
  setError(null)

  try {
    const data = await saleDependencies.getSaleByIdUseCase.execute(id)
    setSale(data)
  } catch (unknownError) {
    setSale(null)
    setError(normalizeApiError(unknownError))
  } finally {
    setLoading(false)
  }
}, [])
```

Qué hace:

1. Abre el drawer inmediatamente.
2. Muestra loading.
3. Limpia errores.
4. Consulta backend.
5. Guarda venta.
6. Si falla, guarda error normalizado.
7. Apaga loading.

### `closeDetails`

```ts
const closeDetails = useCallback(() => {
  setOpen(false)
  setSale(null)
  setError(null)
}, [])
```

Cierra el drawer y limpia datos.

## 6. `SalesHistoryPage.tsx`

Ruta:

```text
src/features/sales/ui/pages/SalesHistoryPage.tsx
```

Es la pantalla principal.

Usa:

```ts
const history = useSalesHistory()
const saleDetails = useSaleDetails()
```

### `PageHeader`

Muestra título:

```text
Historial de ventas
```

Subtítulo según rol:

```ts
isAdmin
  ? 'Consulta y filtra las ventas registradas en el sistema.'
  : 'Ventas registradas durante tu sesión de caja actual.'
```

### `DataGridShell`

Envuelve la tabla y toolbar con el estilo del sistema.

Se usa para mantener consistencia con inventario, productos, clientes, etc.

### Botón `Actualizar`

```tsx
<Button
  disabled={loading}
  onClick={() => void refetch()}
  startIcon={loading ? <CircularProgress size={18} /> : <SyncRoundedIcon />}
>
  Actualizar
</Button>
```

`void refetch()` se usa porque el evento no espera la promesa. Evita warnings de promesas flotantes.

### Filtros sólo ADMIN

```tsx
{isAdmin ? (
  <SalesHistoryFilters
    filters={filters}
    onChange={setFilters}
    onClear={clearFilters}
  />
) : null}
```

CASHIER no ve filtros avanzados porque sólo consulta su sesión actual.

### Estado vacío

Si no hay datos:

```tsx
<EmptyState ... />
```

ADMIN ve:

```text
No hay ventas para mostrar con los filtros actuales.
```

CASHIER ve:

```text
No hay ventas registradas en tu sesión actual.
```

### Tabla

```tsx
<SalesHistoryGrid
  loading={loading}
  onViewDetails={(saleId) => void saleDetails.openDetails(saleId)}
  sales={sales}
/>
```

Cuando el usuario da clic en detalle, se llama al hook.

### Paginación

```tsx
<TablePagination
  count={totalElements}
  page={page}
  rowsPerPage={size}
  rowsPerPageOptions={[10, 20, 50]}
/>
```

La paginación es del backend. No se cargan todas las ventas.

### Drawer

```tsx
<SaleDetailDrawer
  errorMessage={saleDetails.error?.message}
  loading={saleDetails.loading}
  onClose={saleDetails.closeDetails}
  open={saleDetails.open}
  sale={saleDetails.sale}
/>
```

La página controla cuándo se abre y qué venta se muestra.

## 7. `SalesHistoryGrid.tsx`

Ruta:

```text
src/features/sales/ui/components/SalesHistoryGrid.tsx
```

Usa AG Grid Community:

```ts
ModuleRegistry.registerModules([AllCommunityModule])
```

Props:

```ts
type SalesHistoryGridProps = {
  loading: boolean
  onViewDetails: (saleId: number) => void
  sales: SaleSummary[]
}
```

### `columnDefs`

Se crea con `useMemo`:

```ts
const columnDefs = useMemo<ColDef<SaleSummary>[]>(() => [...], [onViewDetails])
```

Esto evita recrear columnas en cada render.

### Columna Folio

```ts
{
  field: 'id',
  headerName: 'Folio',
  valueFormatter: ({ value }) => `#${value}`,
}
```

El ID de venta se muestra como folio.

### Columna Fecha

```ts
valueFormatter: ({ value }) => formatDateTime(value as string | null | undefined)
```

Usa formatter compartido para mantener formato consistente.

### Columna Cliente

```tsx
{value || 'Público general'}
```

Si no hay cliente, muestra `Público general`.

### Columna Tipo

```ts
SALE_TYPE_LABELS[value as SaleSummary['saleType']]
```

Traduce:

- `CASH` a `Efectivo`
- `CREDIT` a `Fiado`

### Columna Total

```ts
formatCurrency(Number(value))
```

Formatea moneda en MXN.

### Columna Estado

Usa `Chip`:

```tsx
<Chip
  color={value === 'COMPLETED' ? 'success' : 'default'}
  label={value ? SALE_STATUS_LABELS[value] : '-'}
/>
```

### Acción `Ver detalle`

```tsx
<Button
  onClick={() => onViewDetails(data.id)}
  size="small"
  startIcon={<VisibilityRoundedIcon />}
>
  Ver detalle
</Button>
```

No hay botones de editar, eliminar, cancelar o devolver.

### AG Grid

```tsx
<AgGridReact<SaleSummary>
  rowData={sales}
  columnDefs={columnDefs}
  rowHeight={46}
/>
```

`<SaleSummary>` es un generic. Le dice a AG Grid que cada fila tiene forma de `SaleSummary`.

## 8. `SalesHistoryFilters.tsx`

Ruta:

```text
src/features/sales/ui/components/SalesHistoryFilters.tsx
```

Props:

```ts
type SalesHistoryFiltersProps = {
  filters: SaleHistoryFiltersValue
  onChange: (filters: Partial<SaleHistoryFiltersValue>) => void
  onClear: () => void
}
```

### `Partial`

```ts
Partial<SaleHistoryFiltersValue>
```

Significa que puedes enviar sólo algunos campos del filtro.

Ejemplo:

```ts
onChange({ status: 'COMPLETED' })
```

No necesitas mandar todo el objeto.

### Búsqueda de clientes

Usa:

```ts
customerDependencies.getCustomersUseCase.execute({
  search: search.trim() || undefined,
  size: 10,
})
```

Esto reutiliza el módulo `customers`.

No se creó otro repositorio.

### Búsqueda de usuarios

Usa:

```ts
userDependencies.getUsersUseCase.execute({
  search: search.trim() || undefined,
  size: 10,
})
```

Esto reutiliza el módulo `users`.

### Debounce

```ts
useEffect(() => {
  const timeout = window.setTimeout(() => {
    void loadCustomers(customerSearch)
  }, 300)

  return () => window.clearTimeout(timeout)
}, [customerSearch, loadCustomers])
```

Evita pedir clientes al backend en cada tecla.

### `Autocomplete`

Material UI `Autocomplete` se usa para clientes y cajeros.

Puntos importantes:

```tsx
filterOptions={(options) => options}
```

Esto desactiva el filtrado local, porque el backend ya devuelve resultados filtrados.

```tsx
isOptionEqualToValue={(option, value) => option.id === value.id}
```

Esto evita errores de selección cuando los objetos cambian de referencia.

### Estado

```tsx
<Select
  value={filters.status ?? ''}
  onChange={(event) =>
    onChange({
      status: event.target.value ? (event.target.value as SaleStatus) : undefined,
    })
  }
>
```

Si el usuario elige vacío, se manda `undefined` para limpiar filtro.

### Fechas

```tsx
type="datetime-local"
```

El navegador muestra un control de fecha/hora.

El hook valida que `from` no sea mayor a `to`.

## 9. `SaleDetailDrawer.tsx`

Ruta:

```text
src/features/sales/ui/components/SaleDetailDrawer.tsx
```

Props:

```ts
type SaleDetailDrawerProps = {
  errorMessage?: string
  loading: boolean
  onClose: () => void
  open: boolean
  sale: Sale | null
}
```

### Por qué Drawer

Se usa `Drawer` porque el detalle es una consulta rápida desde una tabla.

Ventajas:

- No pierdes contexto del historial.
- Puedes abrir/cerrar muchas ventas rápido.
- En escritorio se siente como panel lateral.
- En móvil puede ocupar todo el ancho.

### `slotProps.paper`

```tsx
slotProps={{
  paper: {
    sx: {
      maxWidth: '100%',
      width: { xs: '100%', md: 620 },
    },
  },
}}
```

Configura el ancho del drawer.

En móvil:

```ts
xs: '100%'
```

En escritorio:

```ts
md: 620
```

### `DetailRow`

Componente pequeño para mostrar etiqueta y valor:

```tsx
const DetailRow = ({ label, value }: { label: string; value: string }) => (...)
```

Sirve para no repetir markup en Folio, Fecha, Cajero, Cliente, Total, etc.

### `SaleItemRow`

Muestra una línea de venta:

- nombre histórico
- código histórico
- cantidad
- unidad
- precio
- importe

Importante:

```tsx
{item.productName}
{item.productBarcode}
{item.unitPrice}
```

Estos datos vienen de `sale_items`, no del producto actual.

### No mostrar costo

El componente no usa `unitCost`.

Aunque algún día el backend lo devolviera por error, esta interfaz no lo pinta.

## Archivos Modificados

## 10. `Sale.ts`

Ruta:

```text
src/features/sales/domain/entities/Sale.ts
```

### `SaleType`

```ts
export type SaleType = 'CASH' | 'CREDIT'
```

Aunque el frontend sólo usa efectivo, `CREDIT` existe porque el backend lo conoce.

### `SaleStatus`

```ts
export type SaleStatus = 'COMPLETED' | 'CANCELLED'
```

Aunque no hay cancelación en UI, el backend ya tiene el estado.

### `SaleItem`

```ts
export type SaleItem = {
  id: number
  productId: number
  productName: string
  productBarcode: string
  productUnit: ProductUnit
  quantity: number
  unitPrice: number
  lineTotal: number
}
```

Representa un item del detalle.

No incluye `unitCost`.

### `Sale`

Representa detalle completo o respuesta de creación.

Campos importantes:

- `cashSessionId`
- `createdById`
- `createdByUsername`
- `customerId`
- `customerFullName`
- `total`
- `cashReceived`
- `changeAmount`
- `items`

### `SaleSummary`

```ts
export type SaleSummary = {
  id: number
  createdAt: string
  createdById: number
  createdByUsername: string
  customerId: number | null
  customerFullName: string
  saleType: SaleType
  status: SaleStatus
  total: number
  totalItems: number
}
```

Este tipo es para filas del historial.

No trae items porque una tabla de historial debe ser ligera.

### `SaleHistoryFilters`

```ts
export type SaleHistoryFilters = {
  id?: number
  folio?: number
  customerId?: number
  createdByUserId?: number
  status?: SaleStatus
  saleType?: SaleType
  from?: string
  to?: string
  page: number
  size: number
  sort?: string
}
```

Define los filtros que viajan al backend.

`page` y `size` son obligatorios porque siempre se pagina.

### Labels

```ts
export const SALE_TYPE_LABELS: Record<SaleType, string> = {
  CASH: 'Efectivo',
  CREDIT: 'Fiado',
}
```

```ts
export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}
```

Centralizar labels evita repetir traducciones en varios componentes.

## 11. `SaleRepository.ts`

Ruta:

```text
src/features/sales/domain/repositories/SaleRepository.ts
```

Contrato:

```ts
export type SaleRepository = {
  createCashSale(data: CreateCashSaleData): Promise<Sale>
  getCurrentSessionSales(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>>
  getSalesHistory(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>>
  getById(id: number): Promise<Sale>
}
```

Este archivo no tiene implementación.

Sólo dice:

"El módulo de ventas necesita un repositorio que sepa hacer estas operaciones".

## 12. `SaleRepositoryImpl.ts`

Ruta:

```text
src/features/sales/infrastructure/SaleRepositoryImpl.ts
```

Implementa el contrato usando Axios a través de `httpClient`.

### `createCashSale`

Ya existía.

Consume:

```text
POST /sales
```

### `getCurrentSessionSales`

```ts
async getCurrentSessionSales(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>> {
  const { data } = await this.client.get<PageResponse<BackendSaleSummaryResponse>>(
    '/sales/current-session',
    {
      params: SaleMapper.toFiltersParams(filters),
    },
  )

  return {
    ...data,
    content: data.content.map((sale) => SaleMapper.toSummaryEntity(sale)),
  }
}
```

Puntos importantes:

- Usa `httpClient`.
- No se llama desde componentes.
- Convierte cada fila backend a dominio.
- Preserva metadatos de paginación con `...data`.

### `getSalesHistory`

Consume:

```text
GET /sales
```

Usa el mismo mapper que sesión actual.

### `getById`

Consume:

```text
GET /sales/{id}
```

Devuelve `Sale`.

## 13. `SaleMapper.ts`

Ruta:

```text
src/features/sales/infrastructure/mappers/SaleMapper.ts
```

El mapper separa contrato backend de dominio frontend.

### Tipos Backend

```ts
export type BackendSaleResponse = { ... }
export type BackendSaleSummaryResponse = { ... }
```

Estos representan exactamente lo que devuelve el backend.

### `toEntity`

Convierte detalle backend a `Sale`.

Ejemplo:

```ts
total: Number(response.total)
```

Aunque JSON normalmente trae números, convertir explícitamente evita inconsistencias si en algún momento llega string numérico.

### `toItemEntity`

Convierte un item backend a `SaleItem`.

### `toSummaryEntity`

Convierte una fila backend a `SaleSummary`.

Maneja cliente nulo:

```ts
customerFullName: response.customerFullName || 'Público general'
```

### `toRequest`

Convierte una venta en efectivo al request del backend.

Importante:

Sólo manda:

- `saleType`
- `customerId`
- `cashReceived`
- `items`

No manda:

- precio
- costo
- total
- stock
- usuario
- caja

### `toFiltersParams`

Convierte filtros a parámetros HTTP.

```ts
toFiltersParams(filters: SaleHistoryFilters): Record<string, string | number | undefined>
```

Devuelve algo como:

```ts
{
  folio: filters.folio,
  customerId: filters.customerId,
  page: filters.page,
  size: filters.size,
  sort: filters.sort ?? 'createdAt,DESC',
}
```

## 14. `dependencies.ts`

Ruta:

```text
src/features/sales/dependencies.ts
```

Se agregaron dependencias:

```ts
getCurrentSessionSalesUseCase
getSalesHistoryUseCase
getSaleByIdUseCase
```

Todas comparten:

```ts
const saleRepository = new SaleRepositoryImpl(httpClient)
```

Esto evita crear repositorios dentro de componentes.

## 15. `index.ts`

Ruta:

```text
src/features/sales/index.ts
```

Exporta lo público del feature:

```ts
export { SalesHistoryPage } from './ui/pages/SalesHistoryPage'
export { SalesPage } from './ui/pages/SalesPage'
```

También exporta tipos:

```ts
Sale
SaleSummary
SaleHistoryFilters
SaleItem
SaleStatus
SaleType
```

Esto permite imports limpios desde otras capas.

## 16. `routePaths.ts`

Ruta:

```text
src/shared/routes/routePaths.ts
```

Se agregó:

```ts
salesHistory: '/sales/history'
```

Regla:

No escribir rutas hardcodeadas en componentes si ya existe `ROUTE_PATHS`.

## 17. `routes.tsx`

Ruta:

```text
src/app/router/routes.tsx
```

Se agregó:

```tsx
{
  element: <RoleProtectedRoute roles={['ADMIN', 'CASHIER']} />,
  children: [
    {
      path: ROUTE_PATHS.salesHistory,
      element: <SalesHistoryPage />,
    },
  ],
}
```

Decisión importante:

`/sales` está bajo `RequireOpenCashSession` porque vender requiere caja.

`/sales/history` no está bajo `RequireOpenCashSession` directamente porque ADMIN debe poder consultar historial sin caja abierta.

## 18. `DashboardLayout.tsx`

Ruta:

```text
src/shared/ui/layout/DashboardLayout.tsx
```

El menú `Ventas` ahora es un grupo:

```ts
{
  label: 'Ventas',
  icon: <ReceiptLongRoundedIcon />,
  children: [
    {
      label: 'Nueva venta',
      path: ROUTE_PATHS.sales,
      icon: <ReceiptLongRoundedIcon />,
    },
    {
      label: 'Historial de ventas',
      path: ROUTE_PATHS.salesHistory,
      icon: <SearchRoundedIcon />,
    },
  ],
}
```

Antes sólo había una opción directa de ventas.

### `openGroups`

Se cambió:

```ts
const [catalogOpen, setCatalogOpen] = useState(true)
```

por:

```ts
const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
  Catalogo: true,
  Ventas: true,
})
```

Esto permite manejar varios grupos colapsables:

- Catálogo.
- Ventas.

Cada grupo abre y cierra de forma independiente.

## Permisos

### ADMIN

Puede:

- Entrar a `/sales/history`.
- Consultar `GET /sales`.
- Usar filtros.
- Ver cualquier detalle.
- No necesita caja abierta para historial.

### CASHIER

Puede:

- Entrar a `/sales/history`.
- Consultar `GET /sales/current-session`.
- Ver ventas de su caja actual.
- Abrir detalle.

No puede:

- Consultar historial global desde frontend.
- Ver filtros globales.

El backend sigue siendo la autoridad final.

## Manejo de Errores

No se usa `alert()`.

No se muestran objetos Axios.

Se usa:

```ts
normalizeApiError()
```

Errores cubiertos:

- `400`: filtros inválidos.
- `401`: sesión expirada.
- `403`: permiso denegado.
- `404`: venta no encontrada.
- `409`: caja no abierta.
- red/backend apagado.

## Paginación

La paginación es server-side.

El frontend manda:

```text
page
size
sort
```

El backend responde:

```ts
PageResponse<SaleSummary>
```

La tabla no carga todas las ventas en memoria.

## Qué Aprender de Este Cambio

Para crear otro historial parecido:

1. Crear tipos de dominio.
2. Crear filtros.
3. Agregar métodos al repository contract.
4. Implementar métodos en repository impl.
5. Crear mapper backend -> dominio.
6. Crear casos de uso.
7. Registrar casos de uso en `dependencies.ts`.
8. Crear hook de listado.
9. Crear hook de detalle si aplica.
10. Crear grid.
11. Crear filtros.
12. Crear página.
13. Agregar ruta en `ROUTE_PATHS`.
14. Agregar ruta en router.
15. Agregar opción de menú.
16. Ejecutar build y lint.

## Verificación Ejecutada

Se ejecutó:

```bash
npm run build
```

Resultado:

```text
✓ built in 4.80s
Warning: Some chunks are larger than 500 kB after minification.
```

Se ejecutó:

```bash
npm run lint
```

Resultado:

```text
oxlint
```

Sin errores.

## Commit Sugerido

```text
feat(frontend): add sales history and detail view
```

Cuerpo sugerido:

```text
- Add sales history route and menu entry.
- Add paginated global history for ADMIN.
- Add current-session history for CASHIER.
- Add sale detail drawer.
- Add ADMIN filters by folio, customer, cashier, status, and dates.
- Add sales history grid with backend pagination.
- Add use cases, hooks, repository methods, and mapper support.
- Reuse customers, users, auth, cash session, httpClient, PageResponse, and normalizeApiError.
- Keep sales read-only with no returns, cancellations, edits, deletes, or printing.
```
