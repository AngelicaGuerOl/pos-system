import type { Supplier } from '../../domain/entities/Supplier'
import type { SupplierRepository } from '../../domain/repositories/SupplierRepository'

export class GetSupplierByIdUseCase {
  private readonly supplierRepository: SupplierRepository

  constructor(supplierRepository: SupplierRepository) {
    this.supplierRepository = supplierRepository
  }

  execute(id: number): Promise<Supplier> {
    return this.supplierRepository.getById(id)
  }
}
