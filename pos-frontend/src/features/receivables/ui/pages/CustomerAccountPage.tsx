import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import { Alert, Box, Button, LinearProgress, Snackbar, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ROUTE_PATHS } from '../../../../shared/routes/routePaths'
import { PageHeader } from '../../../../shared/ui/components/PageHeader'
import { useCreateReceivablePayment } from '../../payment/ui/hooks/useCreateReceivablePayment'
import { CreditSalesTab } from '../components/CreditSalesTab'
import { CustomerAccountSummary } from '../components/CustomerAccountSummary'
import { PaymentsTab } from '../components/PaymentsTab'
import { RegisterAccountPaymentDialog } from '../components/RegisterAccountPaymentDialog'
import { useCustomerAccount } from '../hooks/useCustomerAccount'
import { findReceivablesForPayment } from '../utils/accountsReceivable'

type AccountTab = 'sales' | 'payments'

export const CustomerAccountPage = () => {
  const navigate = useNavigate()
  const params = useParams()
  const customerId = Number(params.customerId)
  const account = useCustomerAccount(Number.isFinite(customerId) ? customerId : null)
  const createPayment = useCreateReceivablePayment()
  const [tab, setTab] = useState<AccountTab>('sales')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const paymentTargets = account.account ? findReceivablesForPayment(account.account.receivables) : []

  const handleSubmitPayment = async (
    request: Parameters<ReturnType<typeof useCreateReceivablePayment>['createPayment']>[1],
  ) => {
    let remainingCents = toCents(request.amount)

    for (const receivable of paymentTargets) {
      if (remainingCents <= 0) {
        break
      }

      const paymentCents = Math.min(remainingCents, toCents(receivable.outstandingBalance))
      if (paymentCents <= 0) {
        continue
      }

      const payment = await createPayment.createPayment(receivable.id, {
        amount: centsToAmount(paymentCents),
      })

      if (!payment) {
        return
      }

      remainingCents -= paymentCents
    }

    setPaymentDialogOpen(false)
    setSuccessMessage('Abono registrado correctamente')
    await account.refetch()
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', md: 'center' } }}>
        <Button
          onClick={() => navigate(ROUTE_PATHS.receivables)}
          startIcon={<ArrowBackRoundedIcon />}
          variant="outlined"
        >
          Volver a cuentas por cobrar
        </Button>
      </Stack>

      {account.loading ? <LinearProgress /> : null}
      {account.error ? <Alert severity="error">{account.error.message}</Alert> : null}

      {account.account ? (
        <>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', md: 'flex-start' }, justifyContent: 'space-between' }}
          >
            <PageHeader
              subtitle={account.account.customerFullName}
              title="Estado de cuenta"
            />
            <Button
              disabled={account.account.outstandingBalance <= 0 || createPayment.loading}
              onClick={() => {
                createPayment.reset()
                setPaymentDialogOpen(true)
              }}
              startIcon={<PaymentsRoundedIcon />}
              variant="contained"
            >
              Registrar abono
            </Button>
          </Stack>

          <CustomerAccountSummary account={account.account} />

          <Box>
            <Tabs
              onChange={(_event, value: AccountTab) => setTab(value)}
              value={tab}
            >
              <Tab label="Compras fiadas" value="sales" />
              <Tab label="Abonos" value="payments" />
            </Tabs>
          </Box>

          {tab === 'sales' ? <CreditSalesTab sales={account.account.sales} /> : null}
          {tab === 'payments' ? <PaymentsTab payments={account.account.payments} /> : null}

          <RegisterAccountPaymentDialog
            customerFullName={account.account.customerFullName}
            error={createPayment.error}
            loading={createPayment.loading}
            onClose={() => setPaymentDialogOpen(false)}
            onSubmit={(request) => void handleSubmitPayment(request)}
            open={paymentDialogOpen}
            paymentTargets={paymentTargets}
            totalOutstandingBalance={account.account.outstandingBalance}
          />
        </>
      ) : !account.loading ? (
        <Typography color="text.secondary">No fue posible cargar el estado de cuenta.</Typography>
      ) : null}

      <Snackbar
        autoHideDuration={4500}
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
        open={Boolean(successMessage)}
      />
    </Stack>
  )
}

const toCents = (amount: number): number => Math.round(amount * 100)

const centsToAmount = (cents: number): number => cents / 100
