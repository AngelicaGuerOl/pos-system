import type { Supplier, SupplierMutation } from '../../domain/entities/Supplier'
import type { SupplierRepository } from '../../domain/repositories/SupplierRepository'

export class UpdateSupplierUseCase {
  private readonly supplierRepository: SupplierRepository

  constructor(supplierRepository: SupplierRepository) {
    this.supplierRepository = supplierRepository
  }

  execute(id: number, data: SupplierMutation): Promise<Supplier> {
    return this.supplierRepository.update(id, data)
  }
}
