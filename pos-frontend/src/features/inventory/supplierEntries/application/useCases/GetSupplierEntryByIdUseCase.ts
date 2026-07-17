import type { SupplierEntry } from '../../domain/entities/SupplierEntry'
import type { SupplierEntryRepository } from '../../domain/repositories/SupplierEntryRepository'

export class GetSupplierEntryByIdUseCase {
  private readonly repository: SupplierEntryRepository

  constructor(repository: SupplierEntryRepository) {
    this.repository = repository
  }

  execute(id: number): Promise<SupplierEntry> {
    return this.repository.getById(id)
  }
}
