import EditRoundedIcon from '@mui/icons-material/EditRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  type AlertColor,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataGridShell } from '../../../../../shared/ui/components/DataGridShell'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
import { ROUTE_PATHS } from '../../../../../shared/routes/routePaths'
import { formatCurrency, formatDate, formatNumber } from '../../../../../shared/utils/formatters'
import { PRODUCT_UNIT_LABELS } from '../../../../catalog/products/domain/entities/Product'
import { useFinalizeSupplierSettlement } from '../hooks/useFinalizeSupplierSettlement'
import { useSupplierSettlement } from '../hooks/useSupplierSettlement'
import { useUpdateSupplierSettlement } from '../hooks/useUpdateSupplierSettlement'

type DraftLine = { closingQuantity: string; closingSalePrice: string }
const isDecimalText = (value: string): boolean => /^\d*(?:\.\d{0,2})?$/.test(value)
const toNumber = (value: string): number => Number(value || '0')

export const SupplierSettlementEditPage = () => {
  const navigate = useNavigate()
  const settlementId = Number(useParams().settlementId)
  const settlementState = useSupplierSettlement(Number.isFinite(settlementId) ? settlementId : undefined)
  const updateSettlement = useUpdateSupplierSettlement()
  const finalizeSettlement = useFinalizeSupplierSettlement()
  const [lines, setLines] = useState<Record<number, DraftLine>>({})
  const [deliveredAmount, setDeliveredAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')
  const [showAllProducts, setShowAllProducts] = useState(false)
  const [editablePrices, setEditablePrices] = useState<Record<number, boolean>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)

  useEffect(() => {
    if (!settlementState.settlement) return
    setDeliveredAmount(settlementState.settlement.deliveredAmount === null ? '' : String(settlementState.settlement.deliveredAmount))
    setNotes(settlementState.settlement.notes ?? '')
    setLines(Object.fromEntries(settlementState.settlement.items.map((item) => [
      item.productId,
      {
        closingQuantity: item.closingQuantity === null ? '' : String(item.closingQuantity),
        closingSalePrice: String(item.closingSalePrice),
      },
    ])))
  }, [settlementState.settlement])

  const preview = useMemo(() => {
    const closing = settlementState.settlement?.items.reduce((sum, item) => {
      const line = lines[item.productId]
      return sum + toNumber(line?.closingQuantity ?? '') * toNumber(line?.closingSalePrice ?? '')
    }, 0) ?? 0
    const expected = (settlementState.settlement?.openingInventoryValue ?? 0) + (settlementState.settlement?.entriesSaleValue ?? 0) - closing
    return { closing, difference: deliveredAmount ? toNumber(deliveredAmount) - expected : null, expected }
  }, [deliveredAmount, lines, settlementState.settlement])

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return settlementState.settlement?.items.filter((item) => {
      const hasMovement = item.openingQuantity > 0 || item.receivedQuantity > 0 || item.availableQuantity > 0
      const matchesSearch = !normalizedSearch
        || item.productNameSnapshot.toLowerCase().includes(normalizedSearch)
        || (item.barcodeSnapshot ?? '').toLowerCase().includes(normalizedSearch)
      return (showAllProducts || hasMovement) && matchesSearch
    }) ?? []
  }, [search, settlementState.settlement, showAllProducts])

  const countedProducts = useMemo(
    () => settlementState.settlement?.items.filter((item) => lines[item.productId]?.closingQuantity !== '').length ?? 0,
    [lines, settlementState.settlement],
  )

  const requestPayload = () => ({
    deliveredAmount: deliveredAmount === '' ? null : toNumber(deliveredAmount),
    notes,
    items: settlementState.settlement?.items.map((item) => ({
      productId: item.productId,
      closingQuantity: toNumber(lines[item.productId]?.closingQuantity ?? ''),
      closingSalePrice: toNumber(lines[item.productId]?.closingSalePrice ?? ''),
    })) ?? [],
  })

  const handleSave = async () => {
    const saved = await updateSettlement.updateSettlement(settlementId, requestPayload())
    if (saved) {
      settlementState.setSettlement(saved)
      setMessage({ severity: 'success', text: 'Borrador guardado' })
    }
  }

  const handleFinalize = async () => {
    const saved = await updateSettlement.updateSettlement(settlementId, requestPayload())
    if (!saved) return
    settlementState.setSettlement(saved)
    const finalized = await finalizeSettlement.finalizeSettlement(settlementId)
    if (finalized) {
      settlementState.setSettlement(finalized)
      setConfirmOpen(false)
      setMessage({ severity: 'success', text: 'Corte finalizado' })
      navigate(ROUTE_PATHS.supplierSettlementDetails.replace(':settlementId', String(finalized.id)))
    }
  }

  const settlement = settlementState.settlement

  return (
    <Stack spacing={3}>
      <PageHeader subtitle="Captura el inventario final contado y el importe entregado." title="Capturar corte por proveedor" />
      <DataGridShell loading={settlementState.loading || updateSettlement.loading || finalizeSettlement.loading}>
        <Stack spacing={2}>
          {settlementState.error ? <Alert severity="error">{settlementState.error.message}</Alert> : null}
          {updateSettlement.error ? <Alert severity="error">{updateSettlement.error.message}</Alert> : null}
          {finalizeSettlement.error ? <Alert severity="error">{finalizeSettlement.error.message}</Alert> : null}
          {settlement ? (
            <>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip label={`Proveedor: ${settlement.supplierName}`} />
                <Chip label={`Periodo: ${formatDate(settlement.periodStart)} a ${formatDate(settlement.periodEnd)}`} />
                <Chip color="warning" label="Borrador" />
              </Stack>
              <Alert severity="info">Inventario inicial + mercancia recibida - inventario final = importe por justificar.</Alert>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Buscar producto"
                  onChange={(event) => setSearch(event.target.value)}
                  size="small"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
                  value={search}
                />
                <FormControlLabel
                  control={<Checkbox checked={showAllProducts} onChange={(event) => setShowAllProducts(event.target.checked)} />}
                  label="Mostrar todos los productos del proveedor"
                />
              </Stack>
              <Typography color="text.secondary">Productos contados: {countedProducts} de {settlement.items.length}</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Codigo</TableCell>
                    <TableCell>Unidad</TableCell>
                    <TableCell align="right">Existencia inicial</TableCell>
                    <TableCell align="right">Entradas</TableCell>
                    <TableCell align="right">Disponible</TableCell>
                    <TableCell>Inventario final contado</TableCell>
	                    <TableCell>Precio para este corte</TableCell>
                    <TableCell align="right">Valor final</TableCell>
                    <TableCell align="right">Importe por justificar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
	                  {visibleItems.map((item) => {
                    const line = lines[item.productId] ?? { closingQuantity: '', closingSalePrice: String(item.closingSalePrice) }
                    const closingValue = toNumber(line.closingQuantity) * toNumber(line.closingSalePrice)
                    const expected = item.openingValue + item.receivedSaleValue - closingValue
	                    const inconsistent = toNumber(line.closingQuantity) > item.availableQuantity
	                    return (
	                      <TableRow key={item.id} sx={{ bgcolor: inconsistent ? 'error.50' : undefined }}>
                        <TableCell>{item.productNameSnapshot}</TableCell>
                        <TableCell>{item.barcodeSnapshot}</TableCell>
                        <TableCell>{PRODUCT_UNIT_LABELS[item.unitSnapshot]}</TableCell>
                        <TableCell align="right">{formatNumber(item.openingQuantity)}</TableCell>
                        <TableCell align="right">{formatNumber(item.receivedQuantity)}</TableCell>
                        <TableCell align="right">{formatNumber(item.availableQuantity)}</TableCell>
	                        <TableCell>
	                          <TextField
	                            disabled={settlement.status !== 'DRAFT'}
	                            label="Inventario final contado"
	                            slotProps={{ htmlInput: { inputMode: 'decimal' } }}
	                            onChange={(event) => {
	                              if (isDecimalText(event.target.value)) {
	                                setLines((current) => ({ ...current, [item.productId]: { ...line, closingQuantity: event.target.value } }))
	                              }
	                            }}
	                            size="small"
	                            value={line.closingQuantity}
	                          />
	                          {inconsistent ? <Typography color="error" variant="caption">La existencia final registrada es mayor que la mercancia disponible. Revisa este producto.</Typography> : null}
	                        </TableCell>
	                        <TableCell>
	                          <Stack direction="row" spacing={1}>
	                            <TextField
	                              disabled={settlement.status !== 'DRAFT' || !editablePrices[item.productId]}
	                              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
	                              onChange={(event) => {
	                                if (isDecimalText(event.target.value)) {
	                                  setLines((current) => ({ ...current, [item.productId]: { ...line, closingSalePrice: event.target.value } }))
	                                }
	                              }}
	                              size="small"
	                              value={line.closingSalePrice}
	                            />
	                            <Button
	                              disabled={settlement.status !== 'DRAFT'}
	                              onClick={() => setEditablePrices((current) => ({ ...current, [item.productId]: true }))}
	                              size="small"
	                              startIcon={<EditRoundedIcon />}
	                            >
	                              Editar precio
	                            </Button>
	                          </Stack>
	                        </TableCell>
                        <TableCell align="right">{formatCurrency(closingValue)}</TableCell>
                        <TableCell align="right">{formatCurrency(expected)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="Importe entregado" onChange={(event) => isDecimalText(event.target.value) && setDeliveredAmount(event.target.value)} value={deliveredAmount} />
                <TextField fullWidth label="Observaciones" onChange={(event) => setNotes(event.target.value)} value={notes} />
              </Stack>
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
	                <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
	                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
	                    <Typography><strong>Inicial:</strong> {formatCurrency(settlement.openingInventoryValue)}</Typography>
	                    <Typography><strong>Mercancia:</strong> {formatCurrency(settlement.entriesSaleValue)}</Typography>
	                    <Typography><strong>Disponible:</strong> {formatCurrency(settlement.availableInventoryValue)}</Typography>
	                    <Typography><strong>Final:</strong> {formatCurrency(preview.closing)}</Typography>
	                    <Typography><strong>Por justificar:</strong> {formatCurrency(preview.expected)}</Typography>
	                    <Typography><strong>Contados:</strong> {countedProducts} de {settlement.items.length}</Typography>
	                    <Typography><strong>Entregado:</strong> {deliveredAmount ? formatCurrency(toNumber(deliveredAmount)) : '—'}</Typography>
	                    <Typography color={(preview.difference ?? 0) < 0 ? 'error' : 'success.main'}><strong>Diferencia:</strong> {preview.difference === null ? '—' : formatCurrency(preview.difference)}</Typography>
	                  </Stack>
	                  <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
	                    <Button onClick={() => navigate(ROUTE_PATHS.supplierSettlements)}>Volver</Button>
	                    <Button disabled={updateSettlement.loading} onClick={handleSave} startIcon={<SaveRoundedIcon />}>Guardar borrador</Button>
	                    <Button disabled={finalizeSettlement.loading} onClick={() => setConfirmOpen(true)} startIcon={<TaskAltRoundedIcon />} variant="contained">Finalizar corte</Button>
	                  </Stack>
	                </Stack>
	              </Box>
            </>
          ) : null}
        </Stack>
      </DataGridShell>
      <Dialog onClose={finalizeSettlement.loading ? undefined : () => setConfirmOpen(false)} open={confirmOpen}>
        <DialogTitle>Finalizar corte</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <Typography>Al finalizar, el corte quedara bloqueado y las existencias se actualizaran con el inventario contado.</Typography>
            <Typography>Importe por justificar: {formatCurrency(preview.expected)}</Typography>
            <Typography>Importe entregado: {deliveredAmount ? formatCurrency(toNumber(deliveredAmount)) : '-'}</Typography>
            <Typography>Diferencia: {preview.difference === null ? '-' : formatCurrency(preview.difference)}</Typography>
            <Typography>Productos: {settlement?.items.length ?? 0}</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={finalizeSettlement.loading} onClick={() => setConfirmOpen(false)}>Volver</Button>
          <Button disabled={finalizeSettlement.loading} onClick={handleFinalize} variant="contained">
            {finalizeSettlement.loading ? 'Finalizando...' : 'Finalizar corte'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar autoHideDuration={3000} onClose={() => setMessage(null)} open={Boolean(message)}>
        <Alert onClose={() => setMessage(null)} severity={message?.severity ?? 'success'} variant="filled">{message?.text}</Alert>
      </Snackbar>
    </Stack>
  )
}
