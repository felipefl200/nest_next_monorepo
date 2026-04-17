import { requireSession } from "../auth/session";
import {
  createManagedUserWithApi,
  deactivateManagedUserWithApi,
  listManagedUsersWithApi,
  updateManagedUserWithApi,
} from "./api";
import type {
  ManagedUser,
  ManagedUserMutationInput,
  PaginatedManagedUsers,
  UsersQuery,
} from "./types";

async function getAccessToken(): Promise<string> {
  const session = await requireSession();

  if (session.accessToken === null) {
    throw new Error("Missing access token");
  }

  return session.accessToken;
}

export async function listManagedUsers(query: UsersQuery): Promise<PaginatedManagedUsers> {
  return listManagedUsersWithApi(await getAccessToken(), query);
}

export async function createManagedUser(
  input: Required<Pick<ManagedUserMutationInput, "name" | "email" | "role" | "password">>,
): Promise<ManagedUser> {
  return createManagedUserWithApi(await getAccessToken(), input);
}

export async function updateManagedUser(
  id: string,
  input: Omit<ManagedUserMutationInput, "password">,
): Promise<ManagedUser> {
  return updateManagedUserWithApi(await getAccessToken(), id, input);
}

export async function deactivateManagedUser(id: string): Promise<void> {
  await deactivateManagedUserWithApi(await getAccessToken(), id);
}
