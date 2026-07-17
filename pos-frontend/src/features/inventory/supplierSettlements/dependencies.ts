import { httpClient } from '../../../shared/api/httpClient'
import { CreateSupplierSettlementUseCase } from './application/useCases/CreateSupplierSettlementUseCase'
import { ExportSupplierSettlementUseCase } from './application/useCases/ExportSupplierSettlementUseCase'
import { FinalizeSupplierSettlementUseCase } from './application/useCases/FinalizeSupplierSettlementUseCase'
import { GetSupplierSettlementByIdUseCase } from './application/useCases/GetSupplierSettlementByIdUseCase'
import { GetSupplierSettlementsUseCase } from './application/useCases/GetSupplierSettlementsUseCase'
import { UpdateSupplierSettlementUseCase } from './application/useCases/UpdateSupplierSettlementUseCase'
import { SupplierSettlementRepositoryImpl } from './infrastructure/SupplierSettlementRepositoryImpl'

const repository = new SupplierSettlementRepositoryImpl(httpClient)

export const supplierSettlementDependencies = {
  createSupplierSettlementUseCase: new CreateSupplierSettlementUseCase(repository),
  getSupplierSettlementsUseCase: new GetSupplierSettlementsUseCase(repository),
  getSupplierSettlementByIdUseCase: new GetSupplierSettlementByIdUseCase(repository),
  updateSupplierSettlementUseCase: new UpdateSupplierSettlementUseCase(repository),
  finalizeSupplierSettlementUseCase: new FinalizeSupplierSettlementUseCase(repository),
  exportSupplierSettlementUseCase: new ExportSupplierSettlementUseCase(repository),
} as const
