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
import { DataGridShell } from '../../../../../shared/ui/components/DataGridShell'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
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
  const [modalMode, setModalMode] = useState<ManualCashMovementMode | null>(null)
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)
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

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle="Registra entradas y salidas manuales de efectivo para tu caja abierta."
        title="Movimientos de caja"
      />

      <CashSummaryCards summary={summary} />

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
