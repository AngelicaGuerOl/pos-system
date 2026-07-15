import AddRoundedIcon from '@mui/icons-material/AddRounded'
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Snackbar,
  Stack,
  TablePagination,
  TextField,
  type AlertColor,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth'
import { ConfirmDialog } from '../../../../shared/ui/components/ConfirmDialog'
import { DataGridShell } from '../../../../shared/ui/components/DataGridShell'
import { EmptyState } from '../../../../shared/ui/components/EmptyState'
import { PageHeader } from '../../../../shared/ui/components/PageHeader'
import { ROUTE_PATHS } from '../../../../shared/routes/routePaths'
import type { Customer, CustomerMutation } from '../../domain/entities/Customer'
import { CustomerModal } from '../components/CustomerModal'
import { CustomersGrid } from '../components/CustomersGrid'
import { useCreateCustomer } from '../hooks/useCreateCustomer'
import { useCustomers } from '../hooks/useCustomers'
import { useDeactivateCustomer } from '../hooks/useDeactivateCustomer'
import { useUpdateCustomer } from '../hooks/useUpdateCustomer'

type ModalState =
  | { open: false; mode: 'create'; customer: null }
  | { open: true; mode: 'create'; customer: null }
  | { open: true; mode: 'edit'; customer: Customer }

export const CustomersPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canCreateOrEdit = user?.role === 'ADMIN' || user?.role === 'CASHIER'
  const canDeactivate = user?.role === 'ADMIN'
  const [modal, setModal] = useState<ModalState>({ customer: null, mode: 'create', open: false })
  const [customerToDeactivate, setCustomerToDeactivate] = useState<Customer | null>(null)
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)
  const {
    customers,
    error,
    filters,
    loading,
    page,
    refetch,
    setPage,
    setSearch,
    setSize,
    size,
    totalElements,
  } = useCustomers()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deactivateCustomer = useDeactivateCustomer()

  const mutationError = useMemo(
    () => createCustomer.error ?? updateCustomer.error ?? deactivateCustomer.error,
    [createCustomer.error, deactivateCustomer.error, updateCustomer.error],
  )

  const mutationLoading =
    createCustomer.loading || updateCustomer.loading || deactivateCustomer.loading

  const handleSubmit = async (values: CustomerMutation) => {
    const result =
      modal.mode === 'create'
        ? await createCustomer.createCustomer(values)
        : await updateCustomer.updateCustomer(modal.customer.id, values)

    if (!result) {
      setMessage({
        severity: 'error',
        text: mutationError?.message ?? 'Error al guardar el cliente. Por favor intente nuevamente.',
      })
      return
    }

    setModal({ customer: null, mode: 'create', open: false })
    setMessage({
      severity: 'success',
      text: modal.mode === 'create' ? 'Cliente creado' : 'Cliente actualizado',
    })
    await refetch()
  }

  const handleDeactivate = async () => {
    if (!customerToDeactivate) {
      return
    }

    const success = await deactivateCustomer.deactivateCustomer(customerToDeactivate.id)

    if (success) {
      setMessage({ severity: 'success', text: 'Cliente desactivado' })
      setCustomerToDeactivate(null)
      await refetch()
    }
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle="Administra clientes activos para ventas y seguimiento."
        title="Clientes"
      />

      <DataGridShell
        loading={loading}
        toolbar={
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', lg: 'center' }, width: '100%' }}
          >
            {canCreateOrEdit ? (
              <Button
                onClick={() => setModal({ customer: null, mode: 'create', open: true })}
                startIcon={<AddRoundedIcon />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
                variant="contained"
              >
                Nuevo cliente
              </Button>
            ) : null}

            {loading ? <CircularProgress size={24} /> : null}

            <Box sx={{ flexGrow: 1 }} />

            <TextField
              label="Buscar cliente"
              onChange={(event) => setSearch(event.target.value)}
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: { xs: '100%', lg: 320 } }}
              value={filters.search ?? ''}
            />
          </Stack>
        }
      >
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}
          {mutationError ? <Alert severity="error">{mutationError.message}</Alert> : null}

          {!loading && customers.length === 0 ? (
            <EmptyState
              actionIcon={<PersonAddAltRoundedIcon />}
              actionLabel={canCreateOrEdit ? 'Nuevo cliente' : undefined}
              message="No hay clientes activos para mostrar con los filtros actuales."
              onAction={
                canCreateOrEdit
                  ? () => setModal({ customer: null, mode: 'create', open: true })
                  : undefined
              }
              title="Sin clientes"
            />
          ) : (
            <>
              <CustomersGrid
                canCreateOrEdit={canCreateOrEdit}
                canDeactivate={canDeactivate}
                customers={customers}
                loading={loading}
                onDeactivate={setCustomerToDeactivate}
                onEdit={(customer) => setModal({ customer, mode: 'edit', open: true })}
                onViewReceivables={(customer) =>
                  navigate(ROUTE_PATHS.customerAccountReceivable.replace(':customerId', String(customer.id)))}
              />

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
            </>
          )}
        </Stack>
      </DataGridShell>

      <CustomerModal
        initialData={modal.customer}
        loading={mutationLoading}
        mode={modal.mode}
        onClose={() => setModal({ customer: null, mode: 'create', open: false })}
        onSubmit={handleSubmit}
        open={modal.open}
        serverErrors={mutationError?.validationErrors}
      />

      <ConfirmDialog
        confirmText="Desactivar"
        loading={deactivateCustomer.loading}
        message={`El cliente "${
          customerToDeactivate?.fullName ?? ''
        }" dejara de aparecer entre los clientes activos.`}
        onCancel={() => setCustomerToDeactivate(null)}
        onConfirm={handleDeactivate}
        open={Boolean(customerToDeactivate)}
        title="Desactivar cliente"
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
