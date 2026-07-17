import { httpClient } from '../../../shared/api/httpClient'
import { CreateSupplierInventoryBaselineUseCase } from './application/useCases/CreateSupplierInventoryBaselineUseCase'
import { CreateSupplierUseCase } from './application/useCases/CreateSupplierUseCase'
import { DeactivateSupplierUseCase } from './application/useCases/DeactivateSupplierUseCase'
import { GetSupplierByIdUseCase } from './application/useCases/GetSupplierByIdUseCase'
import { GetSupplierInventoryBaselineUseCase } from './application/useCases/GetSupplierInventoryBaselineUseCase'
import { GetSupplierProductsUseCase } from './application/useCases/GetSupplierProductsUseCase'
import { GetSuppliersUseCase } from './application/useCases/GetSuppliersUseCase'
import { UpdateSupplierUseCase } from './application/useCases/UpdateSupplierUseCase'
import { SupplierRepositoryImpl } from './infrastructure/SupplierRepositoryImpl'

const supplierRepository = new SupplierRepositoryImpl(httpClient)

export const supplierDependencies = {
  createSupplierUseCase: new CreateSupplierUseCase(supplierRepository),
  getSuppliersUseCase: new GetSuppliersUseCase(supplierRepository),
  getSupplierByIdUseCase: new GetSupplierByIdUseCase(supplierRepository),
  updateSupplierUseCase: new UpdateSupplierUseCase(supplierRepository),
  deactivateSupplierUseCase: new DeactivateSupplierUseCase(supplierRepository),
  getSupplierProductsUseCase: new GetSupplierProductsUseCase(supplierRepository),
  getSupplierInventoryBaselineUseCase: new GetSupplierInventoryBaselineUseCase(supplierRepository),
  createSupplierInventoryBaselineUseCase: new CreateSupplierInventoryBaselineUseCase(supplierRepository),
} as const
