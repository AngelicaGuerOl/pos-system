import type { CreateCashSaleData, Sale } from '../../domain/entities/Sale'
import type { SaleRepository } from '../../domain/repositories/SaleRepository'

export class CreateCashSaleUseCase {
  private readonly saleRepository: SaleRepository

  constructor(saleRepository: SaleRepository) {
    this.saleRepository = saleRepository
  }

  execute(data: CreateCashSaleData): Promise<Sale> {
    return this.saleRepository.createCashSale(data)
  }
}
