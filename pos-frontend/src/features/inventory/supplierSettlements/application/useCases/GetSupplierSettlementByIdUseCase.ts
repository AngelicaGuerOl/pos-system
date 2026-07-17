import type { SupplierSettlement } from '../../domain/entities/SupplierSettlement'
import type { SupplierSettlementRepository } from '../../domain/repositories/SupplierSettlementRepository'

export class GetSupplierSettlementByIdUseCase {
  private readonly repository: SupplierSettlementRepository
  constructor(repository: SupplierSettlementRepository) { this.repository = repository }
  execute(id: number): Promise<SupplierSettlement> { return this.repository.getById(id) }
}
