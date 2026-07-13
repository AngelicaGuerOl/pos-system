import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded'
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import type { ApiValidationErrors } from '../../../../../shared/api/apiError'
import type { OpenCashSessionData } from '../../domain/entities/CashSession'
import {
  openCashSessionSchema,
  type OpenCashSessionFormValues,
} from '../schemas/openCashSessionSchema'

type OpenCashSessionFormProps = {
  errorMessage?: string | null
  loading?: boolean
  onSubmit: (values: OpenCashSessionData) => void
  serverErrors?: ApiValidationErrors
}

export const OpenCashSessionForm = ({
  errorMessage,
  loading = false,
  onSubmit,
  serverErrors,
}: OpenCashSessionFormProps) => {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<OpenCashSessionFormValues>({
    defaultValues: {
      openingAmount: 0,
    },
    resolver: zodResolver(openCashSessionSchema),
  })

  const openingAmountError = errors.openingAmount?.message ?? serverErrors?.openingAmount

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit((values) => {
        onSubmit({
          openingAmount: values.openingAmount,
        })
      })}
    >
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography sx={{ fontWeight: 800 }} variant="h5">
            Apertura de caja
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Registra el efectivo inicial para comenzar operaciones.
          </Typography>
        </Stack>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <TextField
          autoFocus
          disabled={loading}
          error={Boolean(openingAmountError)}
          fullWidth
          helperText={openingAmountError ?? 'Puedes iniciar con 0.00 si la caja no tiene efectivo.'}
          label="Efectivo inicial"
          slotProps={{
            htmlInput: {
              min: 0,
              step: '0.01',
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoneyRoundedIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          type="number"
          {...register('openingAmount', { valueAsNumber: true })}
        />

        <Button
          disabled={loading}
          size="large"
          startIcon={<LockOpenRoundedIcon />}
          type="submit"
          variant="contained"
        >
          Abrir caja
        </Button>
      </Stack>
    </Box>
  )
}
