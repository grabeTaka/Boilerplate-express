import { Product } from "../entity/index.ts";

export interface ProductRepositoryInterface {
    findAll(): Promise<Product[]>;
}