import { Inject, Injectable } from "@nestjs/common";
import { CUSTOMER_REPOSITORY } from "../../domain/tokens";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { ActorContext } from "../../domain/shared/actor.types";
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

  public async execute(
    id: string,
    input: UpdateCustomerInput,
    actor: ActorContext,
  ): Promise<UpdateCustomerResult> {
    const customer =
      actor.actorRole === "ADMIN"
        ? await this.customerRepository.findById(id)
        : await this.customerRepository.findOwnedById(id, actor.actorUserId);

    if (customer === null) {
      const existingCustomer = await this.customerRepository.findById(id);

      if (existingCustomer === null) {
        throw new NotFoundException("CUSTOMER_NOT_FOUND", "Customer not found");
      }

      throw new ForbiddenException("CUSTOMER_EDIT_FORBIDDEN", "Customer does not belong to the authenticated user");
    }

    if (input.email !== undefined && input.email !== customer.email) {
      const existing = await this.customerRepository.findByEmail(input.email);
      if (existing !== null) {
        throw new ConflictException("CUSTOMER_EMAIL_ALREADY_EXISTS", "Customer email already exists");
      }
    }

    if (
      input.taxId !== undefined &&
      input.taxId !== null &&
      input.taxId !== customer.taxId
    ) {
      const existing = await this.customerRepository.findByTaxId(input.taxId);

      if (existing !== null) {
        throw new ConflictException("CUSTOMER_TAX_ID_ALREADY_EXISTS", "Customer tax ID already exists");
      }
    }

    return this.customerRepository.update(id, input);
  }
}
