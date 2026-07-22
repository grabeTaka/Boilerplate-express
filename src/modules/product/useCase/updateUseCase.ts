import { Product } from "../entity/index.ts";
import { ProductInput } from "../factory/index.ts";
import {ProductRepositoryInterface} from '../repository/interface.ts'
export class UpdateUseCase {
    private repository: ProductRepositoryInterface;

    constructor (repository: ProductRepositoryInterface) {
        this.repository = repository;
    }

    async execute (id: number, data: ProductInput): Promise<Product> {
        return this.repository.update(id, data)
    }
}
