import type { Sale } from '../../domain/entities/Sale'
import type { SaleRepository } from '../../domain/repositories/SaleRepository'

export class GetSaleByIdUseCase {
  private readonly saleRepository: SaleRepository

  constructor(saleRepository: SaleRepository) {
    this.saleRepository = saleRepository
  }

  execute(id: number): Promise<Sale> {
    return this.saleRepository.getById(id)
  }
}
