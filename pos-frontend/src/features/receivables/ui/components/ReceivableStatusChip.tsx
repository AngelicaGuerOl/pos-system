import { Chip } from '@mui/material'
import {
  RECEIVABLE_STATUS_LABELS,
  type ReceivableStatus,
} from '../../domain/entities/Receivable'

type ReceivableStatusChipProps = {
  status: ReceivableStatus
}

const getColor = (status: ReceivableStatus): 'default' | 'success' | 'warning' | 'info' => {
  if (status === 'PAID') {
    return 'success'
  }
  if (status === 'PARTIALLY_PAID') {
    return 'info'
  }
  if (status === 'PENDING') {
    return 'warning'
  }
  return 'default'
}

export const ReceivableStatusChip = ({ status }: ReceivableStatusChipProps) => (
  <Chip
    color={getColor(status)}
    label={RECEIVABLE_STATUS_LABELS[status]}
    size="small"
    variant={status === 'CANCELLED' ? 'outlined' : 'filled'}
  />
)
