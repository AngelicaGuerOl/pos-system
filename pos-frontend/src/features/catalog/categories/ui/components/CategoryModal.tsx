import { Dialog, DialogContent, DialogTitle } from '@mui/material'
import type { Category, CategoryMutation } from '../../domain/entities/Category'
import { CategoryForm } from './CategoryForm'

type CategoryModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialData?: Category | null
  loading?: boolean
  onClose: () => void
  onSubmit: (values: CategoryMutation) => void
}

export const CategoryModal = ({
  open,
  mode,
  initialData,
  loading = false,
  onClose,
  onSubmit,
}: CategoryModalProps) => {
  return (
    <Dialog fullWidth maxWidth="sm" onClose={loading ? undefined : onClose} open={open}>
      <DialogTitle>{mode === 'create' ? 'Nueva categoria' : 'Editar categoria'}</DialogTitle>
      <DialogContent sx={{ pt: '14px !important' }}>
        <CategoryForm
          initialValues={
            initialData
              ? { description: initialData.description, name: initialData.name }
              : undefined
          }
          loading={loading}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  )
}
