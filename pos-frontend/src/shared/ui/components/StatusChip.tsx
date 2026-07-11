import { Chip } from '@mui/material'

type StatusChipProps = {
  active: boolean
}

export const StatusChip = ({ active }: StatusChipProps) => {
  return (
    <Chip
      color={active ? 'success' : 'default'}
      label={active ? 'Activo' : 'Inactivo'}
      size="small"
      variant={active ? 'filled' : 'outlined'}
    />
  )
}

