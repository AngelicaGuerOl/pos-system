import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { Alert, Button, Chip, FormControl, InputLabel, MenuItem, Select, Stack, TablePagination, TextField, Tooltip } from '@mui/material'
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataGridShell } from '../../../../../shared/ui/components/DataGridShell'
import { EmptyState } from '../../../../../shared/ui/components/EmptyState'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
import { ROUTE_PATHS } from '../../../../../shared/routes/routePaths'
import { formatCurrency, formatDate } from '../../../../../shared/utils/formatters'
import { useSuppliers } from '../../../../catalog/suppliers/ui/hooks/useSuppliers'
import type { SupplierEntry } from '../../domain/entities/SupplierEntry'
import { useSupplierEntries } from '../hooks/useSupplierEntries'

ModuleRegistry.registerModules([AllCommunityModule])

const unknownCost = 'No se encontraba registrado en el archivo original.'
const costKnown = (entry: SupplierEntry) => !entry.historicalImport || entry.items.some((item) => item.costKnown)
const nullableCost = (entry: SupplierEntry) => costKnown(entry) ? formatCurrency(entry.totalCost) : '—'

export const SupplierEntriesPage = () => {
  const navigate = useNavigate()
  const entriesState = useSupplierEntries()
  const suppliersState = useSuppliers({ active: true, size: 50 })

  const columnDefs = useMemo<ColDef<SupplierEntry>[]>(() => [
    { field: 'entryDate', headerName: 'Fecha', minWidth: 130, valueFormatter: ({ value }) => formatDate(String(value)) },
    { field: 'supplierName', flex: 1, headerName: 'Proveedor', minWidth: 180 },
    { headerName: 'Productos', maxWidth: 120, valueGetter: ({ data }) => data?.items?.length ?? 0 },
    {
      field: 'totalCost',
      headerName: 'Total costo',
      cellRenderer: ({ data }: { data?: SupplierEntry }) => data ? (
        costKnown(data) ? nullableCost(data) : <Tooltip title={unknownCost}><span>—</span></Tooltip>
      ) : null,
    },
    { field: 'totalSaleValue', headerName: 'Valor venta', valueFormatter: ({ value }) => formatCurrency(Number(value)) },
    { field: 'registeredByUsername', headerName: 'Usuario' },
    {
      field: 'historicalImport',
      headerName: 'Origen',
      maxWidth: 120,
      cellRenderer: ({ value }: { value?: boolean }) => value ? <Chip color="info" label="Importado" size="small" /> : <Chip label="Sistema" size="small" />,
    },
    {
      colId: 'actions',
      headerName: 'Acciones',
      cellRenderer: ({ data }: { data?: SupplierEntry }) => data ? (
        <Button onClick={() => navigate(ROUTE_PATHS.supplierEntryDetails.replace(':entryId', String(data.id)))} startIcon={<VisibilityRoundedIcon />} size="small">
          Ver detalle
        </Button>
      ) : null,
    },
  ], [navigate])

  return (
    <Stack spacing={3}>
      <PageHeader
        actionLabel="Registrar mercancia"
        onAction={() => navigate(ROUTE_PATHS.supplierEntriesCreate)}
        subtitle="Consulta la mercancia recibida por proveedor."
        title="Historial de entradas"
      />
      <DataGridShell loading={entriesState.loading}>
        <Stack spacing={2}>
          {entriesState.error ? <Alert severity="error">{entriesState.error.message}</Alert> : null}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Proveedor</InputLabel>
              <Select
                label="Proveedor"
                onChange={(event) => entriesState.setFilters({ ...entriesState.filters, page: 0, supplierId: Number(event.target.value) || null })}
                value={entriesState.filters.supplierId ?? 0}
              >
                <MenuItem value={0}>Todos</MenuItem>
                {suppliersState.suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Fecha inicial"
              onChange={(event) => entriesState.setFilters({ ...entriesState.filters, from: event.target.value || undefined, page: 0 })}
              size="small"
              slotProps={{ htmlInput: { max: entriesState.filters.to || undefined }, inputLabel: { shrink: true } }}
              type="date"
              value={entriesState.filters.from ?? ''}
            />
            <TextField
              label="Fecha final"
              onChange={(event) => entriesState.setFilters({ ...entriesState.filters, to: event.target.value || undefined, page: 0 })}
              size="small"
              slotProps={{ htmlInput: { min: entriesState.filters.from || undefined }, inputLabel: { shrink: true } }}
              type="date"
              value={entriesState.filters.to ?? ''}
            />
            <Button onClick={() => entriesState.setFilters({ page: 0, size: entriesState.size })}>Limpiar</Button>
          </Stack>
          {!entriesState.loading && entriesState.entries.length === 0 ? (
            <EmptyState message="No hay entradas de mercancia registradas." title="Sin entradas" />
          ) : (
            <div className="ag-theme-balham pos-data-grid" style={{ height: 430 }}>
              <AgGridReact<SupplierEntry>
                columnDefs={columnDefs}
                defaultColDef={{ resizable: true, sortable: true }}
                getRowId={({ data }) => String(data.id)}
                loading={entriesState.loading}
                rowData={entriesState.entries}
                theme="legacy"
              />
            </div>
          )}
          <TablePagination
            component="div"
            count={entriesState.totalElements}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            labelRowsPerPage="Filas por pagina"
            onPageChange={(_event, page) => entriesState.setPage(page)}
            onRowsPerPageChange={(event) => entriesState.setSize(Number(event.target.value))}
            page={entriesState.page}
            rowsPerPage={entriesState.size}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Stack>
      </DataGridShell>
    </Stack>
  )
}
