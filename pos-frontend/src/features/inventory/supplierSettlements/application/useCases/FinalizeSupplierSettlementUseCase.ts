import type { SupplierSettlement } from '../../domain/entities/SupplierSettlement'
import type { SupplierSettlementRepository } from '../../domain/repositories/SupplierSettlementRepository'

export class FinalizeSupplierSettlementUseCase {
  private readonly repository: SupplierSettlementRepository
  constructor(repository: SupplierSettlementRepository) { this.repository = repository }
  execute(id: number): Promise<SupplierSettlement> { return this.repository.finalize(id) }
}
