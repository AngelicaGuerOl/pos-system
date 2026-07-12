import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Stack, TextField } from '@mui/material'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Customer, CustomerMutation } from '../../domain/entities/Customer'
import { customerSchema, type CustomerFormValues } from '../schemas/customerSchema'

type CustomerFormProps = {
  initialValues?: Customer | null
  loading?: boolean
  onCancel: () => void
  onSubmit: (values: CustomerMutation) => void
  serverErrors?: Record<string, string>
}

const getDefaultValues = (customer?: Customer | null): CustomerFormValues => ({
  firstName: customer?.firstName ?? '',
  lastName: customer?.lastName ?? '',
  phone: customer?.phone ?? '',
})

export const CustomerForm = ({
  initialValues,
  loading = false,
  onCancel,
  onSubmit,
  serverErrors = {},
}: CustomerFormProps) => {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CustomerFormValues>({
    defaultValues: getDefaultValues(initialValues),
    resolver: zodResolver(customerSchema),
  })

  useEffect(() => {
    reset(getDefaultValues(initialValues))
  }, [initialValues, reset])

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit((values) => {
        onSubmit({
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone || null,
        })
      })}
    >
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            autoFocus
            disabled={loading}
            error={Boolean(errors.firstName || serverErrors.firstName)}
            fullWidth
            helperText={errors.firstName?.message ?? serverErrors.firstName}
            label="Nombre"
            {...register('firstName')}
          />
          <TextField
            disabled={loading}
            error={Boolean(errors.lastName || serverErrors.lastName)}
            fullWidth
            helperText={errors.lastName?.message ?? serverErrors.lastName}
            label="Apellido"
            {...register('lastName')}
          />
        </Stack>

        <TextField
          disabled={loading}
          error={Boolean(errors.phone || serverErrors.phone)}
          fullWidth
          helperText={errors.phone?.message ?? serverErrors.phone}
          label="Telefono"
          {...register('phone')}
        />

        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
          <Button disabled={loading} onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={loading} type="submit" variant="contained">
            Guardar
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
