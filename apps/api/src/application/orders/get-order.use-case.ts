import { Injectable, Inject } from "@nestjs/common";
import { ORDER_REPOSITORY } from "../../domain/tokens";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { IOrderRepository, OrderEntity } from "../../domain/orders/order.types";

export type GetOrderResult = OrderEntity;

@Injectable()
export class GetOrderUseCase {
  public constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  public async execute(id: string): Promise<GetOrderResult> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new NotFoundException("ORDER_NOT_FOUND", "Order not found");
    }

    return order;
  }
}
