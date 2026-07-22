import type { Product } from '../entity/index.ts';

export interface ProductRow {
    id: number;
    name: string;
    created_at: Date;
    updated_at: Date;
}

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>;

export interface ProductFilters {
    name?: string | undefined;
}

export class ProductFactory {
    /** Domain -> database: builds the payload sent to insert/update. */
    static toDatabase(data: ProductInput): Partial<ProductRow> {
        return {
            name: data.name,
        };
    }

    static toDatabaseFilters(filters: ProductFilters = {}): Partial<ProductRow> {
        const where: Partial<ProductRow> = {};
        if (filters.name !== undefined) where.name = filters.name;
        return where;
    }

    static toDomain(row: ProductRow): Product {
        return {
            id: row.id,
            name: row.name,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
    }

    static toDomainList(rows: ProductRow[]): Product[] {
        return rows.map((row) => ProductFactory.toDomain(row));
    }
}
