import { Product } from "../entity/index.ts";
import {ProductRepositoryInterface} from '../repository/interface.ts'
export class FindAllUseCase {
    private repository: ProductRepositoryInterface;

    constructor (repository: ProductRepositoryInterface) {
        this.repository = repository;
    }

    async execute (): Promise<Product[]> {
        return this.repository.findAll()
    }
}