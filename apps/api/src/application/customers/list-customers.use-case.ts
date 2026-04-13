import { Inject, Injectable } from "@nestjs/common";
import { CUSTOMER_REPOSITORY } from "../../domain/tokens";
import type {
  CustomerEntity,
  ICustomerRepository,
  ListCustomersQuery,
  PaginatedResult,
} from "../../domain/customers/customer.types";

export type ListCustomersResult = PaginatedResult<CustomerEntity>;

@Injectable()
export class ListCustomersUseCase {
  public constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  public async execute(query: ListCustomersQuery): Promise<ListCustomersResult> {
    return this.customerRepository.list(query);
  }
}
