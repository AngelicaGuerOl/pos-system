import type { CashSession, OpenCashSessionData } from '../entities/CashSession'

export type CashSessionRepository = {
  getCurrent(): Promise<CashSession | null>
  open(data: OpenCashSessionData): Promise<CashSession>
}
