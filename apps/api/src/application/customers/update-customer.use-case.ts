import { Inject, Injectable } from "@nestjs/common";
import { CUSTOMER_REPOSITORY } from "../../domain/tokens";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type {
  CustomerEntity,
  ICustomerRepository,
  UpdateCustomerInput,
} from "../../domain/customers/customer.types";

export type UpdateCustomerResult = CustomerEntity;

@Injectable()
export class UpdateCustomerUseCase {
  public constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  public async execute(id: string, input: UpdateCustomerInput): Promise<UpdateCustomerResult> {
    const customer = await this.customerRepository.findById(id);

    if (customer === null) {
      throw new NotFoundException("CUSTOMER_NOT_FOUND", "Customer not found");
    }

    if (input.email !== undefined && input.email !== customer.email) {
      const existing = await this.customerRepository.findByEmail(input.email);
      if (existing !== null) {
        throw new ConflictException("CUSTOMER_EMAIL_ALREADY_EXISTS", "Customer email already exists");
      }
    }

    return this.customerRepository.update(id, input);
  }
}
