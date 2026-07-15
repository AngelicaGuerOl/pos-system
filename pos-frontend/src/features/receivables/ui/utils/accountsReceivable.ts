import type { Receivable } from '../../domain/entities/Receivable'
import type { CustomerDebtStatusFilter, CustomerDebtSummary } from '../types/accountsReceivable'

const isOpenReceivable = (receivable: Receivable): boolean => receivable.outstandingBalance > 0

export const groupReceivablesByCustomer = (
  receivables: Receivable[],
  statusFilter: CustomerDebtStatusFilter,
  search: string,
  customerPhones: Record<number, string | null> = {},
): CustomerDebtSummary[] => {
  const normalizedSearch = search.trim().toLowerCase()
  const grouped = new Map<number, CustomerDebtSummary>()

  receivables.forEach((receivable) => {
    const existing = grouped.get(receivable.customerId)
    if (existing) {
      existing.receivables.push(receivable)
      existing.creditSalesCount += 1
      existing.originalAmount += receivable.originalAmount
      existing.adjustedAmount += receivable.adjustedAmount
      existing.paidAmount += receivable.paidAmount
      existing.outstandingBalance += receivable.outstandingBalance
      existing.status = existing.outstandingBalance > 0 ? 'OPEN' : 'PAID'
      return
    }

    grouped.set(receivable.customerId, {
      adjustedAmount: receivable.adjustedAmount,
      creditSalesCount: 1,
      customerFullName: receivable.customerFullName,
      customerId: receivable.customerId,
      customerPhone: customerPhones[receivable.customerId] ?? null,
      originalAmount: receivable.originalAmount,
      outstandingBalance: receivable.outstandingBalance,
      paidAmount: receivable.paidAmount,
      receivables: [receivable],
      status: isOpenReceivable(receivable) ? 'OPEN' : 'PAID',
    })
  })

  return Array.from(grouped.values())
    .filter((summary) => {
      if (statusFilter === 'OPEN' && summary.outstandingBalance <= 0) {
        return false
      }
      if (statusFilter === 'PAID' && summary.outstandingBalance > 0) {
        return false
      }
      if (!normalizedSearch) {
        return true
      }
      return summary.customerFullName.toLowerCase().includes(normalizedSearch)
        || Boolean(summary.customerPhone?.toLowerCase().includes(normalizedSearch))
    })
    .sort((left, right) => right.outstandingBalance - left.outstandingBalance)
}

export const findReceivablesForPayment = (receivables: Receivable[]): Receivable[] => {
  return receivables
    .filter((receivable) => receivable.outstandingBalance > 0)
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
}
