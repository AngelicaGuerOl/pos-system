import { Box, Typography } from '@mui/material'
import type { CustomerAccountSale } from '../types/accountsReceivable'
import { CreditSaleHeader } from './CreditSaleHeader'
import { CreditSaleProductsTable } from './CreditSaleProductsTable'

type CreditSaleGroupProps = {
  accountSale: CustomerAccountSale
}

export const CreditSaleGroup = ({ accountSale }: CreditSaleGroupProps) => {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <CreditSaleHeader receivable={accountSale.receivable} />

      {accountSale.sale ? (
        <CreditSaleProductsTable sale={accountSale.sale} />
      ) : (
        <Typography color="text.secondary" sx={{ p: 2 }} variant="body2">
          No fue posible cargar los productos de esta venta.
        </Typography>
      )}
    </Box>
  )
}
