import { Injectable, Inject } from "@nestjs/common";
import { PRODUCT_REPOSITORY } from "../../domain/tokens";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { IProductRepository } from "../../domain/products/product.types";

@Injectable()
export class DeleteProductUseCase {
  public constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  public async execute(id: string): Promise<void> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException("PRODUCT_NOT_FOUND", "Product not found");
    }

    const orderItemCount = await this.productRepository.countOrderItemsByProductId(id);

    if (orderItemCount > 0) {
      throw new ConflictException("PRODUCT_HAS_ORDER_ITEMS", "Product has associated order items");
    }

    await this.productRepository.delete(id);
  }
}
