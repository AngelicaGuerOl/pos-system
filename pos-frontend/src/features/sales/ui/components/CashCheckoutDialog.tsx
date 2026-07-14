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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { ApiValidationErrors } from '../../../../shared/api/apiError'
import { formatCurrency } from '../../../../shared/utils/formatters'
import { CustomerSelector, type Customer } from '../../../customers'
import type { SaleType } from '../../domain/entities/Sale'
import {
  createCashCheckoutSchema,
  type CashCheckoutFormValues,
} from '../schemas/cashCheckoutSchema'

type CashCheckoutDialogProps = {
  errorMessage?: string | null
  loading: boolean
  onClose: () => void
  onConfirm: (values: {
    cashReceived: number | null
    customer: Customer | null
    saleType: SaleType
  }) => void
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
  const [saleType, setSaleType] = useState<SaleType>('CASH')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerError, setCustomerError] = useState<string | null>(null)
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
      setSaleType('CASH')
      setSelectedCustomer(null)
      setCustomerError(null)
    }
  }, [open, reset, total])

  const cashReceived = Number(watch('cashReceived') || 0)
  const changeAmount = Math.max(cashReceived - total, 0)
  const cashReceivedError = errors.cashReceived?.message ?? serverErrors?.cashReceived
  const disabled = loading || isSubmitting
  const isCredit = saleType === 'CREDIT'

  const handleConfirm = (values: CashCheckoutFormValues) => {
    if (isCredit && !selectedCustomer) {
      setCustomerError('Selecciona un cliente para registrar una venta fiada')
      return
    }

    onConfirm({
      cashReceived: isCredit ? null : values.cashReceived,
      customer: selectedCustomer,
      saleType,
    })
  }

  return (
    <Dialog fullWidth maxWidth="sm" onClose={disabled ? undefined : onClose} open={open}>
      <DialogTitle>Cobrar venta</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="cash-checkout-form"
          noValidate
          onSubmit={handleSubmit(handleConfirm)}
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

          <ToggleButtonGroup
            color="primary"
            disabled={disabled}
            exclusive
            fullWidth
            onChange={(_event, nextSaleType: SaleType | null) => {
              if (nextSaleType) {
                setSaleType(nextSaleType)
                setCustomerError(null)
              }
            }}
            value={saleType}
          >
            <ToggleButton value="CASH">Efectivo</ToggleButton>
            <ToggleButton value="CREDIT">Fiado</ToggleButton>
          </ToggleButtonGroup>

          {isCredit ? (
            <Stack spacing={2}>
              <CustomerSelector
                disabled={disabled}
                error={customerError ?? serverErrors?.customerId}
                onChange={(customer) => {
                  setSelectedCustomer(customer)
                  setCustomerError(null)
                }}
                required
                value={selectedCustomer}
              />
              <Alert severity="info">
                {selectedCustomer
                  ? `Se registrara una deuda de ${formatCurrency(total)} para ${selectedCustomer.fullName}.`
                  : `El total de ${formatCurrency(total)} quedara como deuda del cliente seleccionado.`}
              </Alert>
            </Stack>
          ) : (
            <>
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
                <Typography
                  color={cashReceived >= total ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 900 }}
                  variant="h4"
                >
                  {formatCurrency(changeAmount)}
                </Typography>
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={disabled} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          disabled={disabled || (!isCredit && cashReceived < total) || (isCredit && !selectedCustomer)}
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
