import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded'
import {
  Alert,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
  type AlertColor,
} from '@mui/material'
import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCashSession } from '../../../cash/session'
import { ROUTE_PATHS } from '../../../../shared/routes/routePaths'
import { formatCurrency, formatDateTime } from '../../../../shared/utils/formatters'
import type { ReceivableDetail } from '../../domain/entities/Receivable'
import type { CreateReceivablePaymentRequest } from '../../payment/domain/entities/ReceivablePayment'
import { CreateReceivablePaymentDialog } from '../../payment/ui/components/CreateReceivablePaymentDialog'
import { ReceivablePaymentDetailDialog } from '../../payment/ui/components/ReceivablePaymentDetailDialog'
import { ReceivablePaymentsList } from '../../payment/ui/components/ReceivablePaymentsList'
import { useCreateReceivablePayment } from '../../payment/ui/hooks/useCreateReceivablePayment'
import { useReceivablePaymentDetails } from '../../payment/ui/hooks/useReceivablePaymentDetails'
import { useReceivablePayments } from '../../payment/ui/hooks/useReceivablePayments'
import { ReceivableStatusChip } from './ReceivableStatusChip'

type ReceivableDetailDrawerProps = {
  errorMessage?: string
  loading: boolean
  onClose: () => void
  onPaymentRegistered?: () => Promise<void> | void
  open: boolean
  receivable: ReceivableDetail | null
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Stack spacing={0.25}>
    <Typography color="text.secondary" variant="caption">
      {label}
    </Typography>
    <Typography sx={{ fontWeight: 800 }}>{value}</Typography>
  </Stack>
)

const isCashSessionError = (message: string): boolean => {
  const normalizedMessage = message.toLowerCase()
  return normalizedMessage.includes('caja') || normalizedMessage.includes('cash session')
}

export const ReceivableDetailDrawer = ({
  errorMessage,
  loading,
  onClose,
  onPaymentRegistered,
  open,
  receivable,
}: ReceivableDetailDrawerProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const registerButtonRef = useRef<HTMLButtonElement | null>(null)
  const { refreshCurrentSession } = useCashSession()
  const payments = useReceivablePayments(receivable?.id ?? null)
  const createPayment = useCreateReceivablePayment()
  const paymentDetails = useReceivablePaymentDetails()
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)

  const canRegisterPayment = receivable?.status === 'PENDING' || receivable?.status === 'PARTIALLY_PAID'

  const handleOpenPaymentDialog = async () => {
    if (!receivable) {
      return
    }

    const session = await refreshCurrentSession()
    if (!session) {
      setMessage({ severity: 'warning', text: 'Debes abrir una caja antes de registrar un abono.' })
      navigate(ROUTE_PATHS.cashSessionOpen, {
        state: { from: location },
      })
      return
    }

    createPayment.reset()
    setPaymentDialogOpen(true)
  }

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false)
    window.setTimeout(() => registerButtonRef.current?.focus(), 50)
  }

  const handleSubmitPayment = async (request: CreateReceivablePaymentRequest) => {
    if (!receivable) {
      return
    }

    const payment = await createPayment.createPayment(receivable.id, request)
    if (!payment) {
      const error = createPayment.getLastError()
      if (error?.status === 409 && isCashSessionError(error.message)) {
        setPaymentDialogOpen(false)
        await refreshCurrentSession()
        setMessage({ severity: 'warning', text: 'Debes abrir una caja antes de registrar un abono.' })
        navigate(ROUTE_PATHS.cashSessionOpen, {
          state: { from: location },
        })
        return
      }
      if (error?.status === 409) {
        await onPaymentRegistered?.()
      }
      return
    }

    setPaymentDialogOpen(false)
    setMessage({
      severity: 'success',
      text: `Abono de ${formatCurrency(payment.amount)} registrado correctamente.`,
    })
    await payments.refetch()
    await refreshCurrentSession()
    await onPaymentRegistered?.()
    window.setTimeout(() => registerButtonRef.current?.focus(), 50)
  }

  return (
    <>
      <Drawer
        anchor="right"
        onClose={onClose}
        open={open}
        slotProps={{
          paper: {
            sx: {
              maxWidth: '100%',
              width: { xs: '100%', md: 600 },
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
                Cuenta por cobrar{receivable ? ` #${receivable.id}` : ''}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Detalle registrado por el backend.
              </Typography>
            </Box>
            <IconButton aria-label="Cerrar detalle" onClick={onClose}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          {loading ? <LinearProgress /> : <Box sx={{ height: 4 }} />}

          <Stack spacing={2.5} sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            {receivable ? (
              <>
                <Stack direction="row">
                  <ReceivableStatusChip status={receivable.status} />
                </Stack>

                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  }}
                >
                  <DetailRow label="ID de cuenta" value={`#${receivable.id}`} />
                  <DetailRow label="Folio de venta" value={`#${receivable.folio}`} />
                  <DetailRow label="Cliente" value={receivable.customer.fullName} />
                  <DetailRow label="Fecha de venta" value={formatDateTime(receivable.saleCreatedAt)} />
                  <DetailRow label="Registrada por" value={receivable.registeredByUsername} />
                  <DetailRow label="Fecha de cuenta" value={formatDateTime(receivable.createdAt)} />
                </Box>

                <Divider />

                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  }}
                >
                  <DetailRow label="Monto original" value={formatCurrency(receivable.originalAmount)} />
                  <DetailRow label="Total pagado" value={formatCurrency(receivable.paidAmount)} />
                  <DetailRow label="Saldo pendiente" value={formatCurrency(receivable.outstandingBalance)} />
                  <DetailRow label="Fecha de pago" value={formatDateTime(receivable.paidAt)} />
                </Box>

                <Divider />

                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>Abonos</Typography>
                      {!canRegisterPayment && receivable.status === 'PAID' ? (
                        <Typography color="text.secondary" variant="body2">
                          Esta cuenta ya fue liquidada.
                        </Typography>
                      ) : null}
                      {!canRegisterPayment && receivable.status === 'CANCELLED' ? (
                        <Typography color="text.secondary" variant="body2">
                          No es posible registrar abonos en una cuenta cancelada.
                        </Typography>
                      ) : null}
                    </Box>
                    {canRegisterPayment ? (
                      <Button
                        onClick={() => void handleOpenPaymentDialog()}
                        ref={registerButtonRef}
                        startIcon={<PaymentRoundedIcon />}
                        variant="contained"
                      >
                        Registrar abono
                      </Button>
                    ) : null}
                  </Stack>

                  <ReceivablePaymentsList
                    errorMessage={payments.error?.message}
                    loading={payments.loading}
                    onPageChange={payments.setPage}
                    onSizeChange={payments.setSize}
                    onViewDetails={(paymentId) => void paymentDetails.openDetails(paymentId)}
                    page={payments.page}
                    payments={payments.payments}
                    size={payments.size}
                    totalElements={payments.totalElements}
                  />
                </Stack>
              </>
            ) : null}
          </Stack>
        </Stack>
      </Drawer>

      {receivable ? (
        <CreateReceivablePaymentDialog
          errorMessage={createPayment.error?.message}
          loading={createPayment.loading}
          onClose={handleClosePaymentDialog}
          onSubmit={(request) => void handleSubmitPayment(request)}
          open={paymentDialogOpen}
          receivable={receivable}
          serverErrors={createPayment.error?.validationErrors}
        />
      ) : null}

      <ReceivablePaymentDetailDialog
        errorMessage={paymentDetails.error?.message}
        loading={paymentDetails.loading}
        onClose={paymentDetails.closeDetails}
        open={paymentDetails.open}
        payment={paymentDetails.payment}
      />

      <Snackbar autoHideDuration={3000} onClose={() => setMessage(null)} open={Boolean(message)}>
        <Alert
          onClose={() => setMessage(null)}
          severity={message?.severity ?? 'success'}
          variant="filled"
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </>
  )
}
