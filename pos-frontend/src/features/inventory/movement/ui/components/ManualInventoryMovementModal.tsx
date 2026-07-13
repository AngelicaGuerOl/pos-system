import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import { Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import type { ApiValidationErrors } from '../../../../../shared/api/apiError'
import type { ManualInventoryMovementData } from '../../domain/entities/InventoryMovement'
import { ManualInventoryMovementForm } from './ManualInventoryMovementForm'

export type ManualInventoryMovementMode = 'entry' | 'exit'

type ManualInventoryMovementModalProps = {
  errorMessage?: string | null
  loading?: boolean
  mode: ManualInventoryMovementMode
  onClose: () => void
  onSubmit: (values: ManualInventoryMovementData) => void
  open: boolean
  serverErrors?: ApiValidationErrors
}

const getConfig = (mode: ManualInventoryMovementMode) => {
  if (mode === 'entry') {
    return {
      description: 'Agrega existencias al producto seleccionado.',
      icon: <AddRoundedIcon color="primary" />,
      submitLabel: 'Registrar entrada',
      title: 'Registrar entrada de inventario',
    }
  }

  return {
    description: 'Retira existencias por dano, perdida u otro motivo autorizado.',
    icon: <RemoveRoundedIcon color="error" />,
    submitLabel: 'Registrar salida',
    title: 'Registrar salida de inventario',
  }
}

export const ManualInventoryMovementModal = ({
  errorMessage,
  loading = false,
  mode,
  onClose,
  onSubmit,
  open,
  serverErrors,
}: ManualInventoryMovementModalProps) => {
  const config = getConfig(mode)

  return (
    <Dialog fullWidth maxWidth="md" onClose={loading ? undefined : onClose} open={open}>
      <DialogTitle>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          {config.icon}
          <Stack spacing={0.25}>
            <Typography sx={{ fontWeight: 800 }}>{config.title}</Typography>
            <Typography color="text.secondary" variant="body2">
              {config.description}
            </Typography>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: '14px !important' }}>
        <ManualInventoryMovementForm
          errorMessage={errorMessage}
          loading={loading}
          mode={mode}
          onCancel={onClose}
          onSubmit={onSubmit}
          open={open}
          serverErrors={serverErrors}
          submitLabel={config.submitLabel}
        />
      </DialogContent>
    </Dialog>
  )
}
