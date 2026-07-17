import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TablePagination,
  TextField,
  type AlertColor,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../../../../../shared/ui/components/ConfirmDialog'
import { DataGridShell } from '../../../../../shared/ui/components/DataGridShell'
import { EmptyState } from '../../../../../shared/ui/components/EmptyState'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
import { ROUTE_PATHS } from '../../../../../shared/routes/routePaths'
import type { Supplier, SupplierMutation } from '../../domain/entities/Supplier'
import { SupplierDialog } from '../components/SupplierDialog'
import { SuppliersGrid } from '../components/SuppliersGrid'
import { useSupplierForm } from '../hooks/useSupplierForm'
import { useSuppliers } from '../hooks/useSuppliers'

type ModalState =
  | { open: false; mode: 'create'; supplier: null }
  | { open: true; mode: 'create'; supplier: null }
  | { open: true; mode: 'edit'; supplier: Supplier }

export const SuppliersPage = () => {
  const navigate = useNavigate()
  const [modal, setModal] = useState<ModalState>({ mode: 'create', open: false, supplier: null })
  const [supplierToDeactivate, setSupplierToDeactivate] = useState<Supplier | null>(null)
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)
  const { error, filters, loading, page, refetch, setFilters, setPage, setSize, size, suppliers, totalElements } = useSuppliers()
  const supplierForm = useSupplierForm()

  const mutationError = useMemo(() => supplierForm.error, [supplierForm.error])

  const handleSubmit = async (values: SupplierMutation) => {
    const result = modal.mode === 'create'
      ? await supplierForm.createSupplier(values)
      : await supplierForm.updateSupplier(modal.supplier.id, values)

    if (!result) {
      return
    }

    setModal({ mode: 'create', open: false, supplier: null })
    setMessage({ severity: 'success', text: modal.mode === 'create' ? 'Proveedor creado' : 'Proveedor actualizado' })
    await refetch()
  }

  const handleDeactivate = async () => {
    if (!supplierToDeactivate) {
      return
    }
    const success = await supplierForm.deactivateSupplier(supplierToDeactivate.id)
    if (success) {
      setSupplierToDeactivate(null)
      setMessage({ severity: 'success', text: 'Proveedor desactivado' })
      await refetch()
    }
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        actionIcon={<AddRoundedIcon />}
        actionLabel="Nuevo proveedor"
        onAction={() => setModal({ mode: 'create', open: true, supplier: null })}
        subtitle="Administra proveedores y conserva su informacion historica."
        title="Proveedores"
      />

      <DataGridShell
        loading={loading}
        toolbar={
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', lg: 'center' }, width: '100%' }}>
            <Button
              onClick={() => setModal({ mode: 'create', open: true, supplier: null })}
              startIcon={<AddRoundedIcon />}
              variant="contained"
            >
              Nuevo proveedor
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <TextField
              label="Buscar"
              onChange={(event) => setFilters({ ...filters, page: 0, search: event.target.value })}
              size="small"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon color="action" fontSize="small" /></InputAdornment> } }}
              sx={{ minWidth: { xs: '100%', lg: 280 } }}
              value={filters.search ?? ''}
            />
            <FormControl size="small" sx={{ minWidth: { xs: '100%', lg: 180 } }}>
              <InputLabel>Estado</InputLabel>
              <Select
                label="Estado"
                onChange={(event) => {
                  const value = String(event.target.value)
                  setFilters({ ...filters, active: value === 'all' ? null : value === 'active', page: 0 })
                }}
                value={filters.active === null || filters.active === undefined ? 'all' : filters.active ? 'active' : 'inactive'}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Activos</MenuItem>
                <MenuItem value="inactive">Inactivos</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        }
      >
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}
          {mutationError ? <Alert severity="error">{mutationError.message}</Alert> : null}
          {!loading && suppliers.length === 0 ? (
            <EmptyState
              actionIcon={<AddRoundedIcon />}
              actionLabel="Nuevo proveedor"
              message="No hay proveedores registrados."
              onAction={() => setModal({ mode: 'create', open: true, supplier: null })}
              title="Sin proveedores"
            />
          ) : (
            <SuppliersGrid
              loading={loading}
              onDeactivate={setSupplierToDeactivate}
              onEdit={(supplier) => setModal({ mode: 'edit', open: true, supplier })}
              onInventoryBaseline={(supplier) => navigate(ROUTE_PATHS.supplierInventoryBaseline.replace(':supplierId', String(supplier.id)))}
              onProducts={(supplier) => navigate(`${ROUTE_PATHS.products}?supplierId=${supplier.id}`)}
              suppliers={suppliers}
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

      <SupplierDialog
        initialData={modal.supplier}
        loading={supplierForm.loading}
        mode={modal.mode}
        onClose={() => setModal({ mode: 'create', open: false, supplier: null })}
        onSubmit={handleSubmit}
        open={modal.open}
      />

      <ConfirmDialog
        confirmText="Desactivar"
        loading={supplierForm.loading}
        message={`El proveedor "${supplierToDeactivate?.name ?? ''}" conservara su historial, pero no podra usarse en nuevas entradas o cortes.`}
        onCancel={() => setSupplierToDeactivate(null)}
        onConfirm={handleDeactivate}
        open={Boolean(supplierToDeactivate)}
        title="Desactivar proveedor"
      />

      <Snackbar autoHideDuration={3000} onClose={() => setMessage(null)} open={Boolean(message)}>
        <Alert onClose={() => setMessage(null)} severity={message?.severity ?? 'success'} variant="filled">
          {message?.text}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
