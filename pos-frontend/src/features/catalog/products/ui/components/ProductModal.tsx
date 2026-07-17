import { Dialog, DialogContent, DialogTitle } from '@mui/material'
import type { Category } from '../../../categories'
import type { Supplier } from '../../../suppliers'
import type { Product, ProductMutation } from '../../domain/entities/Product'
import { ProductForm } from './ProductForm'

type ProductModalProps = {
  categories: Category[]
  suppliers: Supplier[]
  open: boolean
  mode: 'create' | 'edit'
  initialData?: Product | null
  loading?: boolean
  onClose: () => void
  onSubmit: (values: ProductMutation) => void
}

export const ProductModal = ({
  categories,
  suppliers,
  open,
  mode,
  initialData,
  loading = false,
  onClose,
  onSubmit,
}: ProductModalProps) => {
  return (
    <Dialog fullWidth maxWidth="md" onClose={loading ? undefined : onClose} open={open}>
      <DialogTitle>{mode === 'create' ? 'Nuevo producto' : 'Editar producto'}</DialogTitle>
      <DialogContent sx={{ pt: '14px !important' }}>
        <ProductForm
          categories={categories}
          suppliers={suppliers}
          initialValues={initialData}
          loading={loading}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  )
}
