import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { formatCurrency, formatNumber } from '../../../../shared/utils/formatters'
import { PRODUCT_UNIT_LABELS } from '../../../catalog/products'
import type { ProductUnit } from '../../../catalog/products'
import type { Sale } from '../../../sales/domain/entities/Sale'

type CreditSaleProductsTableProps = {
  sale: Sale
}

export const CreditSaleProductsTable = ({ sale }: CreditSaleProductsTableProps) => {
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small">
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
              <TableCell sx={{ minWidth: 220 }}>
                <Typography sx={{ fontWeight: 800 }}>{item.productName}</Typography>
                {item.productBarcode ? (
                  <Typography color="text.secondary" sx={{ fontFamily: 'monospace' }} variant="body2">
                    {item.productBarcode}
                  </Typography>
                ) : null}
              </TableCell>
              <TableCell align="right">{formatQuantity(item.soldQuantity, item.productUnit)}</TableCell>
              <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
              <TableCell align="right">{formatCurrency(item.lineTotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

const formatQuantity = (quantity: number, unit: ProductUnit): string => {
  const formattedQuantity = formatNumber(quantity)
  const unitLabel = PRODUCT_UNIT_LABELS[unit] ?? unit

  if (quantity === 1) {
    return `${formattedQuantity} ${unitLabel}`
  }

  const pluralUnitLabels: Partial<Record<ProductUnit, string>> = {
    KG: 'Kilogramos',
    LITER: 'Litros',
    PACKAGE: 'Paquetes',
    PIECE: 'Piezas',
  }

  return `${formattedQuantity} ${pluralUnitLabels[unit] ?? unitLabel}`
}
