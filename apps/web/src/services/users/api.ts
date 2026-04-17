import { deleteRequest, requestJson } from "../shared/api-client";
import type {
  ManagedUser,
  ManagedUserMutationInput,
  PaginatedManagedUsers,
  UsersQuery,
} from "./types";

export async function listManagedUsersWithApi(
  accessToken: string,
  query: UsersQuery,
): Promise<PaginatedManagedUsers> {
  return requestJson<PaginatedManagedUsers>({
    method: "GET",
    path: "/users",
    accessToken,
    query,
  });
}

export async function createManagedUserWithApi(
  accessToken: string,
  input: Required<Pick<ManagedUserMutationInput, "name" | "email" | "role" | "password">>,
): Promise<ManagedUser> {
  return requestJson<ManagedUser>({
    method: "POST",
    path: "/users",
    accessToken,
    body: input,
  });
}

export async function updateManagedUserWithApi(
  accessToken: string,
  id: string,
  input: Omit<ManagedUserMutationInput, "password">,
): Promise<ManagedUser> {
  return requestJson<ManagedUser>({
    method: "PATCH",
    path: `/users/${id}`,
    accessToken,
    body: input,
  });
}

export async function deactivateManagedUserWithApi(
  accessToken: string,
  id: string,
): Promise<void> {
  await deleteRequest(`/users/${id}`, accessToken);
}
