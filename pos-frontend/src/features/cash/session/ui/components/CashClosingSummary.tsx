import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded'
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import type { ReactNode } from 'react'
import { formatCurrency, formatDateTime } from '../../../../../shared/utils/formatters'
import {
  CASH_SESSION_STATUS_LABELS,
  type CashSessionClosingSummary,
} from '../../domain/entities/CashSession'

type CashClosingSummaryProps = {
  showFinalSection?: boolean
  summary: CashSessionClosingSummary
}

type AmountRowProps = {
  label: string
  value: number
  helper?: string
}

const amountColor = (amount: number | null): 'success' | 'warning' | 'error' => {
  if (!amount) {
    return 'success'
  }

  return amount > 0 ? 'warning' : 'error'
}

const differenceText = (difference: number | null): string => {
  if (!difference) {
    return 'Caja cuadrada'
  }

  return difference > 0
    ? `Sobrante de ${formatCurrency(difference)}`
    : `Faltante de ${formatCurrency(Math.abs(difference))}`
}

const AmountRow = ({ helper, label, value }: AmountRowProps) => (
  <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontWeight: 700 }} variant="body2">
        {label}
      </Typography>
      {helper ? (
        <Typography color="text.secondary" variant="caption">
          {helper}
        </Typography>
      ) : null}
    </Box>
    <Typography sx={{ fontWeight: 900, whiteSpace: 'nowrap' }}>
      {formatCurrency(value)}
    </Typography>
  </Stack>
)

const Section = ({
  children,
  icon,
  title,
}: {
  children: ReactNode
  icon: ReactNode
  title: string
}) => (
  <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
    <CardContent>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              alignItems: 'center',
              bgcolor: 'primary.main',
              borderRadius: 1,
              color: 'common.white',
              display: 'flex',
              height: 34,
              justifyContent: 'center',
              width: 34,
            }}
          >
            {icon}
          </Box>
          <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
        </Stack>
        {children}
      </Stack>
    </CardContent>
  </Card>
)

export const CashClosingSummary = ({ showFinalSection = true, summary }: CashClosingSummaryProps) => {
  const differenceSeverity = amountColor(summary.differenceAmount)

  return (
    <Stack spacing={2.5}>
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ justifyContent: 'space-between' }}
            >
              <Box>
                <Typography sx={{ fontWeight: 900 }} variant="h6">
                  Corte de caja #{summary.sessionId}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Abierta por {summary.openedByUsername}
                  {summary.closedByUsername ? ` · Cerrada por ${summary.closedByUsername}` : ''}
                </Typography>
              </Box>
              <Chip
                color={summary.status === 'CLOSED' ? 'default' : 'success'}
                label={CASH_SESSION_STATUS_LABELS[summary.status]}
                variant="outlined"
              />
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography color="text.secondary" variant="caption">
                  Apertura
                </Typography>
                <Typography sx={{ fontWeight: 800 }}>{formatDateTime(summary.openedAt)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography color="text.secondary" variant="caption">
                  Cierre
                </Typography>
                <Typography sx={{ fontWeight: 800 }}>{formatDateTime(summary.closedAt)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography color="text.secondary" variant="caption">
                  Fondo inicial
                </Typography>
                <Typography sx={{ fontWeight: 900 }}>{formatCurrency(summary.openingAmount)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography color="text.secondary" variant="caption">
                  Diferencia
                </Typography>
                <Chip
                  color={differenceSeverity}
                  label={differenceText(summary.differenceAmount)}
                  size="small"
                  variant={summary.differenceAmount ? 'filled' : 'outlined'}
                />
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Section icon={<ReceiptLongRoundedIcon fontSize="small" />} title="Resumen de ventas">
            <AmountRow label="Ventas en efectivo" value={summary.salesSummary.cashSalesAmount} />
            <AmountRow
              helper="Informativas; no se suman al efectivo esperado."
              label="Ventas fiadas"
              value={summary.salesSummary.creditSalesAmount}
            />
            <Divider />
            <AmountRow label="Total vendido" value={summary.salesSummary.totalSalesAmount} />
          </Section>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Section icon={<AssignmentReturnRoundedIcon fontSize="small" />} title="Operaciones procesadas">
            <AmountRow
              helper="Importe devuelto o ajustado."
              label="Devoluciones procesadas"
              value={summary.operationsSummary.returnsProcessedAmount}
            />
            <AmountRow
              helper="Dinero que realmente salió de caja."
              label="Reembolsos por devoluciones"
              value={summary.operationsSummary.returnCashRefundAmount}
            />
            <AmountRow
              helper="Importe de ventas canceladas."
              label="Cancelaciones procesadas"
              value={summary.operationsSummary.cancellationsProcessedAmount}
            />
            <AmountRow
              helper="Dinero que realmente salió de caja."
              label="Reembolsos por cancelaciones"
              value={summary.operationsSummary.cancellationCashRefundAmount}
            />
          </Section>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Section icon={<PointOfSaleRoundedIcon fontSize="small" />} title="Movimientos de efectivo">
            <AmountRow label="Ventas en efectivo" value={summary.cashSummary.cashSalesAmount} />
            <AmountRow label="Abonos de cuentas por cobrar" value={summary.cashSummary.receivablePaymentsAmount} />
            <AmountRow label="Entradas manuales" value={summary.cashSummary.manualInflowsAmount} />
            <AmountRow label="Total de entradas" value={summary.cashSummary.totalInflows} />
            <Divider />
            <AmountRow label="Salidas manuales" value={summary.cashSummary.manualOutflowsAmount} />
            <AmountRow label="Reembolsos por devoluciones" value={summary.cashSummary.saleRefundsAmount} />
            <AmountRow label="Reembolsos por cancelaciones" value={summary.cashSummary.saleCancellationRefundsAmount} />
            <AmountRow label="Total de salidas" value={summary.cashSummary.totalOutflows} />
          </Section>
        </Grid>

        {showFinalSection ? (
          <Grid size={{ xs: 12, md: 6 }}>
            <Section icon={<AccountBalanceWalletRoundedIcon fontSize="small" />} title="Arqueo final">
              <AmountRow label="Efectivo esperado" value={summary.cashSummary.expectedAmount} />
              <AmountRow label="Efectivo contado" value={summary.countedAmount ?? 0} />
              <AmountRow label="Diferencia" value={summary.differenceAmount ?? 0} />
              {summary.notes ? (
                <Alert severity="info" variant="outlined">
                  {summary.notes}
                </Alert>
              ) : (
                <Typography color="text.secondary" variant="body2">
                  Sin observaciones.
                </Typography>
              )}
            </Section>
          </Grid>
        ) : null}
      </Grid>
    </Stack>
  )
}
