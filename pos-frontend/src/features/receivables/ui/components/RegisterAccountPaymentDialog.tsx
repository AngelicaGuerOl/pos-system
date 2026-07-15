import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
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
import { useEffect, useMemo, useRef, useState } from 'react'
import type { NormalizedApiError } from '../../../../shared/api/apiError'
import { formatCurrency } from '../../../../shared/utils/formatters'
import type { Receivable } from '../../domain/entities/Receivable'
import type { CreateReceivablePaymentRequest } from '../../payment/domain/entities/ReceivablePayment'

type RegisterAccountPaymentDialogProps = {
  customerFullName: string
  error: NormalizedApiError | null
  loading: boolean
  onClose: () => void
  onSubmit: (request: CreateReceivablePaymentRequest) => void
  open: boolean
  paymentTargets: Receivable[]
  totalOutstandingBalance: number
}

type FormErrors = {
  amount?: string
}

const MONEY_PATTERN = /^\d+([.,]\d{0,2})?$/

const toAmount = (value: string): number | null => {
  const normalizedValue = value.trim().replace(/\s/g, '').replace(/^\$/, '').replace(',', '.')
  if (!normalizedValue || !MONEY_PATTERN.test(normalizedValue)) {
    return null
  }

  const amount = Number(normalizedValue)
  return Number.isFinite(amount) ? amount : null
}

const toCents = (value: number): number => Math.round(value * 100)

export const RegisterAccountPaymentDialog = ({
  customerFullName,
  error,
  loading,
  onClose,
  onSubmit,
  open,
  paymentTargets,
  totalOutstandingBalance,
}: RegisterAccountPaymentDialogProps) => {
  const amountInputRef = useRef<HTMLInputElement | null>(null)
  const [amountText, setAmountText] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      setAmountText('')
      setErrors({})
      window.setTimeout(() => amountInputRef.current?.focus(), 50)
    }
  }, [open])

  const amount = useMemo(() => toAmount(amountText), [amountText])
  const hasPaymentTargets = paymentTargets.length > 0
  const paymentLimit = totalOutstandingBalance
  const previewBalance = amount === null
    ? totalOutstandingBalance
    : Math.max(totalOutstandingBalance - amount, 0)
  const canSubmit = Boolean(
    hasPaymentTargets
      && amount !== null
      && amount > 0
      && toCents(amount) <= toCents(paymentLimit)
      && !loading,
  )
  const showBalancePreview = Boolean(
    amount !== null
      && amount > 0
      && hasPaymentTargets
      && toCents(amount) <= toCents(paymentLimit),
  )

  const validate = (): CreateReceivablePaymentRequest | null => {
    const nextErrors: FormErrors = {}
    const nextAmount = toAmount(amountText)

    if (!hasPaymentTargets) {
      nextErrors.amount = 'No hay una cuenta con saldo pendiente para abonar.'
    } else if (nextAmount === null) {
      nextErrors.amount = 'Ingresa un monto valido con maximo 2 decimales.'
    } else if (nextAmount <= 0) {
      nextErrors.amount = 'El monto debe ser mayor que cero.'
    } else if (toCents(nextAmount) > toCents(totalOutstandingBalance)) {
      nextErrors.amount = `El monto no puede superar el saldo pendiente (${formatCurrency(totalOutstandingBalance)}).`
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || nextAmount === null) {
      return null
    }

    return {
      amount: nextAmount,
    }
  }

  const handleSubmit = () => {
    if (!hasPaymentTargets) {
      return
    }
    const request = validate()
    if (request) {
      onSubmit(request)
    }
  }

  const amountError = errors.amount

  return (
    <Dialog fullWidth maxWidth="sm" onClose={loading ? undefined : onClose} open={open}>
      <DialogTitle>Registrar abono</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}

          <Stack spacing={1}>
            <Typography color="text.secondary" variant="body2">
              Cliente: <strong>{customerFullName}</strong>
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Saldo pendiente actual
            </Typography>
            <Typography sx={{ fontWeight: 900 }} variant="h4">
              {formatCurrency(totalOutstandingBalance)}
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <TextField
              disabled={loading}
              error={Boolean(amountError)}
              fullWidth
              helperText={amountError ?? ''}
              inputRef={amountInputRef}
              label="Monto del abono"
              onChange={(event) => {
                setAmountText(event.target.value)
                setErrors({})
              }}
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyRoundedIcon color="action" />
                    </InputAdornment>
                  ),
                },
              }}
              value={amountText}
            />
            <Button
              disabled={loading || !hasPaymentTargets}
              onClick={() => setAmountText(String(totalOutstandingBalance))}
              size="small"
              sx={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}
              variant="outlined"
            >
              Usar saldo completo
            </Button>
          </Stack>

          {showBalancePreview ? (
            <Alert severity={previewBalance === 0 ? 'success' : 'info'} variant="outlined">
              {previewBalance === 0
                ? 'La cuenta quedara liquidada.'
                : `Saldo después del abono: ${formatCurrency(previewBalance)}.`}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={loading} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          disabled={!canSubmit}
          onClick={handleSubmit}
          startIcon={loading ? <CircularProgress color="inherit" size={16} /> : <CheckCircleRoundedIcon />}
          variant="contained"
        >
          {loading ? 'Registrando...' : 'Registrar abono'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
