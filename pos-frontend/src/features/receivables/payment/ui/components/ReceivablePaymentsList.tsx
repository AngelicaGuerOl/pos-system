import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import {
  Alert,
  Button,
  Divider,
  LinearProgress,
  Stack,
  TablePagination,
  Typography,
} from '@mui/material'
import { formatCurrency, formatDateTime } from '../../../../../shared/utils/formatters'
import type { ReceivablePayment } from '../../domain/entities/ReceivablePayment'

type ReceivablePaymentsListProps = {
  errorMessage?: string
  loading: boolean
  onPageChange: (page: number) => void
  onSizeChange: (size: number) => void
  onViewDetails: (paymentId: number) => void
  page: number
  payments: ReceivablePayment[]
  size: number
  totalElements: number
}

export const ReceivablePaymentsList = ({
  errorMessage,
  loading,
  onPageChange,
  onSizeChange,
  onViewDetails,
  page,
  payments,
  size,
  totalElements,
}: ReceivablePaymentsListProps) => (
  <Stack spacing={1.5}>
    {loading ? <LinearProgress /> : null}
    {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

    {!loading && payments.length === 0 ? (
      <Typography color="text.secondary" variant="body2">
        Esta cuenta todavía no tiene abonos registrados.
      </Typography>
    ) : (
      <Stack divider={<Divider flexItem />} spacing={0}>
        {payments.map((payment) => (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            key={payment.id}
            spacing={1.5}
            sx={{
              alignItems: { xs: 'stretch', sm: 'center' },
              py: 1.5,
            }}
          >
            <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900 }}>{formatCurrency(payment.amount)}</Typography>
              <Typography color="text.secondary" variant="body2">
                {formatDateTime(payment.createdAt)}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Recibido por: {payment.receivedByUsername}
              </Typography>
              {payment.notes ? (
                <Typography sx={{ wordBreak: 'break-word' }} variant="body2">
                  {payment.notes}
                </Typography>
              ) : null}
            </Stack>
            <Button
              onClick={() => onViewDetails(payment.id)}
              size="small"
              startIcon={<VisibilityRoundedIcon />}
            >
              Ver detalle
            </Button>
          </Stack>
        ))}
      </Stack>
    )}

    <TablePagination
      component="div"
      count={totalElements}
      labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      labelRowsPerPage="Filas por pagina"
      onPageChange={(_event, nextPage) => onPageChange(nextPage)}
      onRowsPerPageChange={(event) => onSizeChange(Number(event.target.value))}
      page={page}
      rowsPerPage={size}
      rowsPerPageOptions={[5, 10, 20]}
    />
  </Stack>
)
