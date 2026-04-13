import { Injectable, Inject } from "@nestjs/common";
import { PRODUCT_REPOSITORY } from "../../domain/tokens";
import type {
  IProductRepository,
  CreateProductInput,
  ProductEntity,
} from "../../domain/products/product.types";

export type CreateProductResult = ProductEntity;

@Injectable()
export class CreateProductUseCase {
  public constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  public async execute(input: CreateProductInput): Promise<CreateProductResult> {
    return this.productRepository.create(input);
  }
}
