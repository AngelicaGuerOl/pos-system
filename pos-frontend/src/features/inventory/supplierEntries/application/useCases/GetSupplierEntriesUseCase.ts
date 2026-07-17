import type { SupplierEntryFilters, SupplierEntryPageResponse } from '../../domain/entities/SupplierEntry'
import type { SupplierEntryRepository } from '../../domain/repositories/SupplierEntryRepository'

export class GetSupplierEntriesUseCase {
  private readonly repository: SupplierEntryRepository

  constructor(repository: SupplierEntryRepository) {
    this.repository = repository
  }

  execute(filters?: SupplierEntryFilters): Promise<SupplierEntryPageResponse> {
    return this.repository.getAll(filters)
  }
}
