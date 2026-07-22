import { Product } from "../entity/index.ts";
import {ProductRepositoryInterface} from '../repository/interface.ts'
export class DeleteUseCase {
    private repository: ProductRepositoryInterface;

    constructor (repository: ProductRepositoryInterface) {
        this.repository = repository;
    }

    async execute (id: number): Promise<Product> {
        return this.repository.delete(id)
    }
}
