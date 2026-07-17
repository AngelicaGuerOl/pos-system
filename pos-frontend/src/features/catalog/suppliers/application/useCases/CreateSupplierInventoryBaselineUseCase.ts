import type {
  SupplierInventoryBaseline,
  SupplierInventoryBaselineMutation,
} from '../../domain/entities/Supplier'
import type { SupplierRepository } from '../../domain/repositories/SupplierRepository'

export class CreateSupplierInventoryBaselineUseCase {
  private readonly supplierRepository: SupplierRepository

  constructor(supplierRepository: SupplierRepository) {
    this.supplierRepository = supplierRepository
  }

  execute(
    supplierId: number,
    data: SupplierInventoryBaselineMutation,
  ): Promise<SupplierInventoryBaseline> {
    return this.supplierRepository.createInventoryBaseline(supplierId, data)
  }
}
