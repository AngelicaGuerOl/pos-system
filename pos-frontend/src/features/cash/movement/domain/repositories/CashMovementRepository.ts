import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type {
  CashMovement,
  CashMovementFilters,
  CurrentCashSummary,
  ManualCashMovementData,
} from '../entities/CashMovement'

export type CashMovementRepository = {
  getCurrent(filters?: CashMovementFilters): Promise<PageResponse<CashMovement>>
  getCurrentSummary(): Promise<CurrentCashSummary>
  registerEntry(data: ManualCashMovementData): Promise<CashMovement>
  registerExit(data: ManualCashMovementData): Promise<CashMovement>
}
