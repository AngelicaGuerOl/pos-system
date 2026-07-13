import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Alert,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { Category } from '../../../categories'
import {
  PRODUCT_UNIT_LABELS,
  PRODUCT_UNITS,
  type Product,
  type ProductMutation,
} from '../../domain/entities/Product'
import { productSchema, type ProductFormValues } from '../schemas/productSchema'

type ProductFormProps = {
  categories: Category[]
  initialValues?: Product | null
  loading?: boolean
  onCancel: () => void
  onSubmit: (values: ProductMutation) => void
}

const getDefaultValues = (product?: Product | null): ProductFormValues => ({
  categoryId: product?.categoryId ?? 0,
  barcode: product?.barcode ?? '',
  name: product?.name ?? '',
  description: product?.description ?? '',
  unit: product?.unit ?? 'PIECE',
  costPrice: product?.costPrice ?? 0,
  salePrice: product?.salePrice ?? 0,
  currentStock: product?.currentStock ?? 0,
  minimumStock: product?.minimumStock ?? 0,
})

export const ProductForm = ({
  categories,
  initialValues,
  loading = false,
  onCancel,
  onSubmit,
}: ProductFormProps) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ProductFormValues>({
    defaultValues: getDefaultValues(initialValues),
    resolver: zodResolver(productSchema),
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
          ...values,
          description: values.description || null,
        })
      })}
    >
      <Stack spacing={2.5}>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <FormControl error={Boolean(errors.categoryId)} fullWidth>
              <InputLabel>Categoria</InputLabel>
              <Select
                disabled={loading}
                label="Categoria"
                onChange={(event) => field.onChange(Number(event.target.value))}
                value={field.value}
              >
                <MenuItem value={0}>Selecciona una categoria</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.categoryId?.message}</FormHelperText>
            </FormControl>
          )}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            disabled={loading}
            error={Boolean(errors.barcode)}
            fullWidth
            helperText={errors.barcode?.message}
            label="Codigo de barras"
            {...register('barcode')}
          />
          <TextField
            disabled={loading}
            error={Boolean(errors.name)}
            fullWidth
            helperText={errors.name?.message}
            label="Nombre"
            {...register('name')}
          />
        </Stack>

        <TextField
          disabled={loading}
          error={Boolean(errors.description)}
          fullWidth
          helperText={errors.description?.message}
          label="Descripcion"
          {...register('description')}
        />

        <Controller
          control={control}
          name="unit"
          render={({ field }) => (
            <FormControl error={Boolean(errors.unit)} fullWidth>
              <InputLabel>Unidad</InputLabel>
              <Select disabled={loading} label="Unidad" {...field}>
                {PRODUCT_UNITS.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {PRODUCT_UNIT_LABELS[unit]}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.unit?.message}</FormHelperText>
            </FormControl>
          )}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            disabled={loading}
            error={Boolean(errors.costPrice)}
            fullWidth
            helperText={errors.costPrice?.message}
            label="Precio costo"
            type="number"
            {...register('costPrice', { valueAsNumber: true })}
          />
          <TextField
            disabled={loading}
            error={Boolean(errors.salePrice)}
            fullWidth
            helperText={errors.salePrice?.message}
            label="Precio venta"
            type="number"
            {...register('salePrice', { valueAsNumber: true })}
          />
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {initialValues ? (
            <TextField
              disabled
              fullWidth
              helperText="Las existencias se modifican desde Movimientos de inventario."
              label="Stock actual"
              type="number"
              value={initialValues.currentStock}
            />
          ) : (
            <TextField
              disabled={loading}
              error={Boolean(errors.currentStock)}
              fullWidth
              helperText={errors.currentStock?.message ?? 'Existencia inicial del producto.'}
              label="Stock inicial"
              type="number"
              {...register('currentStock', { valueAsNumber: true })}
            />
          )}
          <TextField
            disabled={loading}
            error={Boolean(errors.minimumStock)}
            fullWidth
            helperText={errors.minimumStock?.message}
            label="Stock minimo"
            type="number"
            {...register('minimumStock', { valueAsNumber: true })}
          />
        </Stack>

        {initialValues ? (
          <Alert severity="info">
            Las existencias se modifican desde Movimientos de inventario.
          </Alert>
        ) : null}

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
