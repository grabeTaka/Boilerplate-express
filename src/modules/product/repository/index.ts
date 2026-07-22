import type { Knex } from 'knex';
import { Product } from '../entity/index.ts';
import { ProductFactory, type ProductFilters, type ProductInput, type ProductRow } from '../factory/index.ts';
import { ProductRepositoryInterface } from './interface.ts'
export class ProductRepository implements ProductRepositoryInterface {

    constructor(private readonly knex: Knex) {}

    async create(data: ProductInput): Promise<Product> {
        const [row] = await this.knex('products').insert(ProductFactory.toDatabase(data)).returning('*');
        return ProductFactory.toDomain(row);
    }
    async update(id: number, data: ProductInput): Promise<Product> {
        const [row] = await this.knex<ProductRow>('products').where({ id }).update(ProductFactory.toDatabase(data)).returning('*');
        return ProductFactory.toDomain(row)
    }

    async delete(id: number): Promise<Product> {
        const [row] = await this.knex<ProductRow>('products').where({ id }).del().returning('*');
        return ProductFactory.toDomain(row)
    }

    async findOne(id: number): Promise<Product> {
        const [row] = await this.knex<ProductRow>('products').where({ id }).select('*').limit(1);
        return ProductFactory.toDomain(row)
    }
    async findAll(filters: ProductFilters = {}): Promise<Product[]> {
        console.log(ProductFactory.toDatabaseFilters(filters))
        const rows = await this.knex<ProductRow>('products')
            .where(ProductFactory.toDatabaseFilters(filters))
            .select('*');
        return ProductFactory.toDomainList(rows);
    }
}