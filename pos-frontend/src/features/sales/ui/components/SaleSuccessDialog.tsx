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
import type { Sale } from '../../domain/entities/Sale'

type SaleSuccessDialogProps = {
  open: boolean
  sale: Sale | null
  onNewSale: () => void
}

export const SaleSuccessDialog = ({ open, sale, onNewSale }: SaleSuccessDialogProps) => {
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
              <Typography color="text.secondary">Total</Typography>
              <Typography sx={{ fontWeight: 900 }}>{formatCurrency(sale.total)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Efectivo recibido</Typography>
              <Typography sx={{ fontWeight: 900 }}>{formatCurrency(sale.cashReceived)}</Typography>
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Cambio</Typography>
              <Typography sx={{ fontWeight: 900 }}>{formatCurrency(sale.changeAmount)}</Typography>
            </Stack>
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
        <Button onClick={onNewSale} variant="contained">
          Nueva venta
        </Button>
      </DialogActions>
    </Dialog>
  )
}
