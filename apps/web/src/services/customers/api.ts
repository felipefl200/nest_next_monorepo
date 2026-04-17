import { deleteRequest, requestJson } from "../shared/api-client";
import type { Customer, CustomerMutationInput, CustomersQuery, PaginatedCustomers } from "./types";

export async function listCustomersWithApi(
  accessToken: string,
  query: CustomersQuery,
): Promise<PaginatedCustomers> {
  return requestJson<PaginatedCustomers>({
    method: "GET",
    path: "/customers",
    accessToken,
    query,
  });
}

export async function getCustomerWithApi(
  accessToken: string,
  id: string,
): Promise<Customer> {
  return requestJson<Customer>({
    method: "GET",
    path: `/customers/${id}`,
    accessToken,
  });
}

export async function createCustomerWithApi(
  accessToken: string,
  input: CustomerMutationInput,
): Promise<Customer> {
  return requestJson<Customer>({
    method: "POST",
    path: "/customers",
    accessToken,
    body: input,
  });
}

export async function updateCustomerWithApi(
  accessToken: string,
  id: string,
  input: CustomerMutationInput,
): Promise<Customer> {
  return requestJson<Customer>({
    method: "PATCH",
    path: `/customers/${id}`,
    accessToken,
    body: input,
  });
}

export async function deleteCustomerWithApi(
  accessToken: string,
  id: string,
): Promise<void> {
  await deleteRequest(`/customers/${id}`, accessToken);
}
