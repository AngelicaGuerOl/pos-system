import { Dialog, DialogContent, DialogTitle } from '@mui/material'
import type { Customer, CustomerMutation } from '../../domain/entities/Customer'
import { CustomerForm } from './CustomerForm'

type CustomerModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialData?: Customer | null
  loading?: boolean
  onClose: () => void
  onSubmit: (values: CustomerMutation) => void
  serverErrors?: Record<string, string>
}

export const CustomerModal = ({
  open,
  mode,
  initialData,
  loading = false,
  onClose,
  onSubmit,
  serverErrors = {},
}: CustomerModalProps) => {
  return (
    <Dialog fullWidth maxWidth="sm" onClose={loading ? undefined : onClose} open={open}>
      <DialogTitle>{mode === 'create' ? 'Nuevo cliente' : 'Editar cliente'}</DialogTitle>
      <DialogContent sx={{ pt: '14px !important' }}>
        <CustomerForm
          initialValues={initialData}
          loading={loading}
          onCancel={onClose}
          onSubmit={onSubmit}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  )
}
