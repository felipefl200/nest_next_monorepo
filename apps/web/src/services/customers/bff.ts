import { requireSession } from "../auth/session";
import {
  createCustomerWithApi,
  deleteCustomerWithApi,
  getCustomerWithApi,
  listCustomersWithApi,
  updateCustomerWithApi,
} from "./api";
import type { Customer, CustomerMutationInput, CustomersQuery, PaginatedCustomers } from "./types";

async function getAccessToken(): Promise<string> {
  const session = await requireSession();

  if (session.accessToken === null) {
    throw new Error("Missing access token");
  }

  return session.accessToken;
}

export async function listCustomers(query: CustomersQuery): Promise<PaginatedCustomers> {
  return listCustomersWithApi(await getAccessToken(), query);
}

export async function getCustomer(id: string): Promise<Customer> {
  return getCustomerWithApi(await getAccessToken(), id);
}

export async function createCustomer(input: CustomerMutationInput): Promise<Customer> {
  return createCustomerWithApi(await getAccessToken(), input);
}

export async function updateCustomer(
  id: string,
  input: CustomerMutationInput,
): Promise<Customer> {
  return updateCustomerWithApi(await getAccessToken(), id, input);
}

export async function deleteCustomer(id: string): Promise<void> {
  await deleteCustomerWithApi(await getAccessToken(), id);
}
