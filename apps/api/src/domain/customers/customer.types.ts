import type { PaginatedResult } from "../shared/pagination.types";
import type { PaginationQuery } from "../shared/query.types";
export type { PaginatedResult } from "../shared/pagination.types";

export type CustomerEntity = {
  id: string;
  name: string;
  email: string;
  phone: string;
  taxId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerInput = {
  name: string;
  email: string;
  phone: string;
  taxId?: string;
};

export type UpdateCustomerInput = {
  name?: string;
  email?: string;
  phone?: string;
  taxId?: string | null;
};

export type ListCustomersQuery = PaginationQuery & {
  search?: string;
};

export interface ICustomerRepository {
  create(input: CreateCustomerInput): Promise<CustomerEntity>;
  findById(id: string): Promise<CustomerEntity | null>;
  findByEmail(email: string): Promise<CustomerEntity | null>;
  findByTaxId(taxId: string): Promise<CustomerEntity | null>;
  list(query: ListCustomersQuery): Promise<PaginatedResult<CustomerEntity>>;
  update(id: string, input: UpdateCustomerInput): Promise<CustomerEntity>;
  delete(id: string): Promise<void>;
  countOrdersByCustomerId(customerId: string): Promise<number>;
}
