import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { normalizeApiError } from '../../../../../shared/api/apiError'
import { formatNumber } from '../../../../../shared/utils/formatters'
import { productDependencies } from '../../../../catalog/products/dependencies'
import {
  PRODUCT_UNIT_LABELS,
  type Product,
} from '../../../../catalog/products/domain/entities/Product'
import {
  INVENTORY_MOVEMENT_DIRECTION_LABELS,
  INVENTORY_MOVEMENT_TYPE_LABELS,
  type InventoryMovementDirection,
  type InventoryMovementFilters as InventoryMovementFiltersValue,
  type InventoryMovementType,
} from '../../domain/entities/InventoryMovement'

type InventoryMovementFiltersProps = {
  filters: InventoryMovementFiltersValue
  onChange: (filters: Partial<InventoryMovementFiltersValue>) => void
  onClear: () => void
}

const getProductLabel = (product: Product): string => {
  return `${product.name} · ${product.barcode} · Stock: ${formatNumber(product.currentStock)}`
}

export const InventoryMovementFilters = ({
  filters,
  onChange,
  onClear,
}: InventoryMovementFiltersProps) => {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState<string | null>(null)

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
    const timeout = window.setTimeout(() => {
      void loadProducts(productSearch)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [loadProducts, productSearch])

  useEffect(() => {
    if (!filters.productId) {
      setSelectedProduct(null)
    }
  }, [filters.productId])

  const productOptions = useMemo(() => {
    if (selectedProduct && !products.some((product) => product.id === selectedProduct.id)) {
      return [selectedProduct, ...products]
    }

    return products
  }, [products, selectedProduct])

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { xs: 'stretch', lg: 'center' }, width: '100%' }}
      >
        <TextField
          label="Buscar"
          onChange={(event) => onChange({ search: event.target.value || undefined })}
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: { xs: '100%', lg: 260 } }}
          value={filters.search ?? ''}
        />

        <Autocomplete<Product>
          filterOptions={(options) => options}
          getOptionLabel={getProductLabel}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          loading={productsLoading}
          onChange={(_event, product) => {
            setSelectedProduct(product)
            onChange({ productId: product?.id })
          }}
          onInputChange={(_event, value) => setProductSearch(value)}
          options={productOptions}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Producto"
              size="small"
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
          size="small"
          sx={{ minWidth: { xs: '100%', lg: 320 } }}
          value={selectedProduct}
        />

        <FormControl size="small" sx={{ minWidth: { xs: '100%', lg: 150 } }}>
          <InputLabel>Direccion</InputLabel>
          <Select
            label="Direccion"
            onChange={(event) =>
              onChange({
                direction: event.target.value
                  ? (event.target.value as InventoryMovementDirection)
                  : undefined,
              })
            }
            value={filters.direction ?? ''}
          >
            <MenuItem value="">Todas</MenuItem>
            {Object.entries(INVENTORY_MOVEMENT_DIRECTION_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: { xs: '100%', lg: 190 } }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            label="Tipo"
            onChange={(event) =>
              onChange({
                type: event.target.value ? (event.target.value as InventoryMovementType) : undefined,
              })
            }
            value={filters.type ?? ''}
          >
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(INVENTORY_MOVEMENT_TYPE_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
      >
        <TextField
          label="Fecha inicial"
          onChange={(event) => onChange({ from: event.target.value || undefined })}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          type="datetime-local"
          value={filters.from ?? ''}
        />
        <TextField
          label="Fecha final"
          onChange={(event) => onChange({ to: event.target.value || undefined })}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          type="datetime-local"
          value={filters.to ?? ''}
        />
        <Button onClick={onClear} startIcon={<ClearRoundedIcon />}>
          Limpiar filtros
        </Button>
        {productsError ? (
          <Typography color="error" variant="body2">
            {productsError}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  )
}
