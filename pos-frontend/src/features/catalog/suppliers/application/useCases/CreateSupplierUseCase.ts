import type { Supplier, SupplierMutation } from '../../domain/entities/Supplier'
import type { SupplierRepository } from '../../domain/repositories/SupplierRepository'

export class CreateSupplierUseCase {
  private readonly supplierRepository: SupplierRepository

  constructor(supplierRepository: SupplierRepository) {
    this.supplierRepository = supplierRepository
  }

  execute(data: SupplierMutation): Promise<Supplier> {
    return this.supplierRepository.create(data)
  }
}
