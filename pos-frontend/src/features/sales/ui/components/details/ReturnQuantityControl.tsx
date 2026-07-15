import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import { IconButton, Stack, Typography } from '@mui/material'
import { formatNumber } from '../../../../../shared/utils/formatters'
import type { SaleItem } from '../../../domain/entities/Sale'
import { clampReturnQuantity, getQuantityStep } from '../../../returns/ui/utils/returnQuantity'

type ReturnQuantityControlProps = {
  disabled: boolean
  item: SaleItem
  onChange: (value: number) => void
  selected: boolean
  value: number
}

export const ReturnQuantityControl = ({
  disabled,
  item,
  onChange,
  selected,
  value,
}: ReturnQuantityControlProps) => {
  const step = getQuantityStep(item)
  const min = Math.min(step, item.returnableQuantity)
  const canDecrease = selected && value > min
  const canIncrease = selected && value < item.returnableQuantity
  const showButtons = item.returnableQuantity > min

  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
      {showButtons ? (
        <IconButton
          aria-label={`Disminuir cantidad de ${item.productName}`}
          disabled={disabled || !canDecrease}
          onClick={() => onChange(clampReturnQuantity(value - step, item))}
          size="small"
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            minHeight: 34,
            minWidth: 34,
            '&:not(:disabled):hover': {
              bgcolor: 'action.hover',
              borderColor: 'text.secondary',
            },
          }}
        >
          <RemoveRoundedIcon fontSize="small" />
        </IconButton>
      ) : null}
      <Typography sx={{ minWidth: 52, textAlign: 'center', fontWeight: 900 }}>
        {selected ? formatNumber(value) : '0'}
      </Typography>
      {showButtons ? (
        <IconButton
          aria-label={`Aumentar cantidad de ${item.productName}`}
          disabled={disabled || !canIncrease}
          onClick={() => onChange(clampReturnQuantity(value + step, item))}
          size="small"
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            minHeight: 34,
            minWidth: 34,
            '&:not(:disabled):hover': {
              bgcolor: 'action.hover',
              borderColor: 'text.secondary',
            },
          }}
        >
          <AddRoundedIcon fontSize="small" />
        </IconButton>
      ) : null}
    </Stack>
  )
}
