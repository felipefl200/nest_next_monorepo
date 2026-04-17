import type { PaginatedResponse } from "../shared/types";

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  taxId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerMutationInput = {
  name: string;
  email: string;
  phone: string;
  taxId?: string | null;
};

export type CustomersQuery = {
  page?: number;
  perPage?: number;
  search?: string;
};

export type PaginatedCustomers = PaginatedResponse<Customer>;
