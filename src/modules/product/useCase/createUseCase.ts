import { Product } from "../entity/index.ts";
import { ProductInput } from "../factory/index.ts";
import {ProductRepositoryInterface} from '../repository/interface.ts'
export class CreateUseCase {
    private repository: ProductRepositoryInterface;

    constructor (repository: ProductRepositoryInterface) {
        this.repository = repository;
    }

    async execute (data: ProductInput): Promise<Product> {
        return this.repository.create(data)
    }
}
