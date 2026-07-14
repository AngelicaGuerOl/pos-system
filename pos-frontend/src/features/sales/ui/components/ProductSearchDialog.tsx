import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { EmptyState } from '../../../../shared/ui/components/EmptyState'
import { formatCurrency, formatNumber } from '../../../../shared/utils/formatters'
import { PRODUCT_UNIT_LABELS, type Product } from '../../../catalog/products'
import { useProductLookup } from '../hooks/useProductLookup'

const SEARCH_DELAY_MS = 300

type ProductSearchDialogProps = {
  open: boolean
  onClose: () => void
  onAddProduct: (product: Product) => void
}

export const ProductSearchDialog = ({
  open,
  onAddProduct,
  onClose,
}: ProductSearchDialogProps) => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [products, setProducts] = useState<Product[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const { error, loading, searchProducts } = useProductLookup()

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        const result = await searchProducts({
          page,
          search: search.trim() || undefined,
          size,
          sort: 'name,asc',
        })

        if (result) {
          setProducts(result.content)
          setTotalElements(result.totalElements)
        }
      })()
    }, SEARCH_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [open, page, search, searchProducts, size])

  const handleAdd = (product: Product) => {
    onAddProduct(product)
    onClose()
  }

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle>Buscar producto</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label="Buscar por nombre o código"
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
            }}
            placeholder="Nombre o código de barras"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: loading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={18} />
                  </InputAdornment>
                ) : null,
              },
            }}
            value={search}
          />

          {error ? <Alert severity="error">{error.message}</Alert> : null}

          <Stack divider={<Divider />} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
            {!loading && products.length === 0 ? (
              <EmptyState
                message="Intenta con otro nombre o codigo de barras."
                title="Sin resultados"
              />
            ) : (
              products.map((product) => {
                const canAdd = product.active && product.currentStock > 0

                return (
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    key={product.id}
                    spacing={2}
                    sx={{
                      alignItems: { xs: 'stretch', md: 'center' },
                      p: 2,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 800 }}>
                        {product.name}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontFamily: 'monospace' }} variant="body2">
                        {product.barcode}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
                        <Chip label={PRODUCT_UNIT_LABELS[product.unit]} size="small" />
                        {product.categoryName ? <Chip label={product.categoryName} size="small" /> : null}
                        {!product.active ? <Chip color="warning" label="Inactivo" size="small" /> : null}
                      </Stack>
                    </Box>

                    <Box sx={{ minWidth: 120 }}>
                      <Typography color="text.secondary" variant="caption">
                        Precio
                      </Typography>
                      <Typography sx={{ fontWeight: 800 }}>
                        {formatCurrency(product.salePrice)}
                      </Typography>
                    </Box>

                    <Box sx={{ minWidth: 120 }}>
                      <Typography color="text.secondary" variant="caption">
                        Stock
                      </Typography>
                      <Typography sx={{ fontWeight: 800 }}>
                        {formatNumber(product.currentStock)}
                      </Typography>
                    </Box>

                    <Button
                      disabled={!canAdd}
                      onClick={() => handleAdd(product)}
                      startIcon={<AddShoppingCartRoundedIcon />}
                      variant="contained"
                    >
                      Agregar
                    </Button>
                  </Stack>
                )
              })
            )}
          </Stack>

          <TablePagination
            component="div"
            count={totalElements}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            labelRowsPerPage="Filas por pagina"
            onPageChange={(_event, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={(event) => {
              setSize(Number(event.target.value))
              setPage(0)
            }}
            page={page}
            rowsPerPage={size}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
