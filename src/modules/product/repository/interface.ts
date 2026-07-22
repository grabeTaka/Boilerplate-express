import { Product } from "../entity/index.ts";
import { ProductFilters, ProductInput } from "../factory/index.ts";

export interface ProductRepositoryInterface {
    findAll(filters?: ProductFilters): Promise<Product[]>;
    create(data: ProductInput): Promise<Product>;
    update(id: number, data: ProductInput): Promise<Product>;
    delete(id: number): Promise<Product>;
    findOne(id: number): Promise<Product>;
}