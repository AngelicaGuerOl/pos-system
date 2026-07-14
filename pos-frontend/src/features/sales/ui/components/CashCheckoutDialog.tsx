import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import type { ApiValidationErrors } from '../../../../shared/api/apiError'
import { formatCurrency } from '../../../../shared/utils/formatters'
import {
  createCashCheckoutSchema,
  type CashCheckoutFormValues,
} from '../schemas/cashCheckoutSchema'

type CashCheckoutDialogProps = {
  errorMessage?: string | null
  loading: boolean
  onClose: () => void
  onConfirm: (cashReceived: number) => void
  open: boolean
  serverErrors?: ApiValidationErrors
  total: number
}

export const CashCheckoutDialog = ({
  errorMessage,
  loading,
  onClose,
  onConfirm,
  open,
  serverErrors,
  total,
}: CashCheckoutDialogProps) => {
  const schema = useMemo(() => createCashCheckoutSchema(total), [total])
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<CashCheckoutFormValues>({
    defaultValues: {
      cashReceived: total,
    },
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      reset({ cashReceived: total })
    }
  }, [open, reset, total])

  const cashReceived = Number(watch('cashReceived') || 0)
  const changeAmount = Math.max(cashReceived - total, 0)
  const cashReceivedError = errors.cashReceived?.message ?? serverErrors?.cashReceived
  const disabled = loading || isSubmitting

  return (
    <Dialog fullWidth maxWidth="xs" onClose={disabled ? undefined : onClose} open={open}>
      <DialogTitle>Cobrar venta</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="cash-checkout-form"
          noValidate
          onSubmit={handleSubmit((values) => onConfirm(values.cashReceived))}
          spacing={3}
          sx={{ pt: 1 }}
        >
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <Stack spacing={0.5}>
            <Typography color="text.secondary" variant="body2">
              Total de la venta
            </Typography>
            <Typography sx={{ fontWeight: 900 }} variant="h3">
              {formatCurrency(total)}
            </Typography>
          </Stack>

          <TextField
            autoFocus
            disabled={disabled}
            error={Boolean(cashReceivedError)}
            fullWidth
            helperText={cashReceivedError ?? 'El backend recalculara total y cambio al confirmar.'}
            label="Efectivo recibido"
            slotProps={{
              htmlInput: {
                min: 0.01,
                step: '0.01',
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoneyRoundedIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
            type="number"
            {...register('cashReceived', { valueAsNumber: true })}
          />

          <Stack spacing={0.5}>
            <Typography color="text.secondary" variant="body2">
              Cambio estimado
            </Typography>
            <Typography color={cashReceived >= total ? 'success.main' : 'error.main'} sx={{ fontWeight: 900 }} variant="h4">
              {formatCurrency(changeAmount)}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={disabled} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          disabled={disabled || cashReceived < total}
          form="cash-checkout-form"
          startIcon={loading ? <CircularProgress color="inherit" size={16} /> : <CheckCircleRoundedIcon />}
          type="submit"
          variant="contained"
        >
          Confirmar venta
        </Button>
      </DialogActions>
    </Dialog>
  )
}
