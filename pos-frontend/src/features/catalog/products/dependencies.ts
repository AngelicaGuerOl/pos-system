import { httpClient } from '../../../shared/api/httpClient'
import { CreateProductUseCase } from './application/useCases/CreateProductUseCase'
import { DeactivateProductUseCase } from './application/useCases/DeactivateProductUseCase'
import { GetProductByBarcodeUseCase } from './application/useCases/GetProductByBarcodeUseCase'
import { GetProductByIdUseCase } from './application/useCases/GetProductByIdUseCase'
import { GetProductsUseCase } from './application/useCases/GetProductsUseCase'
import { UpdateProductUseCase } from './application/useCases/UpdateProductUseCase'
import { ProductRepositoryImpl } from './infrastructure/ProductRepositoryImpl'

const productRepository = new ProductRepositoryImpl(httpClient)

export const productDependencies = {
  getProductsUseCase: new GetProductsUseCase(productRepository),
  getProductByIdUseCase: new GetProductByIdUseCase(productRepository),
  getProductByBarcodeUseCase: new GetProductByBarcodeUseCase(productRepository),
  createProductUseCase: new CreateProductUseCase(productRepository),
  updateProductUseCase: new UpdateProductUseCase(productRepository),
  deactivateProductUseCase: new DeactivateProductUseCase(productRepository),
} as const
