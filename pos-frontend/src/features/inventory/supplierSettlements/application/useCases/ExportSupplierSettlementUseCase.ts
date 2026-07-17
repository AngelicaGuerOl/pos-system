import type { ExportedSupplierSettlement, SupplierSettlementRepository } from '../../domain/repositories/SupplierSettlementRepository'

export class ExportSupplierSettlementUseCase {
  private readonly repository: SupplierSettlementRepository
  constructor(repository: SupplierSettlementRepository) { this.repository = repository }
  execute(id: number): Promise<ExportedSupplierSettlement> { return this.repository.exportSettlement(id) }
}
