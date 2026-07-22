import { Product }  from '../entity/index.ts'
import { ProductFilters, ProductInput } from '../factory/index.ts'
import { FindAllUseCase, FindOneUseCase, CreateUseCase, UpdateUseCase, DeleteUseCase } from '../useCase/index.ts'
import {ProductRepositoryInterface} from '../repository/interface.ts'

export class ProductController {
    private repository: ProductRepositoryInterface;

    constructor (repository: ProductRepositoryInterface) {
        this.repository = repository;
    }

    async findAll (filters?: ProductFilters): Promise<Product[]> {
        const findAllUseCase = new FindAllUseCase(this.repository);
        return findAllUseCase.execute(filters);
    }

    async findOne (id: number): Promise<Product> {
        const findOneUseCase = new FindOneUseCase(this.repository);
        return findOneUseCase.execute(id);
    }

    async create (data: ProductInput): Promise<Product> {
        const createUseCase = new CreateUseCase(this.repository);
        return createUseCase.execute(data);
    }

    async update (id: number, data: ProductInput): Promise<Product> {
        const updateUseCase = new UpdateUseCase(this.repository);
        return updateUseCase.execute(id, data);
    }

    async delete (id: number): Promise<Product> {
        const deleteUseCase = new DeleteUseCase(this.repository);
        return deleteUseCase.execute(id);
    }
}
