import { deleteRequest, requestJson } from "../shared/api-client";
import type { PaginatedProducts, Product, ProductMutationInput, ProductsQuery } from "./types";

export async function listProductsWithApi(
  accessToken: string,
  query: ProductsQuery,
): Promise<PaginatedProducts> {
  return requestJson<PaginatedProducts>({
    method: "GET",
    path: "/products",
    accessToken,
    query,
  });
}

export async function getProductWithApi(
  accessToken: string,
  id: string,
): Promise<Product> {
  return requestJson<Product>({
    method: "GET",
    path: `/products/${id}`,
    accessToken,
  });
}

export async function createProductWithApi(
  accessToken: string,
  input: ProductMutationInput,
): Promise<Product> {
  return requestJson<Product>({
    method: "POST",
    path: "/products",
    accessToken,
    body: input,
  });
}

export async function updateProductWithApi(
  accessToken: string,
  id: string,
  input: ProductMutationInput,
): Promise<Product> {
  return requestJson<Product>({
    method: "PATCH",
    path: `/products/${id}`,
    accessToken,
    body: input,
  });
}

export async function deleteProductWithApi(
  accessToken: string,
  id: string,
): Promise<void> {
  await deleteRequest(`/products/${id}`, accessToken);
}
