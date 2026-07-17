import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { NormalizedApiError } from '../../../../../shared/api/apiError'
import { formatCurrency, formatDateTime } from '../../../../../shared/utils/formatters'
import type { CashSessionClosingSummary, CloseCashSessionData } from '../../domain/entities/CashSession'

type CloseCashSessionDialogProps = {
  closing: boolean
  error: NormalizedApiError | null
  onClose: () => void
  onSubmit: (data: CloseCashSessionData) => void
  open: boolean
  preview: CashSessionClosingSummary | null
}

type FormErrors = {
  countedAmount?: string
  notes?: string
}

type AmountRowProps = {
  label: string
  value: number
  strong?: boolean
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

const differenceText = (differenceCents: number | null): string => {
  if (differenceCents === null) {
    return 'Pendiente de calcular'
  }

  const amount = Math.abs(differenceCents) / 100

  if (differenceCents === 0) {
    return 'Caja cuadrada'
  }

  return differenceCents > 0
    ? `Sobrante de ${formatCurrency(amount)}`
    : `Faltante de ${formatCurrency(amount)}`
}

const differenceSeverity = (differenceCents: number | null): 'info' | 'success' | 'warning' | 'error' => {
  if (differenceCents === null) {
    return 'info'
  }

  if (differenceCents === 0) {
    return 'success'
  }

  return differenceCents > 0 ? 'warning' : 'error'
}

const AmountRow = ({ label, strong = false, value }: AmountRowProps) => (
  <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
    <Typography color={strong ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: strong ? 800 : 600 }} variant="body2">
      {label}
    </Typography>
    <Typography sx={{ fontWeight: strong ? 900 : 800, whiteSpace: 'nowrap' }} variant="body2">
      {formatCurrency(value)}
    </Typography>
  </Stack>
)

const SectionCard = ({ children, title }: { children: ReactNode; title: string }) => (
  <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
    <CardContent>
      <Stack spacing={1.5}>
        <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
        {children}
      </Stack>
    </CardContent>
  </Card>
)

const FormulaItem = ({
  label,
  strong = false,
  value,
}: {
  label: string
  strong?: boolean
  value: number
}) => (
  <Stack
    spacing={0.25}
    sx={{
      borderLeft: strong ? 1 : 0,
      borderColor: 'divider',
      pl: strong ? { xs: 0, sm: 1.5 } : 0,
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: strong ? 950 : 800,
          whiteSpace: 'nowrap',
        }}
        variant={strong ? 'subtitle1' : 'body2'}
      >
        {formatCurrency(value)}
      </Typography>
    </Box>
  </Stack>
)

export const CloseCashSessionDialog = ({
  closing,
  error,
  onClose,
  onSubmit,
  open,
  preview,
}: CloseCashSessionDialogProps) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const amountInputRef = useRef<HTMLInputElement | null>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [countedAmountText, setCountedAmountText] = useState('')
  const [notesText, setNotesText] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      setStep(1)
      setCountedAmountText('')
      setNotesText('')
      setErrors({})
      return
    }

    if (!closing) {
      setStep(1)
      setCountedAmountText('')
      setNotesText('')
      setErrors({})
    }
  }, [closing, open])

  const countedAmount = useMemo(() => toAmount(countedAmountText), [countedAmountText])
  const expectedAmount = preview?.cashSummary.expectedAmount ?? 0
  const estimatedDifferenceCents = countedAmount === null
    ? null
    : toCents(countedAmount) - toCents(expectedAmount)
  const notesLength = notesText.length
  const formValid = Boolean(
    countedAmount !== null
      && countedAmount >= 0
      && notesLength <= 255,
  )

  useEffect(() => {
    if (step === 2) {
      window.setTimeout(() => amountInputRef.current?.focus(), 50)
    }
  }, [step])

  const resetAndClose = () => {
    if (closing) {
      return
    }

    setStep(1)
    setCountedAmountText('')
    setNotesText('')
    setErrors({})
    onClose()
  }

  const validate = (): CloseCashSessionData | null => {
    const nextErrors: FormErrors = {}
    const nextAmount = toAmount(countedAmountText)
    const trimmedNotes = notesText.trim()

    if (nextAmount === null) {
      nextErrors.countedAmount = 'Ingresa un monto valido con maximo 2 decimales.'
    } else if (nextAmount < 0) {
      nextErrors.countedAmount = 'El efectivo contado debe ser cero o positivo.'
    }

    if (notesText.length > 255) {
      nextErrors.notes = 'Las observaciones deben tener maximo 255 caracteres.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || nextAmount === null) {
      return null
    }

    return {
      countedAmount: nextAmount,
      notes: trimmedNotes.length > 0 ? trimmedNotes : null,
    }
  }

  const handleSubmit = () => {
    const request = validate()
    if (request) {
      onSubmit(request)
    }
  }

  const subtitle = step === 1
    ? 'Paso 1 de 2 · Revisa la información antes de contar el efectivo.'
    : 'Paso 2 de 2 · Captura el efectivo físico encontrado en caja.'

  return (
    <Dialog
      fullScreen={fullScreen}
      fullWidth
      maxWidth="lg"
      onClose={closing ? undefined : resetAndClose}
      open={open}
      scroll="paper"
      slotProps={{
        paper: {
          sx: {
            maxHeight: '92vh',
          },
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Stack spacing={0.5}>
          <Typography sx={{ fontWeight: 900 }} variant="h6">
            Cerrar caja
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {subtitle}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack spacing={2.5}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}

          {!preview ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : null}

          {preview && step === 1 ? (
            <>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography color="text.secondary" variant="caption">
                    Sesión
                  </Typography>
                  <Typography sx={{ fontWeight: 900 }}>#{preview.sessionId}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography color="text.secondary" variant="caption">
                    Apertura
                  </Typography>
                  <Typography sx={{ fontWeight: 800 }}>{formatDateTime(preview.openedAt)}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography color="text.secondary" variant="caption">
                    Usuario
                  </Typography>
                  <Typography sx={{ fontWeight: 800 }}>{preview.openedByUsername}</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography color="text.secondary" variant="caption">
                    Fondo inicial
                  </Typography>
                  <Typography sx={{ fontWeight: 900 }}>{formatCurrency(preview.openingAmount)}</Typography>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <SectionCard title="Resumen de ventas">
                    <AmountRow label="Ventas en efectivo" value={preview.salesSummary.cashSalesAmount} />
                    <AmountRow label="Ventas fiadas" value={preview.salesSummary.creditSalesAmount} />
                    <Divider />
                    <AmountRow label="Total vendido" strong value={preview.salesSummary.totalSalesAmount} />
                    <Typography color="text.secondary" variant="caption">
                      Las ventas fiadas son informativas y no se suman al efectivo esperado.
                    </Typography>
                  </SectionCard>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <SectionCard title="Operaciones procesadas">
                    <AmountRow label="Devoluciones procesadas" value={preview.operationsSummary.returnsProcessedAmount} />
                    <AmountRow label="Reembolso en efectivo por devoluciones" value={preview.operationsSummary.returnCashRefundAmount} />
                    <AmountRow label="Cancelaciones procesadas" value={preview.operationsSummary.cancellationsProcessedAmount} />
                    <AmountRow label="Reembolso en efectivo por cancelaciones" value={preview.operationsSummary.cancellationCashRefundAmount} />
                    <Typography color="text.secondary" variant="caption">
                      Algunas operaciones fiadas ajustan una deuda sin generar salida de efectivo.
                    </Typography>
                  </SectionCard>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <SectionCard title="Movimientos de efectivo">
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={1}>
                          <Typography sx={{ fontWeight: 800 }} variant="body2">
                            Entradas
                          </Typography>
                          <AmountRow label="Ventas en efectivo" value={preview.cashSummary.cashSalesAmount} />
                          <AmountRow label="Abonos de cuentas por cobrar" value={preview.cashSummary.receivablePaymentsAmount} />
                          <AmountRow label="Entradas manuales" value={preview.cashSummary.manualInflowsAmount} />
                          <Divider />
                          <AmountRow label="Total de entradas" strong value={preview.cashSummary.totalInflows} />
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={1}>
                          <Typography sx={{ fontWeight: 800 }} variant="body2">
                            Salidas
                          </Typography>
                          <AmountRow label="Salidas manuales" value={preview.cashSummary.manualOutflowsAmount} />
                          <AmountRow label="Reembolsos por devoluciones" value={preview.cashSummary.saleRefundsAmount} />
                          <AmountRow label="Reembolsos por cancelaciones" value={preview.cashSummary.saleCancellationRefundsAmount} />
                          <Divider />
                          <AmountRow label="Total de salidas" strong value={preview.cashSummary.totalOutflows} />
                        </Stack>
                      </Grid>
                    </Grid>

                    <Divider />

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={{ xs: 1, sm: 1.5 }}
                      sx={{
                        alignItems: { xs: 'stretch', sm: 'center' },
                        flexWrap: 'wrap',
                      }}
                    >
                      <FormulaItem label="Fondo inicial" value={preview.openingAmount} />
                      <FormulaItem label="+ Entradas" value={preview.cashSummary.totalInflows} />
                      <FormulaItem label="− Salidas" value={preview.cashSummary.totalOutflows} />
                      <FormulaItem
                        label="= Efectivo esperado"
                        strong
                        value={preview.cashSummary.expectedAmount}
                      />
                    </Stack>
                  </SectionCard>
                </Grid>
              </Grid>
            </>
          ) : null}

          {preview && step === 2 ? (
            <Stack spacing={2}>
              <Card elevation={0} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <CardContent>
                  <Stack spacing={0.5}>
                    <Typography sx={{ fontWeight: 800 }} variant="body2">
                      Efectivo esperado
                    </Typography>
                    <Typography sx={{ fontWeight: 900 }} variant="h4">
                      {formatCurrency(preview.cashSummary.expectedAmount)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>

              <TextField
                disabled={closing}
                error={Boolean(errors.countedAmount)}
                fullWidth
                helperText={errors.countedAmount ?? 'Cuenta todo el efectivo que se encuentra físicamente en la caja.'}
                inputRef={amountInputRef}
                label="Efectivo contado"
                onChange={(event) => {
                  setCountedAmountText(event.target.value)
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
                value={countedAmountText}
              />

              <Alert severity={differenceSeverity(estimatedDifferenceCents)} variant="outlined">
                {differenceText(estimatedDifferenceCents)}
              </Alert>

              <TextField
                disabled={closing}
                error={Boolean(errors.notes)}
                fullWidth
                helperText={errors.notes ?? `${notesLength}/255 caracteres`}
                label="Observaciones"
                maxRows={3}
                minRows={3}
                multiline
                onChange={(event) => {
                  setNotesText(event.target.value)
                  setErrors({})
                }}
                value={notesText}
              />

              <Alert severity="warning" variant="outlined">
                Después de cerrar la caja no podrán registrarse nuevas ventas ni movimientos en esta sesión.
              </Alert>
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ borderTop: 1, borderColor: 'divider', px: 2.5, py: 1.5 }}>
        {step === 1 ? (
          <>
            <Button disabled={closing} onClick={resetAndClose}>
              Cancelar
            </Button>
            <Button disabled={!preview || closing} onClick={() => setStep(2)} variant="contained">
              Continuar al conteo
            </Button>
          </>
        ) : (
          <>
            <Button disabled={closing} onClick={() => setStep(1)}>
              Atrás
            </Button>
            <Button
              color="error"
              disabled={closing || !preview || !formValid}
              onClick={handleSubmit}
              startIcon={closing ? <CircularProgress color="inherit" size={16} /> : <LockRoundedIcon />}
              variant="contained"
            >
              {closing ? 'Cerrando...' : 'Cerrar caja'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
