import { Product }  from '../entity/index.ts'
import  FindAllUseCase  from '../useCase/index.ts'
import {ProductRepositoryInterface} from '../repository/interface.ts'

export class ProductController {
    private repository: ProductRepositoryInterface;

    constructor (repository: ProductRepositoryInterface) {
        this.repository = repository;
    }
    
     async findAll (): Promise<Product[]> {
        const findAllUseCase = new FindAllUseCase(this.repository);
        return findAllUseCase.execute();
     }
}
