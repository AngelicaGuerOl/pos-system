import { Box, Stack, Typography } from '@mui/material'
import { formatCurrency } from '../../../../shared/utils/formatters'
import type { CustomerAccountData } from '../types/accountsReceivable'

type CustomerAccountSummaryProps = {
  account: CustomerAccountData
}

export const CustomerAccountSummary = ({ account }: CustomerAccountSummaryProps) => {
  const rows = [
    { label: 'Total de compras fiadas', value: formatCurrency(account.adjustedAmount) },
    { label: 'Total abonado', value: formatCurrency(account.paidAmount) },
    { label: 'Saldo pendiente', value: formatCurrency(account.outstandingBalance) },
  ]

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        {rows.map((row) => (
          <Stack key={row.label} spacing={0.5}>
            <Typography color="text.secondary" variant="body2">
              {row.label}
            </Typography>
            <Typography sx={{ fontWeight: 900 }} variant="h5">
              {row.value}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  )
}
