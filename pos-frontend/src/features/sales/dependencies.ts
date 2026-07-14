import { httpClient } from '../../shared/api/httpClient'
import { CreateSaleUseCase } from './application/useCases/CreateSaleUseCase'
import { GetCurrentSessionSalesUseCase } from './application/useCases/GetCurrentSessionSalesUseCase'
import { GetSaleByIdUseCase } from './application/useCases/GetSaleByIdUseCase'
import { GetSalesHistoryUseCase } from './application/useCases/GetSalesHistoryUseCase'
import { SaleRepositoryImpl } from './infrastructure/SaleRepositoryImpl'

const saleRepository = new SaleRepositoryImpl(httpClient)

export const saleDependencies = {
  createSaleUseCase: new CreateSaleUseCase(saleRepository),
  getCurrentSessionSalesUseCase: new GetCurrentSessionSalesUseCase(saleRepository),
  getSalesHistoryUseCase: new GetSalesHistoryUseCase(saleRepository),
  getSaleByIdUseCase: new GetSaleByIdUseCase(saleRepository),
} as const
