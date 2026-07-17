import type { SupplierInventoryBaseline } from '../../domain/entities/Supplier'
import type { SupplierRepository } from '../../domain/repositories/SupplierRepository'

export class GetSupplierInventoryBaselineUseCase {
  private readonly supplierRepository: SupplierRepository

  constructor(supplierRepository: SupplierRepository) {
    this.supplierRepository = supplierRepository
  }

  execute(supplierId: number): Promise<SupplierInventoryBaseline> {
    return this.supplierRepository.getInventoryBaseline(supplierId)
  }
}
