import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
import {
  Alert,
  Button,
  CircularProgress,
  Snackbar,
  Stack,
  TablePagination,
  type AlertColor,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DataGridShell } from '../../../../../shared/ui/components/DataGridShell'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
import { ROUTE_PATHS } from '../../../../../shared/routes/routePaths'
import { formatCurrency } from '../../../../../shared/utils/formatters'
import { CashClosingSummary } from '../../../session/ui/components/CashClosingSummary'
import { CloseCashSessionDialog } from '../../../session/ui/components/CloseCashSessionDialog'
import { CurrentCashSessionPanel } from '../../../session/ui/components/CurrentCashSessionPanel'
import { useCashSession } from '../../../session/ui/hooks/useCashSession'
import { useCloseCashSession } from '../../../session/ui/hooks/useCloseCashSession'
import type { ManualCashMovementData } from '../../domain/entities/CashMovement'
import { CashMovementsGrid } from '../components/CashMovementsGrid'
import { CashSummaryCards } from '../components/CashSummaryCards'
import { ManualCashMovementModal } from '../components/ManualCashMovementModal'
import { useCashMovements } from '../hooks/useCashMovements'
import {
  useRegisterCashMovement,
  type ManualCashMovementMode,
} from '../hooks/useRegisterCashMovement'

export const CashMovementsPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [modalMode, setModalMode] = useState<ManualCashMovementMode | null>(null)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [lastClosingSummaryVisible, setLastClosingSummaryVisible] = useState(true)
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)
  const { clearCurrentSession, currentSession, refreshCurrentSession } = useCashSession()
  const {
    error,
    loading,
    movements,
    page,
    refetch,
    setPage,
    setSize,
    size,
    summary,
    totalElements,
  } = useCashMovements()
  const registerMovement = useRegisterCashMovement()
  const closeCashSession = useCloseCashSession()

  const modalTitle = modalMode === 'entry' ? 'Entrada registrada' : 'Salida registrada'
  const mutationError = useMemo(() => registerMovement.error, [registerMovement.error])

  const handleSubmit = async (values: ManualCashMovementData) => {
    if (!modalMode) {
      return
    }

    const result = await registerMovement.registerCashMovement(modalMode, values)

    if (!result) {
      setMessage({
        severity: 'error',
        text: mutationError?.message ?? 'Error al guardar el movimiento. Por favor intente nuevamente.',
      })
      return
    }

    setModalMode(null)
    setMessage({ severity: 'success', text: modalTitle })
    await refetch()
  }

  const isClosedConflict = (status?: number, text?: string): boolean => {
    const normalizedText = text?.toLowerCase() ?? ''
    return Boolean(status === 409 && (normalizedText.includes('cerrada') || normalizedText.includes('closed')))
  }

  const handleStartClose = async () => {
    const preview = await closeCashSession.loadPreview()
    if (!preview) {
      const error = closeCashSession.getLastError()
      if (error?.status === 409) {
        clearCurrentSession()
        await refreshCurrentSession()
        setMessage({
          severity: 'warning',
          text: isClosedConflict(error.status, error.message)
            ? 'La caja ya fue cerrada.'
            : 'No existe una caja abierta para cerrar.',
        })
        navigate(ROUTE_PATHS.cashSessionOpen, {
          replace: true,
          state: { from: location },
        })
        return
      }

      setMessage({
        severity: 'error',
        text: error?.message ?? 'No se pudo consultar el corte de caja.',
      })
      return
    }

    setCloseDialogOpen(true)
  }

  const handleCancelCloseDialog = () => {
    setCloseDialogOpen(false)
    closeCashSession.reset()
  }

  const handleCloseCashSession = async (values: { countedAmount: number; notes: string | null }) => {
    const summary = await closeCashSession.closeCurrent(values)

    if (!summary) {
      const error = closeCashSession.getLastError()
      if (error?.status === 409) {
        clearCurrentSession()
        await refreshCurrentSession()
        setCloseDialogOpen(false)
        setMessage({
          severity: 'warning',
          text: isClosedConflict(error.status, error.message)
            ? 'La caja ya fue cerrada.'
            : 'No existe una caja abierta para cerrar.',
        })
        navigate(ROUTE_PATHS.cashSessionOpen, {
          replace: true,
          state: { from: location },
        })
        return
      }
      return
    }

    clearCurrentSession()
    await refreshCurrentSession()
    setCloseDialogOpen(false)
    setLastClosingSummaryVisible(true)
    const difference = summary.differenceAmount ?? 0
    setMessage({
      severity: difference === 0 ? 'success' : 'warning',
      text: difference === 0
        ? 'Caja cerrada correctamente.'
        : difference > 0
          ? `Caja cerrada con un sobrante de ${formatCurrency(difference)}.`
          : `Caja cerrada con un faltante de ${formatCurrency(Math.abs(difference))}.`,
    })
    navigate(ROUTE_PATHS.cashSessionOpen, {
      replace: true,
      state: { closingSummary: summary },
    })
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle="Registra entradas y salidas manuales de efectivo para tu caja abierta."
        title="Movimientos de caja"
      />

      <CurrentCashSessionPanel
        loading={closeCashSession.loadingPreview || closeCashSession.closing}
        onCloseCashSession={() => void handleStartClose()}
        session={currentSession}
      />

      <CashSummaryCards summary={summary} />

      {closeCashSession.closingSummary && lastClosingSummaryVisible ? (
        <Stack spacing={1}>
          <Alert
            onClose={() => setLastClosingSummaryVisible(false)}
            severity="success"
            variant="outlined"
          >
            Corte definitivo generado.
          </Alert>
          <CashClosingSummary summary={closeCashSession.closingSummary} />
        </Stack>
      ) : null}

      <DataGridShell
        loading={loading}
        toolbar={
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            sx={{ alignItems: { xs: 'stretch', md: 'center' }, width: '100%' }}
          >
            <Button
              onClick={() => setModalMode('entry')}
              startIcon={<AddRoundedIcon />}
              variant="contained"
            >
              Entrada
            </Button>
            <Button
              color="error"
              onClick={() => setModalMode('exit')}
              startIcon={<RemoveRoundedIcon />}
              variant="outlined"
            >
              Salida
            </Button>
            <Button
              disabled={loading}
              onClick={() => void refetch()}
              startIcon={loading ? <CircularProgress size={18} /> : <SyncRoundedIcon />}
            >
              Actualizar
            </Button>
          </Stack>
        }
      >
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}
          {mutationError ? <Alert severity="error">{mutationError.message}</Alert> : null}

          <CashMovementsGrid loading={loading} movements={movements} />

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

      <ManualCashMovementModal
        errorMessage={mutationError?.message}
        loading={registerMovement.loading}
        mode={modalMode ?? 'entry'}
        onClose={() => setModalMode(null)}
        onSubmit={handleSubmit}
        open={Boolean(modalMode)}
        serverErrors={mutationError?.validationErrors}
      />

      <CloseCashSessionDialog
        closing={closeCashSession.closing}
        error={closeCashSession.error}
        onClose={handleCancelCloseDialog}
        onSubmit={handleCloseCashSession}
        open={closeDialogOpen}
        preview={closeCashSession.preview}
      />

      <Snackbar autoHideDuration={3000} onClose={() => setMessage(null)} open={Boolean(message)}>
        <Alert
          onClose={() => setMessage(null)}
          severity={message?.severity ?? 'success'}
          variant="filled"
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
