import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import AddCardRoundedIcon from '@mui/icons-material/AddCardRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded'
import { Card, CardContent, Grid, Stack, Typography } from '@mui/material'
import { formatCurrency } from '../../../../../shared/utils/formatters'
import type { CurrentCashSummary } from '../../domain/entities/CashMovement'

type CashSummaryCardsProps = {
  summary: CurrentCashSummary | null
}

const summaryItems = (summary: CurrentCashSummary | null) => [
  {
    color: 'primary.main',
    icon: <AccountBalanceWalletRoundedIcon />,
    label: 'Fondo inicial',
    value: summary?.openingAmount ?? 0,
  },
  {
    color: 'success.main',
    icon: <AddCardRoundedIcon />,
    label: 'Entradas',
    value: summary?.totalInflows ?? 0,
  },
  {
    color: 'error.main',
    icon: <RemoveCircleOutlineRoundedIcon />,
    label: 'Salidas',
    value: summary?.totalOutflows ?? 0,
  },
  {
    color: 'secondary.main',
    icon: <PaymentsRoundedIcon />,
    label: 'Efectivo esperado',
    value: summary?.expectedCash ?? 0,
  },
]

export const CashSummaryCards = ({ summary }: CashSummaryCardsProps) => {
  return (
    <Grid container spacing={2}>
      {summaryItems(summary).map((item) => (
        <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Stack
                    sx={{
                      alignItems: 'center',
                      bgcolor: item.color,
                      borderRadius: 1,
                      color: 'common.white',
                      height: 36,
                      justifyContent: 'center',
                      width: 36,
                    }}
                  >
                    {item.icon}
                  </Stack>
                  <Typography color="text.secondary" sx={{ fontWeight: 700 }} variant="body2">
                    {item.label}
                  </Typography>
                </Stack>
                <Typography sx={{ fontWeight: 900 }} variant="h5">
                  {formatCurrency(item.value)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
