import type { CancelSaleData, SaleCancellation } from '../../domain/entities/Sale'
import type { SaleRepository } from '../../domain/repositories/SaleRepository'

export class CancelSaleUseCase {
  private readonly saleRepository: SaleRepository

  constructor(saleRepository: SaleRepository) {
    this.saleRepository = saleRepository
  }

  execute(id: number, data: CancelSaleData): Promise<SaleCancellation> {
    return this.saleRepository.cancelSale(id, data)
  }
}
