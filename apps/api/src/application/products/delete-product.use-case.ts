import { Injectable, Inject } from "@nestjs/common";
import { PRODUCT_REPOSITORY } from "../../domain/tokens";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { ActorContext } from "../../domain/shared/actor.types";
import type { IProductRepository } from "../../domain/products/product.types";

@Injectable()
export class DeleteProductUseCase {
  public constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  public async execute(id: string, actor: ActorContext): Promise<void> {
    const product =
      actor.actorRole === "ADMIN"
        ? await this.productRepository.findById(id)
        : await this.productRepository.findOwnedById(id, actor.actorUserId);

    if (!product) {
      const existingProduct = await this.productRepository.findById(id);

      if (existingProduct === null) {
        throw new NotFoundException("PRODUCT_NOT_FOUND", "Product not found");
      }

      throw new ForbiddenException("PRODUCT_DELETE_FORBIDDEN", "Product does not belong to the authenticated user");
    }

    const orderItemCount = await this.productRepository.countOrderItemsByProductId(id);

    if (orderItemCount > 0) {
      throw new ConflictException("PRODUCT_HAS_ORDER_ITEMS", "Product has associated order items");
    }

    await this.productRepository.delete(id);
  }
}
