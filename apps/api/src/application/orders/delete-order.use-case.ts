import { Injectable, Inject } from "@nestjs/common";
import { ORDER_REPOSITORY } from "../../domain/tokens";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { ActorContext } from "../../domain/shared/actor.types";
import type { IOrderRepository } from "../../domain/orders/order.types";

@Injectable()
export class DeleteOrderUseCase {
  public constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  public async execute(id: string, actor: ActorContext): Promise<void> {
    const order =
      actor.actorRole === "ADMIN"
        ? await this.orderRepository.findById(id)
        : await this.orderRepository.findOwnedById(id, actor.actorUserId);

    if (!order) {
      const existingOrder = await this.orderRepository.findById(id);

      if (existingOrder === null) {
        throw new NotFoundException("ORDER_NOT_FOUND", "Order not found");
      }

      throw new ForbiddenException("ORDER_DELETE_FORBIDDEN", "Order does not belong to the authenticated user");
    }

    await this.orderRepository.delete(id);
  }
}
