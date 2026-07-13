import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { ApiValidationErrors } from '../../../../../shared/api/apiError'
import { normalizeApiError } from '../../../../../shared/api/apiError'
import { formatNumber } from '../../../../../shared/utils/formatters'
import { productDependencies } from '../../../../catalog/products/dependencies'
import {
  PRODUCT_UNIT_LABELS,
  type Product,
} from '../../../../catalog/products/domain/entities/Product'
import type { ManualInventoryMovementData } from '../../domain/entities/InventoryMovement'
import {
  manualInventoryMovementSchema,
  type ManualInventoryMovementFormValues,
} from '../schemas/manualInventoryMovementSchema'

type ManualInventoryMovementFormProps = {
  errorMessage?: string | null
  loading?: boolean
  mode: 'entry' | 'exit'
  onCancel: () => void
  onSubmit: (values: ManualInventoryMovementData) => void
  open: boolean
  serverErrors?: ApiValidationErrors
  submitLabel: string
}

const defaultValues: ManualInventoryMovementFormValues = {
  productId: 0,
  quantity: 0,
  description: '',
}

const getProductLabel = (product: Product): string => {
  return `${product.name} · ${product.barcode} · Stock: ${formatNumber(product.currentStock)}`
}

export const ManualInventoryMovementForm = ({
  errorMessage,
  loading = false,
  mode,
  onCancel,
  onSubmit,
  open,
  serverErrors,
  submitLabel,
}: ManualInventoryMovementFormProps) => {
  const [products, setProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<ManualInventoryMovementFormValues>({
    defaultValues,
    resolver: zodResolver(manualInventoryMovementSchema),
  })

  const quantity = watch('quantity')
  const estimatedStock = selectedProduct ? selectedProduct.currentStock - (Number(quantity) || 0) : null
  const visualStockError =
    mode === 'exit' &&
    selectedProduct &&
    Number.isFinite(quantity) &&
    quantity > selectedProduct.currentStock
      ? 'La cantidad supera el stock visible. El backend validara el stock definitivo.'
      : null

  const loadProducts = useCallback(async (search: string) => {
    setProductsLoading(true)
    setProductsError(null)

    try {
      const data = await productDependencies.getProductsUseCase.execute({
        search: search.trim() || undefined,
      })
      setProducts(data.content)
    } catch (unknownError) {
      setProductsError(normalizeApiError(unknownError).message)
    } finally {
      setProductsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const timeout = window.setTimeout(() => {
      void loadProducts(productSearch)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [loadProducts, open, productSearch])

  useEffect(() => {
    if (open) {
      reset(defaultValues)
      setSelectedProduct(null)
      setProductSearch('')
      setProductsError(null)
    }
  }, [open, reset])

  const productOptions = useMemo(() => {
    if (selectedProduct && !products.some((product) => product.id === selectedProduct.id)) {
      return [selectedProduct, ...products]
    }

    return products
  }, [products, selectedProduct])

  const productError = errors.productId?.message ?? serverErrors?.productId
  const quantityError = errors.quantity?.message ?? serverErrors?.quantity ?? visualStockError
  const descriptionError = errors.description?.message ?? serverErrors?.description

  return (
    <Box
      component="form"
      id={`manual-inventory-${mode}-form`}
      noValidate
      onSubmit={handleSubmit((values) => {
        onSubmit({
          productId: values.productId,
          quantity: values.quantity,
          description: values.description.trim(),
        })
      })}
    >
      <Stack spacing={2.5}>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        {productsError ? <Alert severity="error">{productsError}</Alert> : null}

        <Controller
          control={control}
          name="productId"
          render={({ field }) => (
            <Autocomplete<Product>
              disabled={loading}
              filterOptions={(options) => options}
              getOptionLabel={getProductLabel}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={productsLoading}
              onChange={(_event, product) => {
                setSelectedProduct(product)
                field.onChange(product?.id ?? 0)
              }}
              onInputChange={(_event, value) => setProductSearch(value)}
              options={productOptions}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={Boolean(productError)}
                  helperText={productError}
                  label="Producto"
                  slotProps={{
                    input: {
                      ...params.slotProps.input,
                      endAdornment: (
                        <>
                          {productsLoading ? <CircularProgress color="inherit" size={18} /> : null}
                          {params.slotProps.input.endAdornment}
                        </>
                      ),
                    },
                    htmlInput: params.slotProps.htmlInput,
                    inputLabel: params.slotProps.inputLabel,
                  }}
                />
              )}
              renderOption={(props, product) => (
                <Box component="li" {...props} key={product.id}>
                  <Stack spacing={0.25}>
                    <Typography sx={{ fontWeight: 800 }}>{product.name}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {product.barcode} · {PRODUCT_UNIT_LABELS[product.unit]} · Stock:{' '}
                      {formatNumber(product.currentStock)}
                    </Typography>
                  </Stack>
                </Box>
              )}
              value={selectedProduct}
            />
          )}
        />

        <TextField
          disabled={loading}
          error={Boolean(quantityError)}
          fullWidth
          helperText={quantityError}
          label="Cantidad"
          slotProps={{
            htmlInput: {
              min: 0,
              step: '0.01',
            },
            input: {
              endAdornment: selectedProduct ? (
                <InputAdornment position="end">{PRODUCT_UNIT_LABELS[selectedProduct.unit]}</InputAdornment>
              ) : undefined,
            },
          }}
          type="number"
          {...register('quantity', { valueAsNumber: true })}
        />

        {mode === 'exit' && selectedProduct ? (
          <Alert severity={visualStockError ? 'warning' : 'info'}>
            {selectedProduct.name}: stock actual {formatNumber(selectedProduct.currentStock)}. Saldran{' '}
            {formatNumber(Number(quantity) || 0)}. Stock estimado posterior{' '}
            {formatNumber(estimatedStock ?? selectedProduct.currentStock)}.
          </Alert>
        ) : null}

        <TextField
          disabled={loading}
          error={Boolean(descriptionError)}
          fullWidth
          helperText={descriptionError}
          label="Motivo"
          multiline
          minRows={3}
          {...register('description')}
        />

        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
          <Button disabled={loading} onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={loading} type="submit" variant="contained">
            {submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
