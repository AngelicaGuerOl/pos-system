import type { CreateCashSaleData, Sale } from '../entities/Sale'

export type SaleRepository = {
  createCashSale(data: CreateCashSaleData): Promise<Sale>
}
