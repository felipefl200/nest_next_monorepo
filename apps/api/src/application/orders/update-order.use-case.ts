import { Injectable, Inject } from "@nestjs/common";
import { CUSTOMER_REPOSITORY, ORDER_REPOSITORY, PRODUCT_REPOSITORY } from "../../domain/tokens";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { ActorContext } from "../../domain/shared/actor.types";
import type {
  ICustomerRepository,
} from "../../domain/customers/customer.types";
import type {
  IOrderRepository,
  OrderEntity,
  UpdateOrderInput,
} from "../../domain/orders/order.types";
import type { IProductRepository } from "../../domain/products/product.types";

export type UpdateOrderResult = OrderEntity;

@Injectable()
export class UpdateOrderUseCase {
  public constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: ICustomerRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  public async execute(
    id: string,
    input: UpdateOrderInput,
    actor: ActorContext,
  ): Promise<UpdateOrderResult> {
    const order =
      actor.actorRole === "ADMIN"
        ? await this.orderRepository.findById(id)
        : await this.orderRepository.findOwnedById(id, actor.actorUserId);

    if (!order) {
      const existingOrder = await this.orderRepository.findById(id);

      if (existingOrder === null) {
        throw new NotFoundException("ORDER_NOT_FOUND", "Order not found");
      }

      throw new ForbiddenException("ORDER_EDIT_FORBIDDEN", "Order does not belong to the authenticated user");
    }

    const customer = await this.customerRepository.findById(input.customerId);

    if (customer === null) {
      throw new NotFoundException("CUSTOMER_NOT_FOUND", "Customer not found");
    }

    const products = await this.productRepository.findManyByIds(
      input.items.map((item) => item.productId),
    );

    const productsById = new Set(products.map((product) => product.id));
    const missingProductId = input.items.find((item) => !productsById.has(item.productId))?.productId;

    if (missingProductId !== undefined) {
      throw new NotFoundException("PRODUCT_NOT_FOUND", `Product not found: ${missingProductId}`);
    }

    return this.orderRepository.update(id, input);
  }
}
