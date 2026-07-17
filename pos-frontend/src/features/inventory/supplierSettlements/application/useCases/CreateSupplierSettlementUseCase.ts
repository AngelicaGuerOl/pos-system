import type { SupplierSettlement, SupplierSettlementCreateMutation } from '../../domain/entities/SupplierSettlement'
import type { SupplierSettlementRepository } from '../../domain/repositories/SupplierSettlementRepository'

export class CreateSupplierSettlementUseCase {
  private readonly repository: SupplierSettlementRepository
  constructor(repository: SupplierSettlementRepository) { this.repository = repository }
  execute(data: SupplierSettlementCreateMutation): Promise<SupplierSettlement> { return this.repository.create(data) }
}
