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
import type { ApiValidationErrors } from '../../../../../shared/api/apiError'
import { formatCurrency } from '../../../../../shared/utils/formatters'
import type { ReceivableDetail } from '../../../domain/entities/Receivable'
import type { CreateReceivablePaymentRequest } from '../../domain/entities/ReceivablePayment'

type CreateReceivablePaymentDialogProps = {
  errorMessage?: string | null
  loading: boolean
  onClose: () => void
  onSubmit: (request: CreateReceivablePaymentRequest) => void
  open: boolean
  receivable: ReceivableDetail
  serverErrors?: ApiValidationErrors
}

type FormErrors = {
  amount?: string
  notes?: string
}

const MONEY_PATTERN = /^\d+(\.\d{0,2})?$/

const toAmount = (value: string): number | null => {
  const normalizedValue = value.trim()
  if (!normalizedValue || !MONEY_PATTERN.test(normalizedValue)) {
    return null
  }

  const amount = Number(normalizedValue)
  return Number.isFinite(amount) ? amount : null
}

export const CreateReceivablePaymentDialog = ({
  errorMessage,
  loading,
  onClose,
  onSubmit,
  open,
  receivable,
  serverErrors,
}: CreateReceivablePaymentDialogProps) => {
  const amountInputRef = useRef<HTMLInputElement | null>(null)
  const [amountText, setAmountText] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      setAmountText('')
      setNotes('')
      setErrors({})
      window.setTimeout(() => amountInputRef.current?.focus(), 50)
    }
  }, [open])

  const amount = useMemo(() => toAmount(amountText), [amountText])
  const previewBalance = amount === null
    ? receivable.outstandingBalance
    : Math.max(receivable.outstandingBalance - amount, 0)

  const validate = (): CreateReceivablePaymentRequest | null => {
    const nextErrors: FormErrors = {}
    const nextAmount = toAmount(amountText)
    const trimmedNotes = notes.trim()

    if (nextAmount === null) {
      nextErrors.amount = 'Ingresa un monto valido con maximo 2 decimales'
    } else if (nextAmount <= 0) {
      nextErrors.amount = 'El monto debe ser mayor que cero'
    } else if (nextAmount > receivable.outstandingBalance) {
      nextErrors.amount = 'El monto no puede superar el saldo pendiente'
    }

    if (trimmedNotes.length > 255) {
      nextErrors.notes = 'Las notas deben tener maximo 255 caracteres'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || nextAmount === null) {
      return null
    }

    return {
      amount: nextAmount,
      notes: trimmedNotes ? trimmedNotes : null,
    }
  }

  const handleSubmit = () => {
    const request = validate()
    if (request) {
      onSubmit(request)
    }
  }

  const amountError = errors.amount ?? serverErrors?.amount
  const notesError = errors.notes ?? serverErrors?.notes

  return (
    <Dialog fullWidth maxWidth="sm" onClose={loading ? undefined : onClose} open={open}>
      <DialogTitle>Registrar abono</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <Stack spacing={1}>
            <Typography color="text.secondary" variant="body2">
              Cliente: <strong>{receivable.customer.fullName}</strong>
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Venta: <strong>#{receivable.folio}</strong>
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Saldo pendiente
            </Typography>
            <Typography sx={{ fontWeight: 900 }} variant="h4">
              {formatCurrency(receivable.outstandingBalance)}
            </Typography>
          </Stack>

          <TextField
            disabled={loading}
            error={Boolean(amountError)}
            fullWidth
            helperText={amountError ?? 'No puede superar el saldo pendiente.'}
            inputRef={amountInputRef}
            label="Monto del abono"
            onChange={(event) => setAmountText(event.target.value)}
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

          <Alert severity={amount !== null && amount === receivable.outstandingBalance ? 'success' : 'info'}>
            {amount !== null && amount === receivable.outstandingBalance
              ? 'Este abono liquidara completamente la cuenta.'
              : `Después del abono quedara un saldo de ${formatCurrency(previewBalance)}.`}
          </Alert>

          <TextField
            disabled={loading}
            error={Boolean(notesError)}
            fullWidth
            helperText={notesError ?? `${notes.trim().length}/255`}
            label="Notas"
            multiline
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            value={notes}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={loading} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          disabled={loading}
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
