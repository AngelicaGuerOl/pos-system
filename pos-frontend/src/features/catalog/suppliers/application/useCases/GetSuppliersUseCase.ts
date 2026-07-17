import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { Supplier, SupplierFilters } from '../../domain/entities/Supplier'
import type { SupplierRepository } from '../../domain/repositories/SupplierRepository'

export class GetSuppliersUseCase {
  private readonly supplierRepository: SupplierRepository

  constructor(supplierRepository: SupplierRepository) {
    this.supplierRepository = supplierRepository
  }

  execute(filters?: SupplierFilters): Promise<PageResponse<Supplier>> {
    return this.supplierRepository.getAll(filters)
  }
}
