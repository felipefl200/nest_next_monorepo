export type ProductEntity = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
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

export type ListProductsQuery = {
  page: number;
  perPage: number;
  category?: string;
  isActive?: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export interface IProductRepository {
  create(input: CreateProductInput): Promise<ProductEntity>;
  findById(id: string): Promise<ProductEntity | null>;
  list(query: ListProductsQuery): Promise<PaginatedResult<ProductEntity>>;
  update(id: string, input: UpdateProductInput): Promise<ProductEntity>;
  delete(id: string): Promise<void>;
}
