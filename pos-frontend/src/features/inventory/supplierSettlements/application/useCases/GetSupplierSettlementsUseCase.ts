import type { SupplierSettlementFilters, SupplierSettlementPageResponse } from '../../domain/entities/SupplierSettlement'
import type { SupplierSettlementRepository } from '../../domain/repositories/SupplierSettlementRepository'

export class GetSupplierSettlementsUseCase {
  private readonly repository: SupplierSettlementRepository
  constructor(repository: SupplierSettlementRepository) { this.repository = repository }
  execute(filters?: SupplierSettlementFilters): Promise<SupplierSettlementPageResponse> { return this.repository.getAll(filters) }
}
