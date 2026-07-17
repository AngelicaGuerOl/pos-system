import { httpClient } from '../../../shared/api/httpClient'
import { CreateSupplierEntryUseCase } from './application/useCases/CreateSupplierEntryUseCase'
import { GetSupplierEntriesUseCase } from './application/useCases/GetSupplierEntriesUseCase'
import { GetSupplierEntryByIdUseCase } from './application/useCases/GetSupplierEntryByIdUseCase'
import { SupplierEntryRepositoryImpl } from './infrastructure/SupplierEntryRepositoryImpl'

const repository = new SupplierEntryRepositoryImpl(httpClient)

export const supplierEntryDependencies = {
  createSupplierEntryUseCase: new CreateSupplierEntryUseCase(repository),
  getSupplierEntriesUseCase: new GetSupplierEntriesUseCase(repository),
  getSupplierEntryByIdUseCase: new GetSupplierEntryByIdUseCase(repository),
} as const
