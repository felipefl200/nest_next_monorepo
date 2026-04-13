import { Inject, Injectable } from "@nestjs/common";
import { CUSTOMER_REPOSITORY } from "../../domain/tokens";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { CustomerEntity, ICustomerRepository } from "../../domain/customers/customer.types";

export type GetCustomerResult = CustomerEntity;

@Injectable()
export class GetCustomerUseCase {
  public constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  public async execute(id: string): Promise<GetCustomerResult> {
    const customer = await this.customerRepository.findById(id);

    if (customer === null) {
      throw new NotFoundException("CUSTOMER_NOT_FOUND", "Customer not found");
    }

    return customer;
  }
}
