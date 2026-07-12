import { Dialog, DialogContent, DialogTitle } from '@mui/material'
import type { User, UserCreateMutation, UserUpdateMutation } from '../../domain/entities/User'
import { UserForm } from './UserForm'

type UserSubmitValues =
  | { mode: 'create'; values: UserCreateMutation }
  | { mode: 'edit'; values: UserUpdateMutation }

type UserModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialData?: User | null
  loading?: boolean
  onClose: () => void
  onSubmit: (values: UserSubmitValues) => void
  serverErrors?: Record<string, string>
}

export const UserModal = ({
  open,
  mode,
  initialData,
  loading = false,
  onClose,
  onSubmit,
  serverErrors = {},
}: UserModalProps) => {
  return (
    <Dialog fullWidth maxWidth="sm" onClose={loading ? undefined : onClose} open={open}>
      <DialogTitle>{mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}</DialogTitle>
      <DialogContent sx={{ pt: '14px !important' }}>
        <UserForm
          initialValues={initialData}
          loading={loading}
          mode={mode}
          onCancel={onClose}
          onSubmit={onSubmit}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  )
}
