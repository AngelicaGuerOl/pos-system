import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { Category } from '../../../categories'
import type { Supplier } from '../../../suppliers'
import { productDependencies } from '../../dependencies'
import {
  PRODUCT_UNIT_LABELS,
  PRODUCT_UNITS,
  type BarcodeLookup,
  type Product,
  type ProductMutation,
} from '../../domain/entities/Product'
import { productSchema, type ProductFormValues } from '../schemas/productSchema'

type ProductFormProps = {
  categories: Category[]
  suppliers: Supplier[]
  initialValues?: Product | null
  loading?: boolean
  onCancel: () => void
  onSubmit: (values: ProductMutation) => void
}

const getDefaultValues = (product?: Product | null): ProductFormValues => ({
  categoryId: product?.categoryId ?? 0,
  supplierId: product?.supplierId ?? null,
  barcode: product?.barcode ?? '',
  name: product?.name ?? '',
  description: product?.description ?? '',
  unit: product?.unit ?? 'PIECE',
  costPrice: product?.costPrice ?? 0,
  salePrice: product?.salePrice ?? 0,
  currentStock: product?.currentStock ?? 0,
  minimumStock: product?.minimumStock ?? 0,
})

type LookupFeedback = {
  severity: 'info' | 'warning'
  text: string
  duplicate: boolean
}

export const ProductForm = ({
  categories,
  suppliers,
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
    setValue,
  } = useForm<ProductFormValues>({
    defaultValues: getDefaultValues(initialValues),
    resolver: zodResolver(productSchema),
  })
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupFeedback, setLookupFeedback] = useState<LookupFeedback | null>(null)
  const pendingBarcodeRef = useRef<string | null>(null)
  const lookupSequenceRef = useRef(0)
  const barcodeInputRef = useRef<HTMLInputElement | null>(null)
  const isCreateMode = !initialValues

  useEffect(() => {
    reset(getDefaultValues(initialValues))
    setLookupFeedback(null)
    setLookupLoading(false)
    pendingBarcodeRef.current = null
  }, [initialValues, reset])

  const applyLookupResponse = useCallback((lookup: BarcodeLookup) => {
    if (lookup.status === 'LOCAL_PRODUCT_EXISTS') {
      const productName = lookup.existingProduct?.name ? ` "${lookup.existingProduct.name}"` : ''
      setLookupFeedback({
        duplicate: true,
        severity: 'warning',
        text: lookup.existingProductActive === false
          ? `Este codigo pertenece al producto inactivo${productName}. Reactivalo con el flujo actual antes de crear otro.`
          : `Ya existe un producto con este codigo${productName}. No se puede duplicar.`,
      })
      return
    }

    if (lookup.status === 'EXTERNAL_MATCH' && lookup.suggestedName) {
      setValue('name', lookup.suggestedName, { shouldDirty: true, shouldValidate: true })
      setLookupFeedback({
        duplicate: false,
        severity: 'info',
        text: 'Nombre sugerido completado desde el catalogo externo. Puedes editarlo antes de guardar.',
      })
      return
    }

    setLookupFeedback({
      duplicate: false,
      severity: 'info',
      text: 'No encontramos informacion para este codigo. Puedes capturar el producto manualmente.',
    })
  }, [setValue])

  const lookupBarcode = useCallback(async (barcodeValue: string) => {
    const barcode = barcodeValue.trim()
    if (!isCreateMode || barcode.length === 0 || pendingBarcodeRef.current === barcode) {
      return
    }

    const requestSequence = lookupSequenceRef.current + 1
    lookupSequenceRef.current = requestSequence
    pendingBarcodeRef.current = barcode
    setLookupLoading(true)
    setLookupFeedback(null)

    try {
      const lookup = await productDependencies.lookupBarcodeUseCase.execute(barcode)
      if (lookupSequenceRef.current === requestSequence) {
        applyLookupResponse(lookup)
      }
    } catch {
      if (lookupSequenceRef.current === requestSequence) {
        setLookupFeedback({
          duplicate: false,
          severity: 'info',
          text: 'No fue posible consultar el catalogo externo. Puedes capturar el producto manualmente.',
        })
      }
    } finally {
      if (lookupSequenceRef.current === requestSequence) {
        setLookupLoading(false)
        pendingBarcodeRef.current = null
        window.setTimeout(() => barcodeInputRef.current?.focus(), 0)
      }
    }
  }, [applyLookupResponse, isCreateMode])

  const barcodeRegister = register('barcode', {
    onChange: () => setLookupFeedback(null),
  })
  const submitDisabled = loading || lookupLoading || Boolean(lookupFeedback?.duplicate)

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

        <Controller
          control={control}
          name="supplierId"
          render={({ field }) => (
            <FormControl error={Boolean(errors.supplierId)} fullWidth>
              <InputLabel>Proveedor</InputLabel>
              <Select
                disabled={loading}
                label="Proveedor"
                onChange={(event) => {
                  const value = Number(event.target.value)
                  field.onChange(value > 0 ? value : null)
                }}
                value={field.value ?? 0}
              >
                <MenuItem value={0}>Sin proveedor</MenuItem>
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.supplierId?.message}</FormHelperText>
            </FormControl>
          )}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            disabled={loading || lookupLoading}
            error={Boolean(errors.barcode)}
            fullWidth
            helperText={errors.barcode?.message ?? (isCreateMode ? 'Presiona Enter para buscar por codigo.' : undefined)}
            label="Codigo de barras"
            slotProps={{
              input: {
                endAdornment: lookupLoading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : undefined,
              },
            }}
            {...barcodeRegister}
            inputRef={(element) => {
              barcodeRegister.ref(element)
              barcodeInputRef.current = element
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') {
                return
              }
              event.preventDefault()
              void lookupBarcode(barcodeInputRef.current?.value ?? '')
            }}
          />
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextField
                disabled={loading}
                error={Boolean(errors.name)}
                fullWidth
                helperText={errors.name?.message}
                label="Nombre"
                {...field}
              />
            )}
          />
        </Stack>

        {lookupFeedback ? (
          <Alert severity={lookupFeedback.severity}>{lookupFeedback.text}</Alert>
        ) : null}

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
          <Button disabled={loading || lookupLoading} onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={submitDisabled} type="submit" variant="contained">
            Guardar
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
