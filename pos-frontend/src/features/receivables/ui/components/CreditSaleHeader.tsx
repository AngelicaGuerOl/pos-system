import { Chip, Stack, Typography } from '@mui/material'
import { formatCurrency, formatDateTime } from '../../../../shared/utils/formatters'
import { RECEIVABLE_STATUS_LABELS, type Receivable } from '../../domain/entities/Receivable'

type CreditSaleHeaderProps = {
  receivable: Receivable
}

export const CreditSaleHeader = ({ receivable }: CreditSaleHeaderProps) => {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1}
      sx={{
        alignItems: { xs: 'flex-start', md: 'center' },
        bgcolor: 'background.default',
        borderBottom: 1,
        borderColor: 'divider',
        justifyContent: 'space-between',
        p: 2,
      }}
    >
      <Stack spacing={0.75} sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 900 }}>
          Venta #{receivable.saleId} · {formatDateTime(receivable.createdAt)}
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 0.25, sm: 1.5 }}
          sx={{ color: 'text.secondary' }}
        >
          <Typography variant="body2">Total: {formatCurrency(receivable.adjustedAmount)}</Typography>
          <Typography variant="body2">Abonado: {formatCurrency(receivable.paidAmount)}</Typography>
          <Typography variant="body2">
            Saldo pendiente: {formatCurrency(receivable.outstandingBalance)}
          </Typography>
        </Stack>
      </Stack>

      <Chip label={RECEIVABLE_STATUS_LABELS[receivable.status]} size="small" />
    </Stack>
  )
}
