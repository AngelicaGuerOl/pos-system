import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { ApiValidationErrors } from '../../../../../shared/api/apiError'
import type { ManualCashMovementData } from '../../domain/entities/CashMovement'
import type { ManualCashMovementMode } from '../hooks/useRegisterCashMovement'
import {
  manualCashMovementSchema,
  type ManualCashMovementFormValues,
} from '../schemas/manualCashMovementSchema'

type ManualCashMovementModalProps = {
  errorMessage?: string | null
  loading?: boolean
  mode: ManualCashMovementMode
  onClose: () => void
  onSubmit: (values: ManualCashMovementData) => void
  open: boolean
  serverErrors?: ApiValidationErrors
}

const getTitle = (mode: ManualCashMovementMode): string => {
  return mode === 'entry' ? 'Registrar entrada' : 'Registrar salida'
}

const getDescriptionLabel = (mode: ManualCashMovementMode): string => {
  return mode === 'entry' ? 'Motivo de la entrada' : 'Motivo de la salida'
}

export const ManualCashMovementModal = ({
  errorMessage,
  loading = false,
  mode,
  onClose,
  onSubmit,
  open,
  serverErrors,
}: ManualCashMovementModalProps) => {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ManualCashMovementFormValues>({
    defaultValues: {
      amount: 0,
      description: '',
    },
    resolver: zodResolver(manualCashMovementSchema),
  })

  useEffect(() => {
    if (open) {
      reset({ amount: 0, description: '' })
    }
  }, [open, reset])

  const amountError = errors.amount?.message ?? serverErrors?.amount
  const descriptionError = errors.description?.message ?? serverErrors?.description

  return (
    <Dialog fullWidth maxWidth="sm" onClose={loading ? undefined : onClose} open={open}>
      <DialogTitle sx={{ fontWeight: 800 }}>{getTitle(mode)}</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="manual-cash-movement-form"
          noValidate
          onSubmit={handleSubmit((values) => {
            onSubmit({
              amount: values.amount,
              description: values.description.trim(),
            })
          })}
          spacing={2.5}
          sx={{ pt: 1 }}
        >
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <TextField
            autoFocus
            disabled={loading}
            error={Boolean(amountError)}
            fullWidth
            helperText={amountError}
            label="Monto"
            slotProps={{
              htmlInput: {
                min: 0,
                step: '0.01',
              },
              input: {
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              },
            }}
            type="number"
            {...register('amount', { valueAsNumber: true })}
          />

          <TextField
            disabled={loading}
            error={Boolean(descriptionError)}
            fullWidth
            helperText={descriptionError}
            label={getDescriptionLabel(mode)}
            multiline
            minRows={3}
            {...register('description')}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button disabled={loading} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          disabled={loading}
          form="manual-cash-movement-form"
          startIcon={mode === 'entry' ? <AddRoundedIcon /> : <RemoveRoundedIcon />}
          type="submit"
          variant="contained"
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
