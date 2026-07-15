import {
  Alert,
  Box,
  Checkbox,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { formatCurrency, formatNumber } from '../../../../../shared/utils/formatters'
import type { NormalizedApiError } from '../../../../../shared/api/apiError'
import type { Sale, SaleItem } from '../../../domain/entities/Sale'
import { ReturnQuantityControl } from './ReturnQuantityControl'

export type ReturnSummary = {
  itemCount: number
  total: number
  units: number
}

type SaleReturnFormProps = {
  apiError: NormalizedApiError | null
  disabled: boolean
  estimatedCreditBalance: number | null
  formError: string | null
  onQuantityChange: (item: SaleItem, quantity: number) => void
  onReasonChange: (reason: string) => void
  onToggleItem: (item: SaleItem, checked: boolean) => void
  quantities: Record<number, number>
  reason: string
  items: SaleItem[]
  returnSummary: ReturnSummary
  sale: Sale
  selectedIds: Set<number>
}

export const SaleReturnForm = ({
  apiError,
  disabled,
  estimatedCreditBalance,
  formError,
  onQuantityChange,
  onReasonChange,
  onToggleItem,
  quantities,
  reason,
  items,
  returnSummary,
  sale,
  selectedIds,
}: SaleReturnFormProps) => (
  <>
    {formError ? <Alert severity="error">{formError}</Alert> : null}
    {apiError ? <Alert severity="error">{apiError.message}</Alert> : null}

    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">Devolver</TableCell>
            <TableCell>Producto</TableCell>
            <TableCell align="right">Precio</TableCell>
            <TableCell align="right">Cantidad a devolver</TableCell>
            <TableCell align="right">Subtotal</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const selected = selectedIds.has(item.id)
            const quantity = quantities[item.id] ?? 0
            const subtotal = selected ? item.unitPrice * quantity : 0
            const withoutAvailability = item.returnableQuantity <= 0
            const controlsDisabled = disabled || withoutAvailability

            return (
              <TableRow
                hover={!controlsDisabled}
                key={item.id}
                sx={{ bgcolor: selected ? 'action.selected' : 'inherit' }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected}
                    disabled={controlsDisabled}
                    onChange={(event) => onToggleItem(item, event.target.checked)}
                    slotProps={{
                      input: {
                        'aria-label': `Devolver ${item.productName}`,
                      },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 800 }}>{item.productName}</Typography>
                  {item.productBarcode ? (
                    <Typography color="text.secondary" sx={{ fontFamily: 'monospace' }} variant="body2">
                      {item.productBarcode}
                    </Typography>
                  ) : null}
                  {withoutAvailability ? (
                    <Typography color="text.secondary" variant="body2">
                      Sin unidades disponibles para devolver
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell align="right">
                  <ReturnQuantityControl
                    disabled={controlsDisabled}
                    item={item}
                    onChange={(value) => onQuantityChange(item, value)}
                    selected={selected}
                    value={quantity}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography sx={{ fontWeight: 900 }}>{formatCurrency(subtotal)}</Typography>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>

    <TextField
      disabled={disabled}
      error={Boolean(reason.trim().length > 0 && reason.trim().length < 3)}
      fullWidth
      helperText={`${reason.trim().length}/255`}
      label="Motivo de la devolución"
      multiline
      onChange={(event) => onReasonChange(event.target.value)}
      required
      rows={3}
      value={reason}
    />

    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        px: 2,
        py: 1.5,
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant="body2">
          {returnSummary.itemCount} producto{returnSummary.itemCount === 1 ? ' seleccionado' : 's seleccionados'} · {formatNumber(returnSummary.units)} {returnSummary.units === 1 ? 'unidad' : 'unidades'} · Total: {formatCurrency(returnSummary.total)}
        </Typography>
        {sale.saleType === 'CREDIT' && sale.receivable ? (
          <Typography color="text.secondary" variant="body2">
            El saldo pendiente disminuirá de {formatCurrency(sale.receivable.outstandingBalance)} a {formatCurrency(Math.max(estimatedCreditBalance ?? 0, 0))}.
          </Typography>
        ) : null}
      </Stack>
    </Box>
  </>
)
