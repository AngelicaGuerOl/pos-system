import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Stack, TextField } from '@mui/material'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { CategoryMutation } from '../../domain/entities/Category'
import { categorySchema, type CategoryFormValues } from '../schemas/categorySchema'

type CategoryFormProps = {
  initialValues?: CategoryMutation
  loading?: boolean
  onCancel: () => void
  onSubmit: (values: CategoryMutation) => void
}

export const CategoryForm = ({
  initialValues,
  loading = false,
  onCancel,
  onSubmit,
}: CategoryFormProps) => {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CategoryFormValues>({
    defaultValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
    },
    resolver: zodResolver(categorySchema),
  })

  useEffect(() => {
    reset({
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
    })
  }, [initialValues, reset])

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit((values) => {
        onSubmit({
          name: values.name,
          description: values.description || null,
        })
      })}
    >
      <Stack spacing={2.5}>
        <TextField
          autoFocus
          disabled={loading}
          error={Boolean(errors.name)}
          fullWidth
          helperText={errors.name?.message}
          label="Nombre"
          {...register('name')}
        />
        <TextField
          disabled={loading}
          error={Boolean(errors.description)}
          fullWidth
          helperText={errors.description?.message}
          label="Descripcion"
          minRows={3}
          multiline
          {...register('description')}
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

