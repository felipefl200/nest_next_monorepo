import { requireSession } from "../auth/session";
import {
  createProductWithApi,
  deleteProductWithApi,
  getProductWithApi,
  listProductsWithApi,
  updateProductWithApi,
} from "./api";
import type { PaginatedProducts, Product, ProductMutationInput, ProductsQuery } from "./types";

async function getAccessToken(): Promise<string> {
  const session = await requireSession();

  if (session.accessToken === null) {
    throw new Error("Missing access token");
  }

  return session.accessToken;
}

export async function listProducts(query: ProductsQuery): Promise<PaginatedProducts> {
  return listProductsWithApi(await getAccessToken(), query);
}

export async function getProduct(id: string): Promise<Product> {
  return getProductWithApi(await getAccessToken(), id);
}

export async function createProduct(input: ProductMutationInput): Promise<Product> {
  return createProductWithApi(await getAccessToken(), input);
}

export async function updateProduct(
  id: string,
  input: ProductMutationInput,
): Promise<Product> {
  return updateProductWithApi(await getAccessToken(), id, input);
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteProductWithApi(await getAccessToken(), id);
}
