import type { UserRole } from "../auth/auth.types";

export type ManagedUserEntity = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type CreateManagedUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type UpdateManagedUserInput = {
  name?: string;
  email?: string;
  role?: UserRole;
};

export type ListManagedUsersQuery = {
  page: number;
  perPage: number;
  search?: string;
};

export type PaginatedManagedUsers = {
  data: ManagedUserEntity[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export interface IAdminUserRepository {
  createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<ManagedUserEntity>;
  findUserById(id: string): Promise<ManagedUserEntity | null>;
  findUserByEmail(email: string): Promise<ManagedUserEntity | null>;
  listUsers(query: ListManagedUsersQuery): Promise<PaginatedManagedUsers>;
  updateUser(id: string, input: UpdateManagedUserInput): Promise<ManagedUserEntity>;
  deactivateUser(id: string): Promise<void>;
  revokeAllSessionsByUserId(userId: string): Promise<void>;
  incrementUserTokenVersion(userId: string): Promise<void>;
}
