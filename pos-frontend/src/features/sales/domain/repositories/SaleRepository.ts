import type { PageResponse } from '../../../../shared/types/PageResponse'
import type { CreateSaleData, Sale, SaleHistoryFilters, SaleSummary } from '../entities/Sale'

export type SaleRepository = {
  createSale(data: CreateSaleData): Promise<Sale>
  getCurrentSessionSales(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>>
  getSalesHistory(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>>
  getById(id: number): Promise<Sale>
}
