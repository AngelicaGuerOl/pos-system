import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
import { Alert, Button, CircularProgress, Stack, TablePagination } from '@mui/material'
import { DataGridShell } from '../../../../shared/ui/components/DataGridShell'
import { EmptyState } from '../../../../shared/ui/components/EmptyState'
import { PageHeader } from '../../../../shared/ui/components/PageHeader'
import { SaleDetailDrawer } from '../components/SaleDetailDrawer'
import { SalesHistoryFilters } from '../components/SalesHistoryFilters'
import { SalesHistoryGrid } from '../components/SalesHistoryGrid'
import { useSaleDetails } from '../hooks/useSaleDetails'
import { useSalesHistory } from '../hooks/useSalesHistory'

export const SalesHistoryPage = () => {
  const {
    clearFilters,
    error,
    filters,
    isAdmin,
    loading,
    page,
    refetch,
    sales,
    setFilters,
    setPage,
    setSize,
    size,
    totalElements,
  } = useSalesHistory()
  const saleDetails = useSaleDetails()

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle={
          isAdmin
            ? 'Consulta y filtra las ventas registradas en el sistema.'
            : 'Ventas registradas durante tu sesión de caja actual.'
        }
        title="Historial de ventas"
      />

      <DataGridShell
        loading={loading}
        toolbar={
          <Stack spacing={2} sx={{ width: '100%' }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
            >
              <Button
                disabled={loading}
                onClick={() => void refetch()}
                startIcon={loading ? <CircularProgress size={18} /> : <SyncRoundedIcon />}
              >
                Actualizar
              </Button>
            </Stack>

            {isAdmin ? (
              <SalesHistoryFilters
                filters={filters}
                onChange={setFilters}
                onClear={clearFilters}
              />
            ) : null}
          </Stack>
        }
      >
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}
          {saleDetails.error ? <Alert severity="error">{saleDetails.error.message}</Alert> : null}

          {!loading && sales.length === 0 ? (
            <EmptyState
              actionIcon={<SyncRoundedIcon />}
              actionLabel="Actualizar"
              message={
                isAdmin
                  ? 'No hay ventas para mostrar con los filtros actuales.'
                  : 'No hay ventas registradas en tu sesión actual.'
              }
              onAction={() => void refetch()}
              title="Sin ventas"
            />
          ) : (
            <SalesHistoryGrid
              loading={loading}
              onViewDetails={(saleId) => void saleDetails.openDetails(saleId)}
              sales={sales}
            />
          )}

          <TablePagination
            component="div"
            count={totalElements}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            labelRowsPerPage="Filas por pagina"
            onPageChange={(_event, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={(event) => setSize(Number(event.target.value))}
            page={page}
            rowsPerPage={size}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Stack>
      </DataGridShell>

      <SaleDetailDrawer
        errorMessage={saleDetails.error?.message}
        loading={saleDetails.loading}
        onClose={saleDetails.closeDetails}
        open={saleDetails.open}
        sale={saleDetails.sale}
      />
    </Stack>
  )
}
