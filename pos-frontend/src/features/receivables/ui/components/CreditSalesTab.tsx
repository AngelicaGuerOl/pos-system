import { Stack, TablePagination, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { CustomerAccountSale } from '../types/accountsReceivable'
import { CreditSaleGroup } from './CreditSaleGroup'

const PAGE_SIZE_OPTIONS = [5, 10]

type CreditSalesTabProps = {
  sales: CustomerAccountSale[]
}

export const CreditSalesTab = ({ sales }: CreditSalesTabProps) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE_OPTIONS[0])

  const orderedSales = useMemo(() => {
    return [...sales].sort((left, right) => {
      const leftHasBalance = left.receivable.outstandingBalance > 0 ? 1 : 0
      const rightHasBalance = right.receivable.outstandingBalance > 0 ? 1 : 0

      if (leftHasBalance !== rightHasBalance) {
        return rightHasBalance - leftHasBalance
      }

      return new Date(right.receivable.createdAt).getTime() - new Date(left.receivable.createdAt).getTime()
    })
  }, [sales])

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(orderedSales.length / rowsPerPage) - 1)

    if (page > maxPage) {
      setPage(maxPage)
    }
  }, [orderedSales.length, page, rowsPerPage])

  const visibleSales = orderedSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleRowsPerPageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number(event.target.value))
    setPage(0)
  }

  if (sales.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        No hay compras fiadas registradas.
      </Typography>
    )
  }

  return (
    <Stack spacing={1.5}>
      {visibleSales.map((accountSale) => (
        <CreditSaleGroup accountSale={accountSale} key={accountSale.receivable.id} />
      ))}

      <TablePagination
        component="div"
        count={orderedSales.length}
        labelRowsPerPage="Ventas por página"
        onPageChange={(_event, nextPage) => setPage(nextPage)}
        onRowsPerPageChange={handleRowsPerPageChange}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={PAGE_SIZE_OPTIONS}
      />
    </Stack>
  )
}
