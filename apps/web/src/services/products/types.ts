import type { PaginatedResponse } from "../shared/types";

export type Product = {
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

export type ProductMutationInput = {
  name: string;
  description?: string;
  category: string;
  price: string;
  stock: number;
  isActive: boolean;
};

export type ProductsQuery = {
  page?: number;
  perPage?: number;
  category?: string;
  isActive?: boolean;
  search?: string;
};

export type PaginatedProducts = PaginatedResponse<Product>;
