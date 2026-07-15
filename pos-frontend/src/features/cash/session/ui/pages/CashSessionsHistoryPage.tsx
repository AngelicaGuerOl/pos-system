import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
import { Alert, Button, CircularProgress, Snackbar, Stack, TablePagination } from '@mui/material'
import { useState } from 'react'
import { DataGridShell } from '../../../../../shared/ui/components/DataGridShell'
import { EmptyState } from '../../../../../shared/ui/components/EmptyState'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
import { CashClosingSummaryDialog } from '../components/CashClosingSummaryDialog'
import { CashSessionsHistoryGrid } from '../components/CashSessionsHistoryGrid'
import { useCashClosingSummary } from '../hooks/useCashClosingSummary'
import { useCashSessionsHistory } from '../hooks/useCashSessionsHistory'

export const CashSessionsHistoryPage = () => {
  const {
    error,
    loading,
    page,
    refetch,
    sessions,
    setPage,
    setSize,
    size,
    totalElements,
  } = useCashSessionsHistory()
  const closingSummary = useCashClosingSummary()
  const [message, setMessage] = useState<string | null>(null)

  const handleViewClosingSummary = async (sessionId: number) => {
    const summary = await closingSummary.openSummary(sessionId)
    if (!summary) {
      const lastError = closingSummary.getLastError()
      setMessage(lastError?.message ?? 'No se pudo consultar el corte de caja.')
    }
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle="Consulta sesiones cerradas y revisa el corte definitivo."
        title="Historial de sesiones de caja"
      />

      <DataGridShell
        loading={loading}
        toolbar={
          <Button
            disabled={loading}
            onClick={() => void refetch()}
            startIcon={loading ? <CircularProgress size={18} /> : <SyncRoundedIcon />}
          >
            Actualizar
          </Button>
        }
      >
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}

          {!loading && sessions.length === 0 ? (
            <EmptyState
              actionIcon={<SyncRoundedIcon />}
              actionLabel="Actualizar"
              message="No hay sesiones de caja para mostrar."
              onAction={() => void refetch()}
              title="Sin sesiones"
            />
          ) : (
            <CashSessionsHistoryGrid
              loading={loading}
              onViewClosingSummary={(sessionId) => void handleViewClosingSummary(sessionId)}
              sessions={sessions}
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

      <CashClosingSummaryDialog
        error={closingSummary.error}
        loading={closingSummary.loading}
        onClose={closingSummary.closeSummary}
        open={closingSummary.open}
        summary={closingSummary.summary}
      />

      <Snackbar autoHideDuration={3000} onClose={() => setMessage(null)} open={Boolean(message)}>
        <Alert onClose={() => setMessage(null)} severity="error" variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
