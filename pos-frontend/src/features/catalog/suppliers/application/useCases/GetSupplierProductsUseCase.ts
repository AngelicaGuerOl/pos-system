import type { SupplierProductsPage } from '../../domain/entities/Supplier'
import type { SupplierRepository } from '../../domain/repositories/SupplierRepository'

export class GetSupplierProductsUseCase {
  private readonly supplierRepository: SupplierRepository

  constructor(supplierRepository: SupplierRepository) {
    this.supplierRepository = supplierRepository
  }

  execute(
    supplierId: number,
    filters?: { search?: string; page?: number; size?: number; sort?: string },
  ): Promise<SupplierProductsPage> {
    return this.supplierRepository.getProducts(supplierId, filters)
  }
}
