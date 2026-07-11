import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useAuth } from '../../../../auth'
import { useCategories } from '../../../categories/ui/hooks/useCategories'
import { ConfirmDialog } from '../../../../../shared/ui/components/ConfirmDialog'
import { DataGridShell } from '../../../../../shared/ui/components/DataGridShell'
import { EmptyState } from '../../../../../shared/ui/components/EmptyState'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
import type { Product, ProductMutation } from '../../domain/entities/Product'
import { ProductModal } from '../components/ProductModal'
import { ProductsGrid } from '../components/ProductsGrid'
import { useCreateProduct } from '../hooks/useCreateProduct'
import { useDeactivateProduct } from '../hooks/useDeactivateProduct'
import { useProducts } from '../hooks/useProducts'
import { useUpdateProduct } from '../hooks/useUpdateProduct'

type ModalState =
  | { open: false; mode: 'create'; product: null }
  | { open: true; mode: 'create'; product: null }
  | { open: true; mode: 'edit'; product: Product }

export const ProductsPage = () => {
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN'
  const [modal, setModal] = useState<ModalState>({ mode: 'create', open: false, product: null })
  const [productToDeactivate, setProductToDeactivate] = useState<Product | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const { categories } = useCategories()
  const { error, filters, loading, products, refetch, setFilters } = useProducts()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deactivateProduct = useDeactivateProduct()

  const mutationError = useMemo(
    () => createProduct.error ?? updateProduct.error ?? deactivateProduct.error,
    [createProduct.error, deactivateProduct.error, updateProduct.error],
  )

  const mutationLoading = createProduct.loading || updateProduct.loading || deactivateProduct.loading

  const handleSubmit = async (values: ProductMutation) => {
    const result =
      modal.mode === 'create'
        ? await createProduct.createProduct(values)
        : await updateProduct.updateProduct(modal.product.id, values)

    if (!result) {
      return
    }

    setModal({ mode: 'create', open: false, product: null })
    setMessage(modal.mode === 'create' ? 'Producto creado' : 'Producto actualizado')
    await refetch()
  }

  const handleDeactivate = async () => {
    if (!productToDeactivate) {
      return
    }

    const success = await deactivateProduct.deactivateProduct(productToDeactivate.id)

    if (success) {
      setMessage('Producto desactivado')
      setProductToDeactivate(null)
      await refetch()
    }
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle="Administra productos, precios y existencias."
        title="Productos"
      />

      <DataGridShell
        loading={loading}
        toolbar={
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', lg: 'center' }, width: '100%' }}
          >
            {canManage ? (
              <Button
                onClick={() => setModal({ mode: 'create', open: true, product: null })}
                startIcon={<AddRoundedIcon />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
                variant="contained"
              >
                Nuevo producto
              </Button>
            ) : null}

            {loading ? <CircularProgress size={24} /> : null}

            <Box sx={{ flexGrow: 1 }} />

            <TextField
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              label="Buscar producto"
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
              sx={{ minWidth: { xs: '100%', lg: 280 } }}
              value={filters.search ?? ''}
            />

            <FormControl size="small" sx={{ minWidth: { xs: '100%', lg: 220 } }}>
              <InputLabel>Categoria</InputLabel>
              <Select
                label="Categoria"
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    categoryId: Number(event.target.value) || null,
                  })
                }
                value={filters.categoryId ?? 0}
              >
                <MenuItem value={0}>Todas</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(filters.lowStock)}
                  onChange={(event) =>
                    setFilters({ ...filters, lowStock: event.target.checked || undefined })
                  }
                />
              }
              label="Bajo stock"
              sx={{ whiteSpace: 'nowrap' }}
            />
          </Stack>
        }
      >
        <Stack spacing={2}>

          {error ? <Alert severity="error">{error.message}</Alert> : null}
          {mutationError ? <Alert severity="error">{mutationError.message}</Alert> : null}

          {!loading && products.length === 0 ? (
            <EmptyState
              actionIcon={<AddRoundedIcon />}
              actionLabel={canManage ? 'Nuevo producto' : undefined}
              message="No hay productos para mostrar con los filtros actuales."
              onAction={canManage ? () => setModal({ mode: 'create', open: true, product: null }) : undefined}
              title="Sin productos"
            />
          ) : (
            <ProductsGrid
              canManage={canManage}
              loading={loading}
              onDeactivate={setProductToDeactivate}
              onEdit={(product) => setModal({ mode: 'edit', open: true, product })}
              products={products}
            />
          )}
        </Stack>
      </DataGridShell>

      <ProductModal
        categories={categories}
        initialData={modal.product}
        loading={mutationLoading}
        mode={modal.mode}
        onClose={() => setModal({ mode: 'create', open: false, product: null })}
        onSubmit={handleSubmit}
        open={modal.open}
      />

      <ConfirmDialog
        confirmText="Desactivar"
        loading={deactivateProduct.loading}
        message={`El producto "${productToDeactivate?.name ?? ''}" dejara de estar disponible.`}
        onCancel={() => setProductToDeactivate(null)}
        onConfirm={handleDeactivate}
        open={Boolean(productToDeactivate)}
        title="Desactivar producto"
      />

      <Snackbar
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
        open={Boolean(message)}
      >
        <Alert onClose={() => setMessage(null)} severity="success" variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
