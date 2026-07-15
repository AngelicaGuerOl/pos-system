import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { formatCurrency, formatDateTime } from '../../../../shared/utils/formatters'
import type { ReceivablePayment } from '../../payment/domain/entities/ReceivablePayment'

type PaymentsTabProps = {
  payments: ReceivablePayment[]
}

export const PaymentsTab = ({ payments }: PaymentsTabProps) => {
  if (payments.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        No hay abonos registrados.
      </Typography>
    )
  }

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Fecha y hora</TableCell>
            <TableCell align="right">Monto</TableCell>
            <TableCell>Recibido por</TableCell>
            <TableCell>Aplicado a</TableCell>
            <TableCell align="right">Saldo restante</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} hover>
              <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
              <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
              <TableCell>{payment.receivedByUsername}</TableCell>
              <TableCell>Venta #{payment.saleId}</TableCell>
              <TableCell align="right">{formatCurrency(payment.outstandingBalance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
