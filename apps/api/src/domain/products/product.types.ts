import type { PaginatedResult } from "../shared/pagination.types";
import type { PaginationQuery } from "../shared/query.types";
export type { PaginatedResult } from "../shared/pagination.types";

export type ProductEntity = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: string;
  stock: number;
  isActive: boolean;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
  ownerUserId: string;
  name: string;
  description?: string;
  category: string;
  price: string;
  stock: number;
  isActive?: boolean;
};

export type UpdateProductInput = {
  name?: string;
  description?: string;
  category?: string;
  price?: string;
  stock?: number;
  isActive?: boolean;
};

export type ListProductsQuery = PaginationQuery & {
  category?: string;
  isActive?: boolean;
  search?: string;
};

export interface IProductRepository {
  create(input: CreateProductInput): Promise<ProductEntity>;
  findById(id: string): Promise<ProductEntity | null>;
  findOwnedById(id: string, ownerUserId: string): Promise<ProductEntity | null>;
  findManyByIds(ids: string[]): Promise<ProductEntity[]>;
  list(query: ListProductsQuery): Promise<PaginatedResult<ProductEntity>>;
  update(id: string, input: UpdateProductInput): Promise<ProductEntity>;
  delete(id: string): Promise<void>;
  countOrderItemsByProductId(productId: string): Promise<number>;
}
