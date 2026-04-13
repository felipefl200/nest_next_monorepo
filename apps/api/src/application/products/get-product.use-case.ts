import { Injectable, Inject } from "@nestjs/common";
import { PRODUCT_REPOSITORY } from "../../domain/tokens";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { IProductRepository, ProductEntity } from "../../domain/products/product.types";

export type GetProductResult = ProductEntity;

@Injectable()
export class GetProductUseCase {
  public constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  public async execute(id: string): Promise<GetProductResult> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException("PRODUCT_NOT_FOUND", "Product not found");
    }

    return product;
  }
}
