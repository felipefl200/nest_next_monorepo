import { Inject, Injectable } from "@nestjs/common";
import { CUSTOMER_REPOSITORY } from "../../domain/tokens";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { ActorContext } from "../../domain/shared/actor.types";
import type { ICustomerRepository } from "../../domain/customers/customer.types";

@Injectable()
export class DeleteCustomerUseCase {
  public constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
  ) {}

  public async execute(id: string, actor: ActorContext): Promise<void> {
    const customer =
      actor.actorRole === "ADMIN"
        ? await this.customerRepository.findById(id)
        : await this.customerRepository.findOwnedById(id, actor.actorUserId);

    if (customer === null) {
      const existingCustomer = await this.customerRepository.findById(id);

      if (existingCustomer === null) {
        throw new NotFoundException("CUSTOMER_NOT_FOUND", "Customer not found");
      }

      throw new ForbiddenException("CUSTOMER_DELETE_FORBIDDEN", "Customer does not belong to the authenticated user");
    }

    const orderCount = await this.customerRepository.countOrdersByCustomerId(id);
    if (orderCount > 0) {
      throw new ConflictException("CUSTOMER_HAS_ORDERS", "Customer has associated orders");
    }

    await this.customerRepository.delete(id);
  }
}
