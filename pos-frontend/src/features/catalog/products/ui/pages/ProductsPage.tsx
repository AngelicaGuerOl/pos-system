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
  TablePagination,
  TextField,
  type AlertColor,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../../auth'
import { useCategories } from '../../../categories/ui/hooks/useCategories'
import { useSuppliers } from '../../../suppliers/ui/hooks/useSuppliers'
import { useFormHandler } from '../../../../../shared/lib/forms/useFormHandler'
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
import { useReactivateProduct } from '../hooks/useReactivateProduct'
import { useUpdateProduct } from '../hooks/useUpdateProduct'

type ModalState =
  | { open: false; mode: 'create'; product: null }
  | { open: true; mode: 'create'; product: null }
  | { open: true; mode: 'edit'; product: Product }

export const ProductsPage = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const canManage = user?.role === 'ADMIN'
  const [modal, setModal] = useState<ModalState>({ mode: 'create', open: false, product: null })
  const [productToDeactivate, setProductToDeactivate] = useState<Product | null>(null)
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)
  const { categories } = useCategories()
  const { suppliers } = useSuppliers({ active: true, size: 50 })
  const {
    error,
    filters,
    loading,
    page,
    products,
    refetch,
    setFilters,
    setPage,
    setSize,
    size,
    totalElements,
  } = useProducts()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deactivateProduct = useDeactivateProduct()
  const reactivateProduct = useReactivateProduct()

  const mutationError = useMemo(
    () => createProduct.error ?? updateProduct.error ?? deactivateProduct.error ?? reactivateProduct.error,
    [createProduct.error, deactivateProduct.error, reactivateProduct.error, updateProduct.error],
  )

  const mutationLoading = createProduct.loading || updateProduct.loading || deactivateProduct.loading || reactivateProduct.loading

  useEffect(() => {
    const supplierId = Number(searchParams.get('supplierId'))
    if (supplierId > 0) {
      setFilters({ ...filters, page: 0, supplierId })
    }
    // Query param should initialize the list once when arriving from suppliers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const notify = useCallback((text: string, severity: 'success' | 'error') => {
    setMessage({ severity, text })
  }, [])

  const { isSubmitting, onSave } = useFormHandler<ProductMutation, Product | null>({
    create: createProduct.createProduct,
    update: updateProduct.updateProduct,
    entityLabel: 'Producto',
    getId: () => (modal.mode === 'edit' ? modal.product.id : null),
    notify,
    onSuccess: async () => {
      setModal({ mode: 'create', open: false, product: null })
      await refetch()
    },
  })

  const handleDeactivate = async () => {
    if (!productToDeactivate) {
      return
    }

    const success = await deactivateProduct.deactivateProduct(productToDeactivate.id)

    if (success) {
      setMessage({ severity: 'success', text: 'Producto desactivado' })
      setProductToDeactivate(null)
      await refetch()
    }
  }

  const handleReactivate = async (product: Product) => {
    const success = await reactivateProduct.reactivateProduct(product.id)

    if (success) {
      setMessage({ severity: 'success', text: 'Producto reactivado' })
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
              onChange={(event) => setFilters({ ...filters, page: 0, search: event.target.value })}
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
	                    page: 0,
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

            <FormControl size="small" sx={{ minWidth: { xs: '100%', lg: 220 } }}>
              <InputLabel>Proveedor</InputLabel>
	              <Select
	                label="Proveedor"
	                onChange={(event) =>
	                  setFilters({
	                    ...filters,
	                    page: 0,
	                    supplierId: Number(event.target.value) || null,
	                  })
	                }
                value={filters.supplierId ?? 0}
              >
                <MenuItem value={0}>Todos</MenuItem>
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: '100%', lg: 160 } }}>
              <InputLabel>Estado</InputLabel>
              <Select
                label="Estado"
                onChange={(event) => {
                  const value = String(event.target.value)
                  setFilters({
                    ...filters,
                    active: value === 'all' ? null : value === 'active',
                    page: 0,
                  })
                }}
                value={filters.active === null ? 'all' : filters.active === false ? 'inactive' : 'active'}
              >
                <MenuItem value="active">Activos</MenuItem>
                <MenuItem value="inactive">Inactivos</MenuItem>
                <MenuItem value="all">Todos</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
	                <Checkbox
	                  checked={Boolean(filters.lowStock)}
	                  onChange={(event) =>
	                    setFilters({ ...filters, page: 0, lowStock: event.target.checked || undefined })
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
	              onReactivate={handleReactivate}
	              products={products}
	            />
	          )}
	          <TablePagination
	            component="div"
	            count={totalElements}
	            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
	            labelRowsPerPage="Filas por pagina"
	            onPageChange={(_event, nextPage) => setPage(nextPage)}
	            onRowsPerPageChange={(event) => setSize(Number(event.target.value))}
	            page={page}
	            rowsPerPage={size}
	            rowsPerPageOptions={[10, 20, 50]}
	          />
	        </Stack>
	      </DataGridShell>

      <ProductModal
        categories={categories}
        suppliers={suppliers}
        initialData={modal.product}
        loading={mutationLoading || isSubmitting}
        mode={modal.mode}
        onClose={() => setModal({ mode: 'create', open: false, product: null })}
        onSubmit={onSave}
        open={modal.open}
      />

      <ConfirmDialog
        confirmText="Desactivar"
        loading={deactivateProduct.loading}
        message={`El producto "${productToDeactivate?.name ?? ''}" dejara de estar disponible, pero no se eliminara ni perdera su historial.`}
        onCancel={() => setProductToDeactivate(null)}
        onConfirm={handleDeactivate}
        open={Boolean(productToDeactivate)}
        title="Desactivar producto"
      />

      <Snackbar autoHideDuration={3000} onClose={() => setMessage(null)} open={Boolean(message)}>
        <Alert
          onClose={() => setMessage(null)}
          severity={message?.severity ?? 'success'}
          variant="filled"
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
