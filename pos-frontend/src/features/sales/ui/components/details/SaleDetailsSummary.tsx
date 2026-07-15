import { Box, Chip, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { formatCurrency } from '../../../../../shared/utils/formatters'
import { RECEIVABLE_STATUS_LABELS } from '../../../../receivables'
import {
  SALE_STATUS_LABELS,
  SALE_TYPE_LABELS,
  type Sale,
} from '../../../domain/entities/Sale'

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Stack spacing={0.25}>
    <Typography color="text.secondary" variant="caption">
      {label}
    </Typography>
    <Typography sx={{ fontWeight: 800 }}>{value}</Typography>
  </Stack>
)

const saleStatusColor = (status: Sale['status']): 'success' | 'warning' | 'info' | 'default' => {
  if (status === 'COMPLETED') {
    return 'success'
  }
  if (status === 'PARTIALLY_RETURNED') {
    return 'warning'
  }
  if (status === 'RETURNED') {
    return 'info'
  }
  return 'default'
}

const getSalePaymentLabel = (sale: Sale): string => {
  if (sale.saleType === 'CASH') {
    return 'Pagada'
  }
  return sale.receivable ? RECEIVABLE_STATUS_LABELS[sale.receivable.status] : '-'
}

type SaleDetailsSummaryProps = {
  actions?: ReactNode
  sale: Sale
}

export const SaleDetailsSummary = ({ actions, sale }: SaleDetailsSummaryProps) => {
  const paymentStatus = getSalePaymentLabel(sale)
  const rows = sale.saleType === 'CASH'
    ? [
        { label: 'Cliente', value: sale.customerFullName || 'Público general' },
        { label: 'Cajero', value: sale.createdByUsername },
        { label: 'Total', value: formatCurrency(sale.total) },
      ]
    : [
        { label: 'Cliente', value: sale.customerFullName || 'Público general' },
        { label: 'Cajero', value: sale.createdByUsername },
        { label: 'Total', value: formatCurrency(sale.total) },
        sale.receivable
          ? { label: 'Saldo pendiente', value: formatCurrency(sale.receivable.outstandingBalance) }
          : null,
      ].filter((row): row is { label: string; value: string } => Boolean(row))

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { xs: 'stretch', md: 'flex-start' } }}
      >
        <Stack direction="row" spacing={1} sx={{ flex: 1, flexWrap: 'wrap' }}>
          <Chip label={SALE_TYPE_LABELS[sale.saleType]} size="small" />
          <Chip
            color={saleStatusColor(sale.status)}
            label={SALE_STATUS_LABELS[sale.status]}
            size="small"
            variant={sale.status === 'COMPLETED' ? 'filled' : 'outlined'}
          />
          {paymentStatus !== '-' ? (
            <Chip label={paymentStatus} size="small" variant="outlined" />
          ) : null}
        </Stack>
        {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
        }}
      >
        {rows.map((row) => (
          <DetailRow key={row.label} label={row.label} value={row.value} />
        ))}
      </Box>
    </Stack>
  )
}

type SaleReturnContextLineProps = {
  sale: Sale
}

export const SaleReturnContextLine = ({ sale }: SaleReturnContextLineProps) => {
  const parts = [
    sale.customerFullName || 'Público general',
    SALE_TYPE_LABELS[sale.saleType],
    `Total: ${formatCurrency(sale.total)}`,
    sale.receivable ? `Saldo: ${formatCurrency(sale.receivable.outstandingBalance)}` : null,
  ].filter((part): part is string => Boolean(part))

  return (
    <Typography color="text.secondary" sx={{ fontWeight: 700 }} variant="body2">
      {parts.join(' · ')}
    </Typography>
  )
}
