import { httpClient } from '../../shared/api/httpClient'
import { CreateCashSaleUseCase } from './application/useCases/CreateCashSaleUseCase'
import { SaleRepositoryImpl } from './infrastructure/SaleRepositoryImpl'

const saleRepository = new SaleRepositoryImpl(httpClient)

export const saleDependencies = {
  createCashSaleUseCase: new CreateCashSaleUseCase(saleRepository),
} as const
