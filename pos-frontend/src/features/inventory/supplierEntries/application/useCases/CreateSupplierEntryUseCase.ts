import type { SupplierEntry, SupplierEntryMutation } from '../../domain/entities/SupplierEntry'
import type { SupplierEntryRepository } from '../../domain/repositories/SupplierEntryRepository'

export class CreateSupplierEntryUseCase {
  private readonly repository: SupplierEntryRepository

  constructor(repository: SupplierEntryRepository) {
    this.repository = repository
  }

  execute(data: SupplierEntryMutation): Promise<SupplierEntry> {
    return this.repository.create(data)
  }
}
