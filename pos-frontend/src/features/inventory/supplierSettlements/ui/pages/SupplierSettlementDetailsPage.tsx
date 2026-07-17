import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataGridShell } from '../../../../../shared/ui/components/DataGridShell'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
import { ROUTE_PATHS } from '../../../../../shared/routes/routePaths'
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '../../../../../shared/utils/formatters'
import { PRODUCT_UNIT_LABELS } from '../../../../catalog/products/domain/entities/Product'
import { useExportSupplierSettlement } from '../hooks/useExportSupplierSettlement'
import { useSupplierSettlement } from '../hooks/useSupplierSettlement'

export const SupplierSettlementDetailsPage = () => {
  const navigate = useNavigate()
  const settlementId = Number(useParams().settlementId)
  const { error, loading, settlement } = useSupplierSettlement(Number.isFinite(settlementId) ? settlementId : undefined)
  const exportSettlement = useExportSupplierSettlement()
  const [showAllProducts, setShowAllProducts] = useState(false)
  const [showFullInfo, setShowFullInfo] = useState(false)
  const unknownValue = 'No se encontraba registrado en el archivo original.'
  const nullableCurrency = (value: number | null) => value === null ? '—' : formatCurrency(value)
  const visibleItems = useMemo(() => settlement?.items.filter((item) => {
    if (showAllProducts) return true
    return item.openingQuantity !== 0
      || item.receivedQuantity !== 0
      || (item.closingQuantity ?? 0) !== 0
      || item.quantityToJustify !== 0
      || item.expectedAmount !== 0
  }) ?? [], [settlement, showAllProducts])
  const discrepancyCount = settlement?.items.filter((item) => item.hasDiscrepancy).length ?? 0

  return (
    <Stack spacing={3}>
      <PageHeader subtitle={settlement ? `${formatDate(settlement.periodStart)} al ${formatDate(settlement.periodEnd)}` : 'Detalle del corte por proveedor.'} title={settlement ? `Corte de ${settlement.supplierName}` : 'Detalle de corte'} />
      <DataGridShell loading={loading}>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}
          {exportSettlement.error ? <Alert severity="error">{exportSettlement.error.message}</Alert> : null}
          {settlement ? (
            <>
	              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
	                <Chip color={settlement.status === 'FINALIZED' ? 'success' : 'warning'} label={settlement.status === 'FINALIZED' ? 'Finalizado' : 'Borrador'} />
	                <Chip color={settlement.historicalImport ? 'info' : 'default'} label={settlement.historicalImport ? 'Origen: Importado' : 'Origen: Sistema'} />
	                {discrepancyCount > 0 ? <Chip color="error" label={`${discrepancyCount} inconsistencias`} /> : null}
	              </Stack>
	              {settlement.historicalImport ? (
	                <Alert severity="info">
	                  <strong>Informacion de importacion</strong><br />
	                  Archivo: {settlement.sourceFile ?? '—'} · Hoja: {settlement.sourceSheet ?? '—'} · Importado por: {settlement.createdByUsername} · Fecha de importacion: {formatDateTime(settlement.createdAt)}
	                </Alert>
	              ) : (
	                <Alert severity="info">
	                  Creado por: {settlement.createdByUsername} · Finalizado por: {settlement.finalizedByUsername ?? '—'} · Creado: {formatDateTime(settlement.createdAt)} · Finalizado: {settlement.finalizedAt ? formatDateTime(settlement.finalizedAt) : '—'}
	                </Alert>
	              )}
	              <Box sx={{ border: 1, borderColor: 'divider', p: 2 }}>
	                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, flexWrap: 'wrap' }}>
	                  <Typography><strong>Inventario inicial</strong><br />{formatCurrency(settlement.openingInventoryValue)}</Typography>
	                  <Typography variant="h5">+</Typography>
	                  <Typography><strong>Mercancia recibida</strong><br />{formatCurrency(settlement.entriesSaleValue)}</Typography>
	                  <Typography variant="h5">−</Typography>
	                  <Typography><strong>Inventario final</strong><br />{formatCurrency(settlement.closingInventoryValue)}</Typography>
	                  <Typography variant="h5">=</Typography>
	                  <Typography><strong>Importe por justificar</strong><br />{formatCurrency(settlement.expectedAmount)}</Typography>
	                </Stack>
	              </Box>
	              <Stack spacing={0.5}>
	                <Typography>Total disponible: {formatCurrency(settlement.availableInventoryValue)}</Typography>
	                <Typography>Importe entregado: {settlement.deliveredAmount === null ? <Tooltip title={unknownValue}><span>—</span></Tooltip> : nullableCurrency(settlement.deliveredAmount)}</Typography>
	                <Typography>Diferencia: {settlement.differenceAmount === null ? <Tooltip title={unknownValue}><span>—</span></Tooltip> : nullableCurrency(settlement.differenceAmount)}</Typography>
	                <Typography>Observaciones: {settlement.notes ?? '—'}</Typography>
	              </Stack>
	              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
	                <FormControlLabel
	                  control={<Checkbox checked={!showAllProducts} onChange={(event) => setShowAllProducts(!event.target.checked)} />}
	                  label="Ocultar productos sin existencia ni movimientos"
	                />
	                <FormControlLabel
	                  control={<Checkbox checked={showFullInfo} onChange={(event) => setShowFullInfo(event.target.checked)} />}
	                  label="Ver informacion completa"
	                />
	              </Stack>
	              <Table size="small">
                <TableHead>
                  <TableRow>
	                    <TableCell>Producto historico</TableCell>
	                    {showFullInfo ? <TableCell>Codigo</TableCell> : null}
	                    {showFullInfo ? <TableCell>Unidad</TableCell> : null}
                    <TableCell align="right">Inicial</TableCell>
                    <TableCell align="right">Entradas</TableCell>
                    <TableCell align="right">Disponible</TableCell>
                    <TableCell align="right">Final</TableCell>
                    <TableCell align="right">Cantidad por justificar</TableCell>
                    <TableCell align="right">Precio utilizado</TableCell>
                    <TableCell align="right">Importe por justificar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
	                  {visibleItems.map((item) => {
	                    const negative = item.quantityToJustify < 0 || item.expectedAmount < 0
	                    return (
	                    <TableRow key={item.id} sx={{ bgcolor: item.hasDiscrepancy || negative ? 'error.50' : undefined }}>
	                      <TableCell>{item.productNameSnapshot}</TableCell>
	                      {showFullInfo ? <TableCell>{item.barcodeSnapshot}</TableCell> : null}
	                      {showFullInfo ? <TableCell>{PRODUCT_UNIT_LABELS[item.unitSnapshot]}</TableCell> : null}
                      <TableCell align="right">{formatNumber(item.openingQuantity)}</TableCell>
                      <TableCell align="right">{formatNumber(item.receivedQuantity)}</TableCell>
                      <TableCell align="right">{formatNumber(item.availableQuantity)}</TableCell>
                      <TableCell align="right">{formatNumber(item.closingQuantity ?? 0)}</TableCell>
	                      <TableCell align="right">
	                        {negative ? <Tooltip title="La cantidad o importe por justificar es negativo. Revisa la captura historica."><span>{formatNumber(item.quantityToJustify)}</span></Tooltip> : formatNumber(item.quantityToJustify)}
	                      </TableCell>
	                      <TableCell align="right">{formatCurrency(item.closingSalePrice)}</TableCell>
	                      <TableCell align="right">
	                        {item.hasDiscrepancy ? <Tooltip title="La existencia final registrada es mayor que la mercancia disponible. Revisa este producto."><span>{formatCurrency(item.expectedAmount)}</span></Tooltip> : formatCurrency(item.expectedAmount)}
	                      </TableCell>
	                    </TableRow>
	                  )})}
                </TableBody>
              </Table>
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
                {settlement.status === 'DRAFT' && !settlement.historicalImport ? (
                  <Button onClick={() => navigate(ROUTE_PATHS.supplierSettlementEdit.replace(':settlementId', String(settlement.id)))} startIcon={<EditRoundedIcon />}>Continuar edicion</Button>
                ) : null}
                {settlement.status === 'FINALIZED' ? (
                  <Button disabled={exportSettlement.loadingId === settlement.id} onClick={() => void exportSettlement.exportSettlement(settlement.id)} startIcon={<DownloadRoundedIcon />} variant="contained">
                    {exportSettlement.loadingId === settlement.id ? 'Exportando...' : 'Exportar Excel'}
                  </Button>
                ) : null}
              </Stack>
            </>
          ) : null}
        </Stack>
      </DataGridShell>
    </Stack>
  )
}
