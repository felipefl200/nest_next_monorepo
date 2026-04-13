import { Injectable, Inject } from "@nestjs/common";
import { ORDER_REPOSITORY } from "../../domain/tokens";
import type {
  IOrderRepository,
  CreateOrderInput,
  OrderEntity,
} from "../../domain/orders/order.types";

export type CreateOrderResult = OrderEntity;

@Injectable()
export class CreateOrderUseCase {
  public constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  public async execute(input: CreateOrderInput): Promise<CreateOrderResult> {
    return this.orderRepository.create(input);
  }
}
