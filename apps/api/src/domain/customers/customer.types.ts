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

export type ListCustomersQuery = {
  page: number;
  perPage: number;
  search?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export interface ICustomerRepository {
  create(input: CreateCustomerInput): Promise<CustomerEntity>;
  findById(id: string): Promise<CustomerEntity | null>;
  findByEmail(email: string): Promise<CustomerEntity | null>;
  list(query: ListCustomersQuery): Promise<PaginatedResult<CustomerEntity>>;
  update(id: string, input: UpdateCustomerInput): Promise<CustomerEntity>;
  delete(id: string): Promise<void>;
  countOrdersByCustomerId(customerId: string): Promise<number>;
}
