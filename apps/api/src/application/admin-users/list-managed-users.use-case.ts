import { Inject, Injectable } from "@nestjs/common";
import { ADMIN_USER_REPOSITORY } from "../../domain/tokens";
import type {
  IAdminUserRepository,
  ListManagedUsersQuery,
  PaginatedManagedUsers,
} from "../../domain/admin-users/admin-user.types";

@Injectable()
export class ListManagedUsersUseCase {
  public constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminUserRepository: IAdminUserRepository,
  ) {}

  public async execute(query: ListManagedUsersQuery): Promise<PaginatedManagedUsers> {
    return this.adminUserRepository.listUsers(query);
  }
}
