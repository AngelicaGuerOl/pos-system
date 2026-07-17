import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ROUTE_PATHS } from '../../../../../shared/routes/routePaths'
import { DataGridShell } from '../../../../../shared/ui/components/DataGridShell'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '../../../../../shared/utils/formatters'
import { useSupplierEntryDetails } from '../hooks/useSupplierEntryDetails'

const unknownCost = 'No registrado en el archivo original.'

type SummaryMetricProps = {
  label: string
  value: ReactNode
}

const SummaryMetric = ({ label, value }: SummaryMetricProps) => (
  <Box
    sx={{
      border: 1,
      borderColor: 'divider',
      borderRadius: 1,
      flex: 1,
      minWidth: { sm: 160 },
      px: 2,
      py: 1.25,
    }}
  >
    <Typography color="text.secondary" variant="body2">
      {label}
    </Typography>
    <Typography sx={{ fontWeight: 800, mt: 0.25 }} variant="h6">
      {value}
    </Typography>
  </Box>
)

const UnknownCost = () => (
  <Tooltip title={unknownCost}>
    <span>—</span>
  </Tooltip>
)

const CostValue = ({ known, value }: { known: boolean; value: number }) => (known ? formatCurrency(value) : <UnknownCost />)

export const SupplierEntryDetailsPage = () => {
  const entryId = Number(useParams().entryId)
  const navigate = useNavigate()
  const { entry, error, loading } = useSupplierEntryDetails(Number.isFinite(entryId) ? entryId : undefined)
  const summary = useMemo(() => {
    if (!entry) {
      return {
        allCostsUnknown: false,
        hasKnownCost: false,
        productsCount: 0,
        totalQuantity: 0,
      }
    }

    return {
      allCostsUnknown: entry.items.length > 0 && entry.items.every((item) => !item.costKnown),
      hasKnownCost: entry.items.some((item) => item.costKnown),
      productsCount: entry.items.length,
      totalQuantity: entry.items.reduce((total, item) => total + item.quantity, 0),
    }
  }, [entry])

  return (
    <Stack spacing={3}>
      <PageHeader
        actionLabel="Volver al historial de entradas"
        onAction={() => navigate(ROUTE_PATHS.supplierEntries)}
        subtitle="Consulta los productos y totales de la mercancía recibida."
        title="Detalle de entrada"
      />
      <DataGridShell loading={loading}>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}
          {entry ? (
            <>
              <Stack spacing={0.75}>
                <Typography sx={{ fontWeight: 800 }} variant="h5">
                  {entry.supplierName}
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}
                >
                  <Typography color="text.secondary">
                    {formatDate(entry.entryDate)} · Registrado por {entry.registeredByUsername}
                  </Typography>
                  {entry.historicalImport ? <Chip color="info" label="Importado" size="small" /> : null}
                </Stack>
              </Stack>

              {!entry.historicalImport && entry.notes ? (
                <Typography color="text.secondary">Observaciones: {entry.notes}</Typography>
              ) : null}

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <SummaryMetric label="Productos" value={formatNumber(summary.productsCount)} />
                <SummaryMetric label="Cantidad total" value={formatNumber(summary.totalQuantity)} />
                <SummaryMetric
                  label="Total a costo"
                  value={summary.hasKnownCost ? formatCurrency(entry.totalCost) : <UnknownCost />}
                />
                <SummaryMetric label="Valor a precio de venta" value={formatCurrency(entry.totalSaleValue)} />
              </Stack>

              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 800 }} variant="h6">
                  Productos recibidos
                </Typography>
                {summary.allCostsUnknown ? (
                  <Typography color="text.secondary" variant="body2">
                    Los costos de esta entrada no estaban registrados en el archivo original.
                  </Typography>
                ) : null}
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 760 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell align="right">Cantidad</TableCell>
                        <TableCell align="right">Costo unitario</TableCell>
                        <TableCell align="right">Precio de venta</TableCell>
                        <TableCell align="right">Total a costo</TableCell>
                        <TableCell align="right">Valor a precio de venta</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entry.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell align="right">{formatNumber(item.quantity)}</TableCell>
                          <TableCell align="right">
                            <CostValue known={item.costKnown} value={item.unitCost} />
                          </TableCell>
                          <TableCell align="right">{formatCurrency(item.salePrice)}</TableCell>
                          <TableCell align="right">
                            <CostValue known={item.costKnown} value={item.costSubtotal} />
                          </TableCell>
                          <TableCell align="right">{formatCurrency(item.saleValueSubtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Stack>

              {entry.historicalImport ? (
                <Accordion disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                    <Typography sx={{ fontWeight: 800 }}>Información de importación</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      <Typography>
                        <strong>Archivo:</strong> {entry.sourceFile ?? '—'}
                      </Typography>
                      <Typography>
                        <strong>Hoja:</strong> {entry.sourceSheet ?? '—'}
                      </Typography>
                      <Typography>
                        <strong>Sección o descripción de origen:</strong> {entry.notes ?? '—'}
                      </Typography>
                      <Typography>
                        <strong>Fecha de importación:</strong> {formatDateTime(entry.createdAt)}
                      </Typography>
                      <Typography>
                        <strong>Usuario que realizó la importación:</strong> {entry.registeredByUsername || '—'}
                      </Typography>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ) : null}
            </>
          ) : null}
        </Stack>
      </DataGridShell>
    </Stack>
  )
}
