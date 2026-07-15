import type { SaleReturnDetails } from '../../domain/entities/SaleReturn'
import type { SaleReturnRepository } from '../../domain/repositories/SaleReturnRepository'

export class GetSaleReturnByIdUseCase {
  private readonly repository: SaleReturnRepository

  constructor(repository: SaleReturnRepository) {
    this.repository = repository
  }

  execute(returnId: number): Promise<SaleReturnDetails> {
    return this.repository.getReturnById(returnId)
  }
}
