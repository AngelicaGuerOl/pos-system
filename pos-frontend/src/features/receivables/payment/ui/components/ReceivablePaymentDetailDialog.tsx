import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { formatCurrency, formatDateTime } from '../../../../../shared/utils/formatters'
import { RECEIVABLE_STATUS_LABELS } from '../../../domain/entities/Receivable'
import type { ReceivablePayment } from '../../domain/entities/ReceivablePayment'

type ReceivablePaymentDetailDialogProps = {
  errorMessage?: string
  loading: boolean
  onClose: () => void
  open: boolean
  payment: ReceivablePayment | null
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Stack spacing={0.25}>
    <Typography color="text.secondary" variant="caption">
      {label}
    </Typography>
    <Typography sx={{ fontWeight: 800 }}>{value}</Typography>
  </Stack>
)

export const ReceivablePaymentDetailDialog = ({
  errorMessage,
  loading,
  onClose,
  open,
  payment,
}: ReceivablePaymentDetailDialogProps) => (
  <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
    <DialogTitle>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Box sx={{ flex: 1 }}>
          Abono{payment ? ` #${payment.id}` : ''}
        </Box>
        <IconButton aria-label="Cerrar detalle de abono" onClick={onClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </Stack>
    </DialogTitle>
    {loading ? <LinearProgress /> : null}
    <DialogContent>
      <Stack spacing={2.5}>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {payment ? (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            }}
          >
            <DetailRow label="ID del abono" value={`#${payment.id}`} />
            <DetailRow label="Fecha" value={formatDateTime(payment.createdAt)} />
            <DetailRow label="Cliente" value={payment.customerFullName} />
            <DetailRow label="Venta asociada" value={`#${payment.saleId}`} />
            <DetailRow label="Monto" value={formatCurrency(payment.amount)} />
            <DetailRow label="Recibido por" value={payment.receivedByUsername} />
            <DetailRow label="Sesión de caja" value={`#${payment.cashSessionId}`} />
            <DetailRow label="Notas" value={payment.notes || '-'} />
            <DetailRow label="Pagado acumulado" value={formatCurrency(payment.paidAmount)} />
            <DetailRow label="Saldo pendiente" value={formatCurrency(payment.outstandingBalance)} />
            <DetailRow
              label="Estado de cuenta"
              value={RECEIVABLE_STATUS_LABELS[payment.receivableStatus]}
            />
          </Box>
        ) : null}
      </Stack>
    </DialogContent>
  </Dialog>
)
