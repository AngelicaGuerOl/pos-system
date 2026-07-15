import { httpClient } from '../../shared/api/httpClient'
import { CreateSaleUseCase } from './application/useCases/CreateSaleUseCase'
import { GetCurrentSessionSalesUseCase } from './application/useCases/GetCurrentSessionSalesUseCase'
import { GetSaleByIdUseCase } from './application/useCases/GetSaleByIdUseCase'
import { GetSalesHistoryUseCase } from './application/useCases/GetSalesHistoryUseCase'
import { SaleRepositoryImpl } from './infrastructure/SaleRepositoryImpl'
import { CreateSaleReturnUseCase } from './returns/application/useCases/CreateSaleReturnUseCase'
import { GetSaleReturnByIdUseCase } from './returns/application/useCases/GetSaleReturnByIdUseCase'
import { GetSaleReturnsUseCase } from './returns/application/useCases/GetSaleReturnsUseCase'
import { SaleReturnRepositoryImpl } from './returns/infrastructure/SaleReturnRepositoryImpl'

const saleRepository = new SaleRepositoryImpl(httpClient)
const saleReturnRepository = new SaleReturnRepositoryImpl(httpClient)

export const saleDependencies = {
  createSaleUseCase: new CreateSaleUseCase(saleRepository),
  createSaleReturnUseCase: new CreateSaleReturnUseCase(saleReturnRepository),
  getCurrentSessionSalesUseCase: new GetCurrentSessionSalesUseCase(saleRepository),
  getSaleReturnByIdUseCase: new GetSaleReturnByIdUseCase(saleReturnRepository),
  getSaleReturnsUseCase: new GetSaleReturnsUseCase(saleReturnRepository),
  getSalesHistoryUseCase: new GetSalesHistoryUseCase(saleRepository),
  getSaleByIdUseCase: new GetSaleByIdUseCase(saleRepository),
} as const
