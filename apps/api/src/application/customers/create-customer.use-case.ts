import { Inject, Injectable } from "@nestjs/common";
import { CUSTOMER_REPOSITORY } from "../../domain/tokens";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import type {
  CreateCustomerInput,
  CustomerEntity,
  ICustomerRepository,
} from "../../domain/customers/customer.types";

export type CreateCustomerResult = CustomerEntity;

@Injectable()
export class CreateCustomerUseCase {
  public constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  public async execute(input: CreateCustomerInput): Promise<CreateCustomerResult> {
    const existing = await this.customerRepository.findByEmail(input.email);

    if (existing !== null) {
      throw new ConflictException("CUSTOMER_EMAIL_ALREADY_EXISTS", "Customer email already exists");
    }

    return this.customerRepository.create(input);
  }
}
