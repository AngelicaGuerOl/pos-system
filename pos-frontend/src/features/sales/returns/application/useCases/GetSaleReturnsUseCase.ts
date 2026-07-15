import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { SaleReturnFilters, SaleReturnSummary } from '../../domain/entities/SaleReturn'
import type { SaleReturnRepository } from '../../domain/repositories/SaleReturnRepository'

export class GetSaleReturnsUseCase {
  private readonly repository: SaleReturnRepository

  constructor(repository: SaleReturnRepository) {
    this.repository = repository
  }

  execute(saleId: number, filters: SaleReturnFilters): Promise<PageResponse<SaleReturnSummary>> {
    return this.repository.getReturnsBySale(saleId, filters)
  }
}
