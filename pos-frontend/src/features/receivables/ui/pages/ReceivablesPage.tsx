import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
import { Alert, Button, CircularProgress, Stack, TablePagination } from '@mui/material'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DataGridShell } from '../../../../shared/ui/components/DataGridShell'
import { EmptyState } from '../../../../shared/ui/components/EmptyState'
import { PageHeader } from '../../../../shared/ui/components/PageHeader'
import { ReceivableDetailDrawer } from '../components/ReceivableDetailDrawer'
import { ReceivablesFilters } from '../components/ReceivablesFilters'
import { ReceivablesGrid } from '../components/ReceivablesGrid'
import { useReceivableDetails } from '../hooks/useReceivableDetails'
import { useReceivables } from '../hooks/useReceivables'

export const ReceivablesPage = () => {
  const {
    clearFilters,
    error,
    filters,
    loading,
    page,
    receivables,
    refetch,
    setFilters,
    setPage,
    setSize,
    size,
    totalElements,
  } = useReceivables()
  const receivableDetails = useReceivableDetails()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const id = Number(searchParams.get('id'))
    if (Number.isFinite(id) && id > 0) {
      void receivableDetails.openDetails(id)
      setSearchParams({}, { replace: true })
    }
  }, [receivableDetails, searchParams, setSearchParams])

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle="Consulta las deudas generadas por ventas fiadas."
        title="Cuentas por cobrar"
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
            <ReceivablesFilters
              filters={filters}
              onChange={setFilters}
              onClear={clearFilters}
            />
          </Stack>
        }
      >
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}
          {receivableDetails.error ? (
            <Alert severity="error">{receivableDetails.error.message}</Alert>
          ) : null}

          {!loading && receivables.length === 0 ? (
            <EmptyState
              actionIcon={<SyncRoundedIcon />}
              actionLabel="Actualizar"
              message="No hay cuentas por cobrar para mostrar con los filtros actuales."
              onAction={() => void refetch()}
              title="Sin cuentas"
            />
          ) : (
            <ReceivablesGrid
              loading={loading}
              onViewDetails={(receivableId) => void receivableDetails.openDetails(receivableId)}
              receivables={receivables}
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

      <ReceivableDetailDrawer
        errorMessage={receivableDetails.error?.message}
        loading={receivableDetails.loading}
        onClose={receivableDetails.closeDetails}
        onPaymentRegistered={async () => {
          await receivableDetails.refreshDetails()
          await refetch()
        }}
        open={receivableDetails.open}
        receivable={receivableDetails.receivable}
      />
    </Stack>
  )
}
