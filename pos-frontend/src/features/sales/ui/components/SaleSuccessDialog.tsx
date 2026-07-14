import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { formatCurrency, formatDateTime } from '../../../../shared/utils/formatters'
import { SALE_TYPE_LABELS, type Sale } from '../../domain/entities/Sale'
import { RECEIVABLE_STATUS_LABELS } from '../../../receivables'

type SaleSuccessDialogProps = {
  open: boolean
  sale: Sale | null
  onNewSale: () => void
  onViewReceivable?: (receivableId: number) => void
}

export const SaleSuccessDialog = ({
  open,
  sale,
  onNewSale,
  onViewReceivable,
}: SaleSuccessDialogProps) => {
  const receivableId = sale?.receivable?.id

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onNewSale} open={open}>
      <DialogTitle>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CheckCircleRoundedIcon color="success" />
          <span>Venta realizada correctamente</span>
        </Stack>
      </DialogTitle>
      <DialogContent>
        {sale ? (
          <Stack divider={<Divider flexItem />} spacing={2}>
            <Stack spacing={0.5}>
              <Typography color="text.secondary" variant="caption">
                Folio
              </Typography>
              <Typography sx={{ fontWeight: 900 }} variant="h5">
                #{sale.id}
              </Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Tipo</Typography>
              <Typography sx={{ fontWeight: 900 }}>{SALE_TYPE_LABELS[sale.saleType]}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Cliente</Typography>
              <Typography sx={{ fontWeight: 900 }}>
                {sale.customerFullName || 'Público general'}
              </Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Total</Typography>
              <Typography sx={{ fontWeight: 900 }}>{formatCurrency(sale.total)}</Typography>
            </Stack>
            {sale.saleType === 'CASH' ? (
              <>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Efectivo recibido</Typography>
                  <Typography sx={{ fontWeight: 900 }}>
                    {formatCurrency(sale.cashReceived ?? 0)}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Cambio</Typography>
                  <Typography sx={{ fontWeight: 900 }}>
                    {formatCurrency(sale.changeAmount ?? 0)}
                  </Typography>
                </Stack>
              </>
            ) : null}
            {sale.receivable ? (
              <>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Estado de cuenta</Typography>
                  <Typography sx={{ fontWeight: 900 }}>
                    {RECEIVABLE_STATUS_LABELS[sale.receivable.status]}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Saldo pendiente</Typography>
                  <Typography sx={{ fontWeight: 900 }}>
                    {formatCurrency(sale.receivable.outstandingBalance)}
                  </Typography>
                </Stack>
              </>
            ) : null}
            <Stack spacing={0.5}>
              <Typography color="text.secondary" variant="caption">
                Fecha
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>{formatDateTime(sale.createdAt)}</Typography>
            </Stack>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        {receivableId && onViewReceivable ? (
          <Button onClick={() => onViewReceivable(receivableId)}>
            Ver cuenta por cobrar
          </Button>
        ) : null}
        <Button onClick={onNewSale} variant="contained">
          Nueva venta
        </Button>
      </DialogActions>
    </Dialog>
  )
}
