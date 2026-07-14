import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Alert,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { formatCurrency, formatDateTime, formatNumber } from '../../../../shared/utils/formatters'
import { PRODUCT_UNIT_LABELS } from '../../../catalog/products'
import {
  SALE_STATUS_LABELS,
  SALE_TYPE_LABELS,
  type Sale,
  type SaleItem,
} from '../../domain/entities/Sale'
import { RECEIVABLE_STATUS_LABELS } from '../../../receivables'

type SaleDetailDrawerProps = {
  errorMessage?: string
  loading: boolean
  onClose: () => void
  open: boolean
  sale: Sale | null
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Stack spacing={0.25}>
    <Typography color="text.secondary" variant="caption">
      {label}
    </Typography>
    <Typography sx={{ fontWeight: 800 }}>{value}</Typography>
  </Stack>
)

const SaleItemRow = ({ item }: { item: SaleItem }) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    spacing={1.5}
    sx={{
      alignItems: { xs: 'stretch', sm: 'center' },
      borderBottom: 1,
      borderColor: 'divider',
      py: 1.25,
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography noWrap sx={{ fontWeight: 800 }}>
        {item.productName}
      </Typography>
      <Typography color="text.secondary" sx={{ fontFamily: 'monospace' }} variant="body2">
        {item.productBarcode}
      </Typography>
    </Box>
    <Typography sx={{ minWidth: 120 }}>
      {formatNumber(item.quantity)} {PRODUCT_UNIT_LABELS[item.productUnit] ?? item.productUnit}
    </Typography>
    <Typography sx={{ minWidth: 120 }}>{formatCurrency(item.unitPrice)}</Typography>
    <Typography sx={{ fontWeight: 900, minWidth: 120, textAlign: { sm: 'right' } }}>
      {formatCurrency(item.lineTotal)}
    </Typography>
  </Stack>
)

export const SaleDetailDrawer = ({
  errorMessage,
  loading,
  onClose,
  open,
  sale,
}: SaleDetailDrawerProps) => {
  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            maxWidth: '100%',
            width: { xs: '100%', md: 620 },
          },
        },
      }}
    >
      <Stack sx={{ minHeight: '100%' }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', borderBottom: 1, borderColor: 'divider', p: 2 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900 }} variant="h6">
              Detalle de venta{sale ? ` #${sale.id}` : ''}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Datos reales registrados por el backend.
            </Typography>
          </Box>
          <IconButton aria-label="Cerrar detalle" onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        {loading ? <LinearProgress /> : <Box sx={{ height: 4 }} />}

        <Stack spacing={2.5} sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          {sale ? (
            <>
              <Stack direction="row" spacing={1}>
                <Chip label={SALE_TYPE_LABELS[sale.saleType]} size="small" />
                <Chip
                  color={sale.status === 'COMPLETED' ? 'success' : 'default'}
                  label={SALE_STATUS_LABELS[sale.status]}
                  size="small"
                  variant={sale.status === 'COMPLETED' ? 'filled' : 'outlined'}
                />
              </Stack>

              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                }}
              >
                <DetailRow label="Folio" value={`#${sale.id}`} />
                <DetailRow label="Fecha" value={formatDateTime(sale.createdAt)} />
                <DetailRow label="Cajero" value={sale.createdByUsername} />
                <DetailRow label="Cliente" value={sale.customerFullName || 'Público general'} />
              </Box>

              <Divider />

              {sale.saleType === 'CASH' ? (
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                  }}
                >
                  <DetailRow label="Total" value={formatCurrency(sale.total)} />
                  <DetailRow label="Efectivo recibido" value={formatCurrency(sale.cashReceived ?? 0)} />
                  <DetailRow label="Cambio" value={formatCurrency(sale.changeAmount ?? 0)} />
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  }}
                >
                  <DetailRow label="Total" value={formatCurrency(sale.total)} />
                  <DetailRow label="Cliente" value={sale.customerFullName || '-'} />
                </Box>
              )}

              {sale.receivable ? (
                <>
                  <Divider />
                  <Stack spacing={1.5}>
                    <Typography sx={{ fontWeight: 900 }}>Cuenta por cobrar</Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                      }}
                    >
                      <DetailRow label="Folio de cuenta" value={`#${sale.receivable.id}`} />
                      <DetailRow
                        label="Estado"
                        value={RECEIVABLE_STATUS_LABELS[sale.receivable.status]}
                      />
                      <DetailRow
                        label="Monto original"
                        value={formatCurrency(sale.receivable.originalAmount)}
                      />
                      <DetailRow
                        label="Monto pagado"
                        value={formatCurrency(sale.receivable.paidAmount)}
                      />
                      <DetailRow
                        label="Saldo pendiente"
                        value={formatCurrency(sale.receivable.outstandingBalance)}
                      />
                    </Box>
                  </Stack>
                </>
              ) : null}

              <Divider />

              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 900 }}>Artículos</Typography>
                <Stack>
                  {sale.items.map((item) => (
                    <SaleItemRow item={item} key={item.id} />
                  ))}
                </Stack>
              </Stack>
            </>
          ) : null}
        </Stack>
      </Stack>
    </Drawer>
  )
}
