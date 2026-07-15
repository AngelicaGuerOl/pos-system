import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type {
  CashSession,
  CashSessionClosingSummary,
  CashSessionFilters,
  CloseCashSessionData,
  OpenCashSessionData,
} from '../entities/CashSession'

export type CashSessionRepository = {
  closeCurrent(data: CloseCashSessionData): Promise<CashSessionClosingSummary>
  getAll(filters: CashSessionFilters): Promise<PageResponse<CashSession>>
  getClosingSummary(sessionId: number): Promise<CashSessionClosingSummary>
  getCurrent(): Promise<CashSession | null>
  getCurrentClosingPreview(): Promise<CashSessionClosingSummary>
  open(data: OpenCashSessionData): Promise<CashSession>
}
