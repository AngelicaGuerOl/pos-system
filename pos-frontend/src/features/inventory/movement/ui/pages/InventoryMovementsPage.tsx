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
import { EmptyState } from '../../../../../shared/ui/components/EmptyState'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
import type { ManualInventoryMovementData } from '../../domain/entities/InventoryMovement'
import { InventoryMovementFilters } from '../components/InventoryMovementFilters'
import { InventoryMovementsGrid } from '../components/InventoryMovementsGrid'
import {
  ManualInventoryMovementModal,
  type ManualInventoryMovementMode,
} from '../components/ManualInventoryMovementModal'
import { useCreateInventoryEntry } from '../hooks/useCreateInventoryEntry'
import { useCreateInventoryExit } from '../hooks/useCreateInventoryExit'
import { useInventoryMovements } from '../hooks/useInventoryMovements'

export const InventoryMovementsPage = () => {
  const [modalMode, setModalMode] = useState<ManualInventoryMovementMode | null>(null)
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)
  const {
    clearFilters,
    error,
    filters,
    loading,
    movements,
    page,
    refetch,
    setFilters,
    setPage,
    setSize,
    size,
    totalElements,
  } = useInventoryMovements()
  const createEntry = useCreateInventoryEntry()
  const createExit = useCreateInventoryExit()

  const mutationError = useMemo(
    () => createEntry.error ?? createExit.error,
    [createEntry.error, createExit.error],
  )
  const mutationLoading = createEntry.loading || createExit.loading

  const handleSubmit = async (values: ManualInventoryMovementData) => {
    if (!modalMode || mutationLoading) {
      return
    }

    const result =
      modalMode === 'entry'
        ? await createEntry.createEntry(values)
        : await createExit.createExit(values)

    if (!result) {
      return
    }

    setModalMode(null)
    setMessage({
      severity: 'success',
      text:
        modalMode === 'entry'
          ? 'Entrada de inventario registrada'
          : 'Salida de inventario registrada',
    })
    await refetch()
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle="Audita entradas, salidas y cambios de existencias por producto."
        title="Movimientos de inventario"
      />

      <DataGridShell
        loading={loading}
        toolbar={
          <Stack spacing={2} sx={{ width: '100%' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
            >
              <Button
                onClick={() => setModalMode('entry')}
                startIcon={<AddRoundedIcon />}
                variant="contained"
              >
                Registrar entrada
              </Button>
              <Button
                color="error"
                onClick={() => setModalMode('exit')}
                startIcon={<RemoveRoundedIcon />}
                variant="outlined"
              >
                Registrar salida
              </Button>
              <Button
                disabled={loading}
                onClick={() => void refetch()}
                startIcon={loading ? <CircularProgress size={18} /> : <SyncRoundedIcon />}
              >
                Actualizar
              </Button>
            </Stack>

            <InventoryMovementFilters
              filters={filters}
              onChange={setFilters}
              onClear={clearFilters}
            />
          </Stack>
        }
      >
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}
          {mutationError ? <Alert severity="error">{mutationError.message}</Alert> : null}

          {!loading && movements.length === 0 ? (
            <EmptyState
              actionIcon={<AddRoundedIcon />}
              actionLabel="Registrar entrada"
              message="No hay movimientos para mostrar con los filtros actuales."
              onAction={() => setModalMode('entry')}
              title="Sin movimientos"
            />
          ) : (
            <InventoryMovementsGrid loading={loading} movements={movements} />
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

      <ManualInventoryMovementModal
        errorMessage={mutationError?.message}
        loading={mutationLoading}
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
