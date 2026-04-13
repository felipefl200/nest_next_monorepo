import { Injectable, Inject } from "@nestjs/common";
import { ORDER_REPOSITORY } from "../../domain/tokens";
import type {
  IOrderRepository,
  ListOrdersQuery,
  OrderEntity,
  PaginatedResult,
} from "../../domain/orders/order.types";

export type ListOrdersResult = PaginatedResult<OrderEntity>;

@Injectable()
export class ListOrdersUseCase {
  public constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  public async execute(query: ListOrdersQuery): Promise<ListOrdersResult> {
    return this.orderRepository.list(query);
  }
}
