import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { formatDateTime } from '../../../../../shared/utils/formatters'
import type { CashSession } from '../../domain/entities/CashSession'

type CurrentCashSessionPanelProps = {
  loading?: boolean
  onCloseCashSession: () => void
  session: CashSession | null
}

export const CurrentCashSessionPanel = ({
  loading = false,
  onCloseCashSession,
  session,
}: CurrentCashSessionPanelProps) => {
  if (!session) {
    return null
  }

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
      <CardContent>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack spacing={0.5}>
            <Typography sx={{ fontWeight: 900 }} variant="h6">
              Sesion de caja #{session.id}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Abierta por {session.openedByUsername} · {formatDateTime(session.openedAt)}
            </Typography>
          </Stack>
          <Button
            color="error"
            disabled={loading}
            onClick={onCloseCashSession}
            startIcon={<LockRoundedIcon />}
            variant="contained"
          >
            Cerrar caja
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
