import type { PageResponse } from '../../../../shared/types/PageResponse'
import type {
  CancelSaleData,
  CreateSaleData,
  Sale,
  SaleCancellation,
  SaleHistoryFilters,
  SaleSummary,
} from '../entities/Sale'

export type SaleRepository = {
  cancelSale(id: number, data: CancelSaleData): Promise<SaleCancellation>
  createSale(data: CreateSaleData): Promise<Sale>
  getCurrentSessionSales(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>>
  getSalesHistory(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>>
  getById(id: number): Promise<Sale>
}
