import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded'
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
import { useAuth } from '../../../auth'
import { ConfirmDialog } from '../../../../shared/ui/components/ConfirmDialog'
import { DataGridShell } from '../../../../shared/ui/components/DataGridShell'
import { EmptyState } from '../../../../shared/ui/components/EmptyState'
import { PageHeader } from '../../../../shared/ui/components/PageHeader'
import type { User, UserCreateMutation, UserUpdateMutation } from '../../domain/entities/User'
import { UserModal } from '../components/UserModal'
import { UsersGrid } from '../components/UsersGrid'
import { useCreateUser } from '../hooks/useCreateUser'
import { useDeactivateUser } from '../hooks/useDeactivateUser'
import { useUpdateUser } from '../hooks/useUpdateUser'
import { useUsers } from '../hooks/useUsers'

type ModalState =
  | { open: false; mode: 'create'; user: null }
  | { open: true; mode: 'create'; user: null }
  | { open: true; mode: 'edit'; user: User }

type UserSubmitValues =
  | { mode: 'create'; values: UserCreateMutation }
  | { mode: 'edit'; values: UserUpdateMutation }

export const UsersPage = () => {
  const { user: currentUser } = useAuth()
  const canManage = currentUser?.role === 'ADMIN'
  const [modal, setModal] = useState<ModalState>({ mode: 'create', open: false, user: null })
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null)
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)
  const {
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
    users,
  } = useUsers()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deactivateUser = useDeactivateUser()

  const mutationError = useMemo(
    () => createUser.error ?? updateUser.error ?? deactivateUser.error,
    [createUser.error, deactivateUser.error, updateUser.error],
  )

  const mutationLoading = createUser.loading || updateUser.loading || deactivateUser.loading

  const handleSubmit = async (payload: UserSubmitValues) => {
    const result =
      payload.mode === 'create'
        ? await createUser.createUser(payload.values)
        : modal.mode === 'edit'
          ? await updateUser.updateUser(modal.user.id, payload.values)
          : null

    if (!result) {
      setMessage({
        severity: 'error',
        text: mutationError?.message ?? 'Error al guardar el usuario. Por favor intente nuevamente.',
      })
      return
    }

    setModal({ mode: 'create', open: false, user: null })
    setMessage({
      severity: 'success',
      text: payload.mode === 'create' ? 'Usuario creado' : 'Usuario actualizado',
    })
    await refetch()
  }

  const handleDeactivate = async () => {
    if (!userToDeactivate) {
      return
    }

    const success = await deactivateUser.deactivateUser(userToDeactivate.id)

    if (success) {
      setMessage({ severity: 'success', text: 'Usuario desactivado' })
      setUserToDeactivate(null)
      await refetch()
    }
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle="Administra cuentas, roles y accesos del sistema."
        title="Usuarios"
      />

      <DataGridShell
        loading={loading}
        toolbar={
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', lg: 'center' }, width: '100%' }}
          >
            {canManage ? (
              <Button
                onClick={() => setModal({ mode: 'create', open: true, user: null })}
                startIcon={<AddRoundedIcon />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
                variant="contained"
              >
                Nuevo usuario
              </Button>
            ) : null}

            {loading ? <CircularProgress size={24} /> : null}

            <Box sx={{ flexGrow: 1 }} />

            <TextField
              label="Buscar usuario"
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

          {!loading && users.length === 0 ? (
            <EmptyState
              actionIcon={<ManageAccountsRoundedIcon />}
              actionLabel={canManage ? 'Nuevo usuario' : undefined}
              message="No hay usuarios activos para mostrar con los filtros actuales."
              onAction={
                canManage ? () => setModal({ mode: 'create', open: true, user: null }) : undefined
              }
              title="Sin usuarios"
            />
          ) : (
            <>
              <UsersGrid
                canManage={canManage}
                loading={loading}
                onDeactivate={setUserToDeactivate}
                onEdit={(user) => setModal({ mode: 'edit', open: true, user })}
                users={users}
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

      <UserModal
        initialData={modal.user}
        loading={mutationLoading}
        mode={modal.mode}
        onClose={() => setModal({ mode: 'create', open: false, user: null })}
        onSubmit={handleSubmit}
        open={modal.open}
        serverErrors={mutationError?.validationErrors}
      />

      <ConfirmDialog
        confirmText="Desactivar"
        loading={deactivateUser.loading}
        message={`El usuario "${userToDeactivate?.username ?? ''}" dejara de tener acceso al sistema.`}
        onCancel={() => setUserToDeactivate(null)}
        onConfirm={handleDeactivate}
        open={Boolean(userToDeactivate)}
        title="Desactivar usuario"
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
