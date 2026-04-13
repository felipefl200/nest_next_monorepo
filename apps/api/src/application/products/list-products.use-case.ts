import { Injectable, Inject } from "@nestjs/common";
import { PRODUCT_REPOSITORY } from "../../domain/tokens";
import type {
  IProductRepository,
  ListProductsQuery,
  ProductEntity,
  PaginatedResult,
} from "../../domain/products/product.types";

export type ListProductsResult = PaginatedResult<ProductEntity>;

@Injectable()
export class ListProductsUseCase {
  public constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  public async execute(query: ListProductsQuery): Promise<ListProductsResult> {
    return this.productRepository.list(query);
  }
}
