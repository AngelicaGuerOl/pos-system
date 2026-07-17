import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
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
import type { SupplierSettlement } from '../../domain/entities/SupplierSettlement'
import { useExportSupplierSettlement } from '../hooks/useExportSupplierSettlement'
import { useSupplierSettlements } from '../hooks/useSupplierSettlements'

ModuleRegistry.registerModules([AllCommunityModule])

const statusLabel = (status: SupplierSettlement['status']) => status === 'DRAFT' ? 'Borrador' : 'Finalizado'
const unknownValue = 'No se encontraba registrado en el archivo original.'
const nullableCurrencyCell = (value: number | null | undefined) => value === null || value === undefined
  ? <Tooltip title={unknownValue}><span>—</span></Tooltip>
  : formatCurrency(Number(value))

export const SupplierSettlementsPage = () => {
  const navigate = useNavigate()
  const settlementsState = useSupplierSettlements()
  const suppliersState = useSuppliers({ active: true, size: 50 })
  const exportSettlement = useExportSupplierSettlement()
  const fromDate = settlementsState.filters.from ?? ''
  const toDate = settlementsState.filters.to ?? ''

  const columnDefs = useMemo<ColDef<SupplierSettlement>[]>(() => [
    {
      field: 'supplierName',
      flex: 1,
      headerName: 'Proveedor',
      minWidth: 170,
    },
    { headerName: 'Periodo', minWidth: 190, valueGetter: ({ data }) => data ? `${formatDate(data.periodStart)} a ${formatDate(data.periodEnd)}` : '' },
    { field: 'expectedAmount', headerName: 'Importe por justificar', valueFormatter: ({ value }) => formatCurrency(Number(value)) },
    { field: 'deliveredAmount', headerName: 'Entregado', cellRenderer: ({ value }: { value?: number | null }) => nullableCurrencyCell(value) },
    { field: 'differenceAmount', headerName: 'Diferencia', cellRenderer: ({ value }: { value?: number | null }) => nullableCurrencyCell(value) },
    {
      field: 'historicalImport',
      headerName: 'Origen',
      maxWidth: 120,
      cellRenderer: ({ value }: { value?: boolean }) => value ? <Chip color="info" label="Importado" size="small" /> : <Chip label="Sistema" size="small" />,
    },
    {
      field: 'status',
      headerName: 'Estado',
      cellRenderer: ({ value }: { value?: SupplierSettlement['status'] }) => value ? <Chip color={value === 'FINALIZED' ? 'success' : 'warning'} label={statusLabel(value)} size="small" /> : null,
    },
    {
      colId: 'actions',
      headerName: 'Acciones',
      minWidth: 220,
      cellRenderer: ({ data }: { data?: SupplierSettlement }) => data ? (
        <Stack direction="row" spacing={1}>
          {data.status === 'DRAFT' && !data.historicalImport ? (
            <Button onClick={() => navigate(ROUTE_PATHS.supplierSettlementEdit.replace(':settlementId', String(data.id)))} startIcon={<EditRoundedIcon />} size="small">Continuar</Button>
          ) : null}
          <Button onClick={() => navigate(ROUTE_PATHS.supplierSettlementDetails.replace(':settlementId', String(data.id)))} startIcon={<VisibilityRoundedIcon />} size="small">Ver</Button>
          {data.status === 'FINALIZED' ? (
            <Button disabled={exportSettlement.loadingId === data.id} onClick={() => void exportSettlement.exportSettlement(data.id)} startIcon={<DownloadRoundedIcon />} size="small">
              {exportSettlement.loadingId === data.id ? 'Exportando...' : 'Excel'}
            </Button>
          ) : null}
        </Stack>
      ) : null,
    },
  ], [exportSettlement, navigate])

  return (
    <Stack spacing={3}>
      <PageHeader
        actionLabel="Nuevo corte"
        onAction={() => navigate(ROUTE_PATHS.supplierSettlementCreate)}
        subtitle="Consulta borradores y cortes finalizados por proveedor."
        title="Historial de cortes"
      />
      <DataGridShell loading={settlementsState.loading}>
        <Stack spacing={2}>
          {settlementsState.error ? <Alert severity="error">{settlementsState.error.message}</Alert> : null}
          {exportSettlement.error ? <Alert severity="error">{exportSettlement.error.message}</Alert> : null}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Proveedor</InputLabel>
              <Select label="Proveedor" onChange={(event) => settlementsState.setFilters({ ...settlementsState.filters, page: 0, supplierId: Number(event.target.value) || null })} value={settlementsState.filters.supplierId ?? 0}>
                <MenuItem value={0}>Todos</MenuItem>
                {suppliersState.suppliers.map((supplier) => <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Estado</InputLabel>
              <Select label="Estado" onChange={(event) => settlementsState.setFilters({ ...settlementsState.filters, page: 0, status: String(event.target.value) === 'ALL' ? null : String(event.target.value) as SupplierSettlement['status'] })} value={settlementsState.filters.status ?? 'ALL'}>
                <MenuItem value="ALL">Todos</MenuItem>
                <MenuItem value="DRAFT">Borrador</MenuItem>
                <MenuItem value="FINALIZED">Finalizado</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Fecha inicial"
              onChange={(event) => settlementsState.setFilters({ ...settlementsState.filters, from: event.target.value || undefined, page: 0 })}
              size="small"
              slotProps={{
                htmlInput: { max: toDate || undefined },
                inputLabel: { shrink: true },
              }}
              type="date"
              value={fromDate}
            />
            <TextField
              label="Fecha final"
              onChange={(event) => settlementsState.setFilters({ ...settlementsState.filters, to: event.target.value || undefined, page: 0 })}
              size="small"
              slotProps={{
                htmlInput: { min: fromDate || undefined },
                inputLabel: { shrink: true },
              }}
              type="date"
              value={toDate}
            />
            <Button onClick={() => settlementsState.setFilters({ page: 0, size: settlementsState.size })}>Limpiar</Button>
          </Stack>
          {!settlementsState.loading && settlementsState.settlements.length === 0 ? (
            <EmptyState message="No hay cortes para los filtros seleccionados." title="Sin cortes" />
          ) : (
            <div className="ag-theme-balham pos-data-grid" style={{ height: 430 }}>
              <AgGridReact<SupplierSettlement>
                columnDefs={columnDefs}
                defaultColDef={{ resizable: true, sortable: true }}
                getRowId={({ data }) => String(data.id)}
                loading={settlementsState.loading}
                rowData={settlementsState.settlements}
                theme="legacy"
              />
            </div>
          )}
          <TablePagination
            component="div"
            count={settlementsState.totalElements}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            labelRowsPerPage="Filas por pagina"
            onPageChange={(_event, page) => settlementsState.setPage(page)}
            onRowsPerPageChange={(event) => settlementsState.setSize(Number(event.target.value))}
            page={settlementsState.page}
            rowsPerPage={settlementsState.size}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Stack>
      </DataGridShell>
    </Stack>
  )
}
