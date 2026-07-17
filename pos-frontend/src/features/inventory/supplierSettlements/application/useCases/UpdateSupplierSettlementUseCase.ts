import type { SupplierSettlement, SupplierSettlementUpdateMutation } from '../../domain/entities/SupplierSettlement'
import type { SupplierSettlementRepository } from '../../domain/repositories/SupplierSettlementRepository'

export class UpdateSupplierSettlementUseCase {
  private readonly repository: SupplierSettlementRepository
  constructor(repository: SupplierSettlementRepository) { this.repository = repository }
  execute(id: number, data: SupplierSettlementUpdateMutation): Promise<SupplierSettlement> { return this.repository.update(id, data) }
}
