import type { PageResponse } from '../../../../shared/types/PageResponse'
import type { SaleHistoryFilters, SaleSummary } from '../../domain/entities/Sale'
import type { SaleRepository } from '../../domain/repositories/SaleRepository'

export class GetCurrentSessionSalesUseCase {
  private readonly saleRepository: SaleRepository

  constructor(saleRepository: SaleRepository) {
    this.saleRepository = saleRepository
  }

  execute(filters: SaleHistoryFilters): Promise<PageResponse<SaleSummary>> {
    return this.saleRepository.getCurrentSessionSales(filters)
  }
}
