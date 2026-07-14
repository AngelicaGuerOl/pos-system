import type { CreateSaleData, Sale } from '../../domain/entities/Sale'
import type { SaleRepository } from '../../domain/repositories/SaleRepository'

export class CreateSaleUseCase {
  private readonly saleRepository: SaleRepository

  constructor(saleRepository: SaleRepository) {
    this.saleRepository = saleRepository
  }

  execute(data: CreateSaleData): Promise<Sale> {
    return this.saleRepository.createSale(data)
  }
}
