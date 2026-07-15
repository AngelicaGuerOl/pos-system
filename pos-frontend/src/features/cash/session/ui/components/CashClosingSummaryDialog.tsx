import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import type { NormalizedApiError } from '../../../../../shared/api/apiError'
import type { CashSessionClosingSummary } from '../../domain/entities/CashSession'
import { CashClosingSummary } from './CashClosingSummary'

type CashClosingSummaryDialogProps = {
  error: NormalizedApiError | null
  loading: boolean
  onClose: () => void
  open: boolean
  summary: CashSessionClosingSummary | null
}

export const CashClosingSummaryDialog = ({
  error,
  loading,
  onClose,
  open,
  summary,
}: CashClosingSummaryDialogProps) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog fullScreen={fullScreen} fullWidth maxWidth="lg" onClose={onClose} open={open} scroll="paper">
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 900 }} variant="h6">
              Corte de caja
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Resumen definitivo de la sesion cerrada.
            </Typography>
          </Box>
          <IconButton aria-label="Cerrar corte" onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : null}
          {summary ? <CashClosingSummary summary={summary} /> : null}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
