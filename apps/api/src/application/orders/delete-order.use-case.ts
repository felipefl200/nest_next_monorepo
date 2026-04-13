import { Injectable, Inject } from "@nestjs/common";
import { ORDER_REPOSITORY } from "../../domain/tokens";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { IOrderRepository } from "../../domain/orders/order.types";

@Injectable()
export class DeleteOrderUseCase {
  public constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  public async execute(id: string): Promise<void> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new NotFoundException("ORDER_NOT_FOUND", "Order not found");
    }

    await this.orderRepository.delete(id);
  }
}
