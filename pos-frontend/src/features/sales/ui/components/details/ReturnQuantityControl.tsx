import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import { Alert, IconButton, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
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
  const [inputValue, setInputValue] = useState(selected ? formatNumber(value) : '0')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const step = getQuantityStep(item)
  const min = Math.min(step, item.returnableQuantity)
  const canDecrease = selected && value > min
  const canIncrease = selected && value < item.returnableQuantity
  const showButtons = item.returnableQuantity > min
  const decimalPattern = step < 1 ? /^\d*(\.\d{0,2})?$/ : /^\d*$/

  useEffect(() => {
    setInputValue(selected ? formatNumber(value) : '0')
    if (!selected || value <= item.returnableQuantity) {
      setErrorMessage(null)
    }
  }, [item.returnableQuantity, selected, value])

  const handleInputChange = (nextValue: string) => {
    if (!decimalPattern.test(nextValue)) {
      return
    }

    setInputValue(nextValue)
    if (nextValue === '' || nextValue === '.') {
      setErrorMessage(null)
      onChange(0)
      return
    }

    const numericValue = Number(nextValue)
    if (!Number.isFinite(numericValue)) {
      setErrorMessage(null)
      onChange(0)
      return
    }

    if (numericValue > item.returnableQuantity) {
      setErrorMessage(`La cantidad máxima disponible para devolución es ${formatNumber(item.returnableQuantity)}.`)
      onChange(Number(numericValue.toFixed(2)))
      return
    }

    setErrorMessage(null)
    onChange(Number(numericValue.toFixed(2)))
  }

  return (
    <Stack spacing={0.75} sx={{ alignItems: 'flex-end' }}>
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
        {showButtons || selected ? (
          <TextField
            disabled={disabled || !selected}
            error={Boolean(errorMessage)}
            inputMode={step < 1 ? 'decimal' : 'numeric'}
            onChange={(event) => handleInputChange(event.target.value)}
            slotProps={{
              input: {
                'aria-label': `Cantidad a devolver de ${item.productName}`,
                sx: {
                  fontWeight: 900,
                  textAlign: 'center',
                  width: 58,
                },
              },
            }}
            size="small"
            sx={{
              '& .MuiInputBase-input': {
                px: 1,
                py: 0.75,
                textAlign: 'center',
              },
            }}
            value={selected ? inputValue : '0'}
          />
        ) : (
          <Typography sx={{ minWidth: 52, textAlign: 'center', fontWeight: 900 }}>
            0
          </Typography>
        )}
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
      {errorMessage ? (
        <Alert severity="warning" sx={{ py: 0, textAlign: 'left' }}>
          {errorMessage}
        </Alert>
      ) : null}
    </Stack>
  )
}
