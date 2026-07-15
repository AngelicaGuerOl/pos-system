import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { formatCurrency, formatNumber } from '../../../../../shared/utils/formatters'
import { PRODUCT_UNIT_LABELS } from '../../../../catalog/products'
import type { Sale } from '../../../domain/entities/Sale'

type SaleItemsTableProps = {
  sale: Sale
}

export const SaleItemsTable = ({ sale }: SaleItemsTableProps) => (
  <Stack spacing={1}>
    <Typography sx={{ fontWeight: 900 }}>Artículos vendidos</Typography>
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Producto</TableCell>
            <TableCell align="right">Cantidad</TableCell>
            <TableCell align="right">Precio</TableCell>
            <TableCell align="right">Subtotal</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sale.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Typography sx={{ fontWeight: 800 }}>{item.productName}</Typography>
                {item.productBarcode ? (
                  <Typography color="text.secondary" sx={{ fontFamily: 'monospace' }} variant="body2">
                    {item.productBarcode}
                  </Typography>
                ) : null}
              </TableCell>
              <TableCell align="right">
                {formatNumber(item.soldQuantity)} {PRODUCT_UNIT_LABELS[item.productUnit] ?? item.productUnit}
              </TableCell>
              <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
              <TableCell align="right">{formatCurrency(item.lineTotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Stack>
)
