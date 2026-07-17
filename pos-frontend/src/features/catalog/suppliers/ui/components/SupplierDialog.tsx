import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Dialog, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Supplier, SupplierMutation } from '../../domain/entities/Supplier'
import { supplierSchema, type SupplierFormValues } from '../schemas/supplierSchema'

type SupplierDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialData?: Supplier | null
  loading?: boolean
  onClose: () => void
  onSubmit: (values: SupplierMutation) => void
}

const defaults = (supplier?: Supplier | null): SupplierFormValues => ({
  name: supplier?.name ?? '',
  contactName: supplier?.contactName ?? '',
  phone: supplier?.phone ?? '',
  email: supplier?.email ?? '',
  notes: supplier?.notes ?? '',
})

export const SupplierDialog = ({
  open,
  mode,
  initialData,
  loading = false,
  onClose,
  onSubmit,
}: SupplierDialogProps) => {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<SupplierFormValues>({
    defaultValues: defaults(initialData),
    resolver: zodResolver(supplierSchema),
  })

  useEffect(() => {
    reset(defaults(initialData))
  }, [initialData, reset])

  return (
    <Dialog fullWidth maxWidth="sm" onClose={loading ? undefined : onClose} open={open}>
      <DialogTitle>{mode === 'create' ? 'Nuevo proveedor' : 'Editar proveedor'}</DialogTitle>
      <DialogContent sx={{ pt: '14px !important' }}>
        <Stack
          component="form"
          noValidate
          onSubmit={handleSubmit((values) => onSubmit(values))}
          spacing={2}
        >
          <TextField
            autoFocus
            disabled={loading}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            label="Nombre"
            {...register('name')}
          />
          <TextField
            disabled={loading}
            error={Boolean(errors.contactName)}
            helperText={errors.contactName?.message}
            label="Nombre de contacto"
            {...register('contactName')}
          />
          <TextField
            disabled={loading}
            error={Boolean(errors.phone)}
            helperText={errors.phone?.message}
            label="Telefono"
            {...register('phone')}
          />
          <TextField
            disabled={loading}
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            label="Correo"
            {...register('email')}
          />
          <TextField
            disabled={loading}
            error={Boolean(errors.notes)}
            helperText={errors.notes?.message}
            label="Notas"
            minRows={3}
            multiline
            {...register('notes')}
          />
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            <Button disabled={loading} onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={loading} type="submit" variant="contained">
              Guardar
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
