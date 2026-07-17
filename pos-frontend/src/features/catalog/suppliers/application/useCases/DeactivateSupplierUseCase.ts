import type { SupplierRepository } from '../../domain/repositories/SupplierRepository'

export class DeactivateSupplierUseCase {
  private readonly supplierRepository: SupplierRepository

  constructor(supplierRepository: SupplierRepository) {
    this.supplierRepository = supplierRepository
  }

  execute(id: number): Promise<void> {
    return this.supplierRepository.deactivate(id)
  }
}
