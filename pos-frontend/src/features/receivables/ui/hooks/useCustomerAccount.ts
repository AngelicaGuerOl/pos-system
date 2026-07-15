import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { receivableDependencies } from '../../dependencies'
import type { Receivable } from '../../domain/entities/Receivable'
import { saleDependencies } from '../../../sales/dependencies'
import type { CustomerAccountData, CustomerAccountSale } from '../types/accountsReceivable'

const PAGE_SIZE = 50

export const useCustomerAccount = (customerId: number | null) => {
  const [account, setAccount] = useState<CustomerAccountData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const fetchAccount = useCallback(async () => {
    if (!customerId) {
      setAccount(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const page = await receivableDependencies.getCustomerReceivablesUseCase.execute(customerId, {
        page: 0,
        size: PAGE_SIZE,
        sort: 'createdAt,DESC',
      })
      const receivables = page.content
      const sales = await Promise.all<CustomerAccountSale>(
        receivables.map(async (receivable) => {
          try {
            return {
              receivable,
              sale: await saleDependencies.getSaleByIdUseCase.execute(receivable.saleId),
            }
          } catch {
            return { receivable, sale: null }
          }
        }),
      )
      const paymentPages = await Promise.all(
        receivables.map((receivable) =>
          receivableDependencies.getReceivablePaymentsUseCase.execute(receivable.id, {
            page: 0,
            size: PAGE_SIZE,
            sort: 'createdAt,DESC',
          }),
        ),
      )
      const payments = paymentPages
        .flatMap((paymentPage) => paymentPage.content)
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())

      setAccount({
        adjustedAmount: sumReceivables(receivables, 'adjustedAmount'),
        customerFullName: receivables[0]?.customerFullName ?? 'Cliente',
        customerId,
        outstandingBalance: sumReceivables(receivables, 'outstandingBalance'),
        paidAmount: sumReceivables(receivables, 'paidAmount'),
        payments,
        receivables,
        sales,
      })
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      setAccount(null)
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    void fetchAccount()
  }, [fetchAccount])

  return {
    account,
    error,
    loading,
    refetch: fetchAccount,
  }
}

const sumReceivables = (
  receivables: Receivable[],
  field: 'adjustedAmount' | 'paidAmount' | 'outstandingBalance',
): number => {
  return receivables.reduce((total, receivable) => total + receivable[field], 0)
}
