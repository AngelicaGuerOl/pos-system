import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type {
  CreateSaleReturnRequest,
  SaleReturnDetails,
  SaleReturnFilters,
  SaleReturnSummary,
} from '../entities/SaleReturn'

export type SaleReturnRepository = {
  createReturn: (saleId: number, request: CreateSaleReturnRequest) => Promise<SaleReturnDetails>
  getReturnById: (returnId: number) => Promise<SaleReturnDetails>
  getReturnsBySale: (
    saleId: number,
    filters: SaleReturnFilters,
  ) => Promise<PageResponse<SaleReturnSummary>>
}
