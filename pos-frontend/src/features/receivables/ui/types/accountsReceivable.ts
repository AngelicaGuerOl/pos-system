import type { Receivable } from '../../domain/entities/Receivable'
import type { ReceivablePayment } from '../../payment/domain/entities/ReceivablePayment'
import type { Sale } from '../../../sales/domain/entities/Sale'

export type CustomerDebtStatusFilter = 'OPEN' | 'PAID' | 'ALL'

export type CustomerDebtSummary = {
  customerId: number
  customerFullName: string
  customerPhone: string | null
  receivables: Receivable[]
  creditSalesCount: number
  originalAmount: number
  adjustedAmount: number
  paidAmount: number
  outstandingBalance: number
  status: 'OPEN' | 'PAID'
}

export type CustomerAccountSale = {
  receivable: Receivable
  sale: Sale | null
}

export type CustomerAccountData = {
  customerId: number
  customerFullName: string
  receivables: Receivable[]
  sales: CustomerAccountSale[]
  payments: ReceivablePayment[]
  adjustedAmount: number
  paidAmount: number
  outstandingBalance: number
}
