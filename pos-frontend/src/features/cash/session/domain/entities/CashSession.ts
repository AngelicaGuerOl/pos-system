export type CashSessionStatus = 'OPEN' | 'CLOSED'

export type CashSession = {
  id: number
  openedByUserId: number
  openedByUsername: string
  openingAmount: number
  openedAt: string
  status: CashSessionStatus
  closedByUserId: number | null
  closedByUsername: string | null
  closedAt: string | null
  expectedCash: number | null
  countedCash: number | null
  cashDifference: number | null
}

export type OpenCashSessionData = {
  openingAmount: number
}
