import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Button,
  Chip,
  InputAdornment,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  type AlertColor,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DataGridShell } from '../../../../../shared/ui/components/DataGridShell'
import { EmptyState } from '../../../../../shared/ui/components/EmptyState'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
import { formatCurrency, formatDate, formatNumber } from '../../../../../shared/utils/formatters'
import { PRODUCT_UNIT_LABELS } from '../../../products/domain/entities/Product'
import type { SupplierInventoryBaselineItemMutation } from '../../domain/entities/Supplier'
import { useSupplierInventoryBaseline } from '../hooks/useSupplierInventoryBaseline'
import { useSupplierProducts } from '../hooks/useSupplierProducts'

type DraftLine = {
  quantity: string
  salePrice: string
}

const isDecimalText = (value: string): boolean => /^\d*(?:\.\d{0,2})?$/.test(value)
const toNumber = (value: string): number => Number(value || '0')

export const SupplierInventoryBaselinePage = () => {
  const supplierId = Number(useParams().supplierId)
  const [baselineDate, setBaselineDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [lines, setLines] = useState<Record<number, DraftLine>>({})
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)
  const baselineState = useSupplierInventoryBaseline(Number.isFinite(supplierId) ? supplierId : undefined)
  const productsState = useSupplierProducts(Number.isFinite(supplierId) ? supplierId : undefined, { size: 10 })

  const selectedItems = useMemo<SupplierInventoryBaselineItemMutation[]>(() => (
    Object.entries(lines)
      .map(([productId, line]) => ({
        productId: Number(productId),
        quantity: toNumber(line.quantity),
        salePrice: toNumber(line.salePrice),
      }))
      .filter((item) => item.quantity >= 0 && item.salePrice >= 0)
  ), [lines])

  const updateLine = (productId: number, patch: Partial<DraftLine>) => {
    setLines((current) => ({
      ...current,
      [productId]: {
        quantity: current[productId]?.quantity ?? '0',
        salePrice: current[productId]?.salePrice ?? '0',
        ...patch,
      },
    }))
  }

  const handleSave = async () => {
    if (selectedItems.length === 0) {
      setMessage({ severity: 'error', text: 'Debe existir al menos un producto.' })
      return
    }
    const created = await baselineState.createBaseline({ baselineDate, items: selectedItems })
    if (created) {
      setMessage({ severity: 'success', text: 'Inventario inicial registrado' })
      await productsState.refetch()
    }
  }

  if (baselineState.baseline) {
    return (
      <Stack spacing={3}>
        <PageHeader
          subtitle="Inventario inicial registrado. Esta informacion es historica y de solo lectura."
          title="Inventario inicial"
        />
        <DataGridShell loading={baselineState.loading} title={baselineState.baseline.supplierName}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip label={`Fecha: ${formatDate(baselineState.baseline.baselineDate)}`} />
              <Chip color="success" label={`Total: ${formatCurrency(baselineState.baseline.totalSaleValue)}`} />
              <Chip label={`Registrado por: ${baselineState.baseline.createdByUsername}`} />
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Cantidad inicial</TableCell>
                  <TableCell align="right">Precio de venta</TableCell>
                  <TableCell align="right">Valor de inventario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {baselineState.baseline.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell align="right">{formatNumber(item.quantity)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.salePriceSnapshot)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.inventoryValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        </DataGridShell>
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle="El inventario inicial solo puede registrarse una vez para este proveedor."
        title="Inventario inicial"
      />
      <DataGridShell loading={baselineState.loading || productsState.loading}>
        <Stack spacing={2}>
          {baselineState.error ? <Alert severity="error">{baselineState.error.message}</Alert> : null}
          {productsState.error ? <Alert severity="error">{productsState.error.message}</Alert> : null}
          {baselineState.notFound ? (
            <Alert severity="warning">El inventario inicial solo puede registrarse una vez para este proveedor.</Alert>
          ) : null}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Fecha del inventario inicial"
              onChange={(event) => setBaselineDate(event.target.value)}
              size="small"
              type="date"
              value={baselineDate}
            />
            <TextField
              label="Buscar producto"
              onChange={(event) => productsState.setFilters({ ...productsState.filters, page: 0, search: event.target.value })}
              size="small"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
              value={productsState.filters.search ?? ''}
            />
          </Stack>
          {productsState.products.length === 0 && !productsState.loading ? (
            <EmptyState message="Este proveedor no tiene productos asociados." title="Sin productos" />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Codigo</TableCell>
                  <TableCell>Unidad</TableCell>
                  <TableCell align="right">Existencia actual</TableCell>
                  <TableCell>Cantidad inicial</TableCell>
                  <TableCell>Precio de venta</TableCell>
                  <TableCell align="right">Valor de inventario</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productsState.products.map((product) => {
                  const line = lines[product.id] ?? { quantity: '0', salePrice: String(product.salePrice) }
                  const value = toNumber(line.quantity) * toNumber(line.salePrice)
                  return (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.barcode}</TableCell>
                      <TableCell>{PRODUCT_UNIT_LABELS[product.unit]}</TableCell>
                      <TableCell align="right">{formatNumber(product.currentStock)}</TableCell>
                      <TableCell>
                        <TextField
                          slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                          onChange={(event) => {
                            if (isDecimalText(event.target.value)) updateLine(product.id, { quantity: event.target.value })
                          }}
                          size="small"
                          value={line.quantity}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                          onChange={(event) => {
                            if (isDecimalText(event.target.value)) updateLine(product.id, { salePrice: event.target.value })
                          }}
                          size="small"
                          value={line.salePrice}
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(value)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          <TablePagination
            component="div"
            count={productsState.totalElements}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            labelRowsPerPage="Filas por pagina"
            onPageChange={(_event, nextPage) => productsState.setPage(nextPage)}
            onRowsPerPageChange={(event) => productsState.setSize(Number(event.target.value))}
            page={productsState.page}
            rowsPerPage={productsState.size}
            rowsPerPageOptions={[10, 20, 50]}
          />
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">
              Vista previa: cantidad x precio de venta. El backend calcula los importes definitivos.
            </Typography>
            <Button
              disabled={baselineState.saving}
              onClick={handleSave}
              startIcon={<SaveRoundedIcon />}
              variant="contained"
            >
              Guardar inventario inicial
            </Button>
          </Stack>
        </Stack>
      </DataGridShell>
      <Snackbar autoHideDuration={3000} onClose={() => setMessage(null)} open={Boolean(message)}>
        <Alert onClose={() => setMessage(null)} severity={message?.severity ?? 'success'} variant="filled">
          {message?.text}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
