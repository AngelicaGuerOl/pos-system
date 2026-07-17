import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
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
import { useNavigate } from 'react-router-dom'
import { DataGridShell } from '../../../../../shared/ui/components/DataGridShell'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
import { ROUTE_PATHS } from '../../../../../shared/routes/routePaths'
import { formatCurrency, formatNumber } from '../../../../../shared/utils/formatters'
import { useSuppliers } from '../../../../catalog/suppliers/ui/hooks/useSuppliers'
import { useSupplierProducts } from '../../../../catalog/suppliers/ui/hooks/useSupplierProducts'
import { PRODUCT_UNIT_LABELS } from '../../../../catalog/products/domain/entities/Product'
import { useCreateSupplierEntry } from '../hooks/useCreateSupplierEntry'

type EntryLine = {
  productId: number
  productName: string
  barcode: string
  unitLabel: string
  quantity: string
  unitCost: string
  salePrice: string
}

const isDecimalText = (value: string): boolean => /^\d*(?:\.\d{0,2})?$/.test(value)
const toNumber = (value: string): number => Number(value || '0')
const nullableCurrency = (value: number, known = true): string => known ? formatCurrency(value) : '—'

export const CreateSupplierEntryPage = () => {
  const navigate = useNavigate()
  const [supplierId, setSupplierId] = useState(0)
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<Record<number, EntryLine>>({})
  const [showIncludedOnly, setShowIncludedOnly] = useState(false)
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)
  const suppliersState = useSuppliers({ active: true, size: 50 })
  const productsState = useSupplierProducts(supplierId || undefined, { size: 20 })
  const createEntry = useCreateSupplierEntry()

  const includedLines = useMemo(
    () => Object.values(lines).filter((line) => toNumber(line.quantity) > 0),
    [lines],
  )
  const totals = useMemo(() => {
    return includedLines.reduce(
      (summary, line) => ({
        quantity: summary.quantity + toNumber(line.quantity),
        cost: summary.cost + toNumber(line.quantity) * toNumber(line.unitCost),
        sale: summary.sale + toNumber(line.quantity) * toNumber(line.salePrice),
      }),
      { cost: 0, quantity: 0, sale: 0 },
    )
  }, [includedLines])

  const updateLine = (line: EntryLine) => setLines((current) => ({ ...current, [line.productId]: line }))
  const visibleProducts = useMemo(
    () => productsState.products.filter((product) => !showIncludedOnly || toNumber(lines[product.id]?.quantity ?? '') > 0),
    [lines, productsState.products, showIncludedOnly],
  )

  const handleSupplierChange = (nextSupplierId: number) => {
    if (includedLines.length > 0 && !window.confirm('Cambiar proveedor limpiara los productos capturados.')) {
      return
    }
    setSupplierId(nextSupplierId)
    setLines({})
  }

  const handleSubmit = async () => {
    if (!supplierId || includedLines.length === 0 || createEntry.loading) {
      setMessage({ severity: 'error', text: 'Selecciona proveedor y al menos un producto con cantidad mayor que cero.' })
      return
    }
    const result = await createEntry.createEntry({
      supplierId,
      entryDate,
      notes,
      items: includedLines.map((line) => ({
        productId: line.productId,
        quantity: toNumber(line.quantity),
        unitCost: toNumber(line.unitCost),
        salePrice: toNumber(line.salePrice),
      })),
    })
    if (result) {
      setMessage({ severity: 'success', text: `Mercancia registrada. Total costo ${formatCurrency(result.totalCost)}.` })
      setLines({})
      navigate(ROUTE_PATHS.supplierEntryDetails.replace(':entryId', String(result.id)))
    }
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle="Registra los productos recibidos de un proveedor y actualiza sus existencias."
        title="Registrar mercancia"
      />
      <DataGridShell loading={productsState.loading || suppliersState.loading}>
        <Stack spacing={2}>
          {createEntry.error ? <Alert severity="error">{createEntry.error.message}</Alert> : null}
          {productsState.error ? <Alert severity="error">{productsState.error.message}</Alert> : null}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Fecha"
              onChange={(event) => setEntryDate(event.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 180 }}
              type="date"
              value={entryDate}
            />
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel>Proveedor</InputLabel>
              <Select label="Proveedor" onChange={(event) => handleSupplierChange(Number(event.target.value))} value={supplierId}>
                <MenuItem value={0}>Selecciona proveedor</MenuItem>
                {suppliersState.suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField fullWidth label="Notas" onChange={(event) => setNotes(event.target.value)} size="small" value={notes} />
          </Stack>
          {supplierId ? (
            <>
              <TextField
                label="Buscar producto"
                onChange={(event) => productsState.setFilters({ ...productsState.filters, page: 0, search: event.target.value })}
                size="small"
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
                value={productsState.filters.search ?? ''}
              />
              <FormControlLabel
                control={<Checkbox checked={showIncludedOnly} onChange={(event) => setShowIncludedOnly(event.target.checked)} />}
                label="Mostrar solo productos incluidos"
              />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Codigo</TableCell>
                    <TableCell>Unidad</TableCell>
                    <TableCell align="right">Existencia actual</TableCell>
                    <TableCell>Cantidad recibida</TableCell>
                    <TableCell>Costo unitario</TableCell>
                    <TableCell>Precio de venta</TableCell>
                    <TableCell align="right">Total costo</TableCell>
                    <TableCell align="right">Valor venta</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
	                  {visibleProducts.map((product) => {
	                    const line = lines[product.id] ?? {
	                      barcode: product.barcode,
	                      productId: product.id,
	                      productName: product.name,
	                      quantity: '',
	                      salePrice: String(product.salePrice),
	                      unitCost: product.costPriceKnown ? String(product.costPrice) : '',
	                      unitLabel: PRODUCT_UNIT_LABELS[product.unit],
	                    }
	                    const quantity = toNumber(line.quantity)
	                    const included = quantity > 0
	                    return (
	                      <TableRow key={product.id} sx={{ bgcolor: included ? 'success.50' : undefined }}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.barcode}</TableCell>
                        <TableCell>{PRODUCT_UNIT_LABELS[product.unit]}</TableCell>
                        <TableCell align="right">{formatNumber(product.currentStock)}</TableCell>
                        {(['quantity', 'unitCost', 'salePrice'] as const).map((field) => (
                          <TableCell key={field}>
                            <TextField
                              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                              onChange={(event) => {
                                if (isDecimalText(event.target.value)) {
                                  updateLine({ ...line, [field]: event.target.value })
                                }
                              }}
                              size="small"
                              value={line[field]}
                            />
                          </TableCell>
                        ))}
	                        <TableCell align="right">{nullableCurrency(quantity * toNumber(line.unitCost), product.costPriceKnown || line.unitCost !== '')}</TableCell>
	                        <TableCell align="right">{formatCurrency(quantity * toNumber(line.salePrice))}</TableCell>
	                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
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
            </>
          ) : (
            <Alert severity="info">Selecciona un proveedor activo para capturar productos.</Alert>
          )}
	          <Box>
	            <Typography sx={{ fontWeight: 800 }}>Productos incluidos: {includedLines.length}</Typography>
            <Typography color="text.secondary">
              Cantidad total {formatNumber(totals.quantity)} · Total costo {formatCurrency(totals.cost)} · Valor venta {formatCurrency(totals.sale)}
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {includedLines.map((line) => (
                <Stack key={line.productId} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <IconButton aria-label="Eliminar producto" onClick={() => setLines((current) => {
                    const next = { ...current }
                    delete next[line.productId]
                    return next
                  })} size="small">
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                  <Typography>{line.productName}: {formatNumber(toNumber(line.quantity))}</Typography>
                </Stack>
              ))}
            </Stack>
	          </Box>
	          <Box
	            sx={{
	              bgcolor: 'background.paper',
	              border: 1,
	              borderColor: 'divider',
	              bottom: 0,
	              boxShadow: 3,
	              mx: -2,
	              p: 2,
	              position: 'sticky',
	              zIndex: 2,
	            }}
	          >
	            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
	              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
	                <Typography><strong>Productos:</strong> {includedLines.length}</Typography>
	                <Typography><strong>Cantidad:</strong> {formatNumber(totals.quantity)}</Typography>
	                <Typography><strong>Total costo:</strong> {formatCurrency(totals.cost)}</Typography>
	                <Typography><strong>Valor venta:</strong> {formatCurrency(totals.sale)}</Typography>
	              </Stack>
	              <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
	                <Button onClick={() => navigate(ROUTE_PATHS.products)}>Ir a productos</Button>
	                <Button disabled={createEntry.loading} onClick={handleSubmit} startIcon={<SaveRoundedIcon />} variant="contained">
	                  Registrar mercancia
	                </Button>
	              </Stack>
	            </Stack>
	          </Box>
	        </Stack>
      </DataGridShell>
      <Snackbar autoHideDuration={3000} onClose={() => setMessage(null)} open={Boolean(message)}>
        <Alert onClose={() => setMessage(null)} severity={message?.severity ?? 'success'} variant="filled">{message?.text}</Alert>
      </Snackbar>
    </Stack>
  )
}
