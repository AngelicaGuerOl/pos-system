import type { PageResponse } from '../../../../shared/types/PageResponse'
import type { CreateCashSaleData, Sale, SaleHistoryFilters, SaleSummary } from '../entities/Sale'

export type SaleRepository = {
  createCashSale(data: CreateCashSaleData): Promise<Sale>
  getCurrentSessionSales(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>>
  getSalesHistory(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>>
  getById(id: number): Promise<Sale>
}
