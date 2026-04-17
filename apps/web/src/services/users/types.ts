import type { PaginatedResponse } from "../shared/types";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: "ADMIN" | "MANAGER";
  createdAt: string;
  updatedAt: string;
};

export type ManagedUserMutationInput = {
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER";
  password?: string;
};

export type UsersQuery = {
  page?: number;
  perPage?: number;
  search?: string;
};

export type PaginatedManagedUsers = PaginatedResponse<ManagedUser>;
