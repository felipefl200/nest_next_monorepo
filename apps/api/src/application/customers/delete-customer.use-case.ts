import { Inject, Injectable } from "@nestjs/common";
import { CUSTOMER_REPOSITORY } from "../../domain/tokens";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { ICustomerRepository } from "../../domain/customers/customer.types";

@Injectable()
export class DeleteCustomerUseCase {
  public constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  public async execute(id: string): Promise<void> {
    const customer = await this.customerRepository.findById(id);

    if (customer === null) {
      throw new NotFoundException("CUSTOMER_NOT_FOUND", "Customer not found");
    }

    const orderCount = await this.customerRepository.countOrdersByCustomerId(id);
    if (orderCount > 0) {
      throw new ConflictException("CUSTOMER_HAS_ORDERS", "Customer has associated orders");
    }

    await this.customerRepository.delete(id);
  }
}
