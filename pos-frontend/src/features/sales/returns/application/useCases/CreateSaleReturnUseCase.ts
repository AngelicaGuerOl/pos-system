import type { CreateSaleReturnRequest, SaleReturnDetails } from '../../domain/entities/SaleReturn'
import type { SaleReturnRepository } from '../../domain/repositories/SaleReturnRepository'

export class CreateSaleReturnUseCase {
  private readonly repository: SaleReturnRepository

  constructor(repository: SaleReturnRepository) {
    this.repository = repository
  }

  execute(saleId: number, request: CreateSaleReturnRequest): Promise<SaleReturnDetails> {
    return this.repository.createReturn(saleId, request)
  }
}
