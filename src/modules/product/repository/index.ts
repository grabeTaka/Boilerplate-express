import { Product } from '../entity/index.ts';
import { ProductRepositoryInterface } from './interface.ts'
export class ProductRepository implements ProductRepositoryInterface {
    async findAll(): Promise<Product[]> {
        const mocks: Product[] =  [{id: 1}]
        return mocks;
    }
}