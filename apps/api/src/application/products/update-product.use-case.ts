import { Injectable, Inject } from "@nestjs/common";
import { PRODUCT_REPOSITORY } from "../../domain/tokens";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type {
  IProductRepository,
  ProductEntity,
  UpdateProductInput,
} from "../../domain/products/product.types";

export type UpdateProductResult = ProductEntity;

@Injectable()
export class UpdateProductUseCase {
  public constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  public async execute(
    id: string,
    input: UpdateProductInput,
  ): Promise<UpdateProductResult> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException("PRODUCT_NOT_FOUND", "Product not found");
    }

    return this.productRepository.update(id, input);
  }
}
