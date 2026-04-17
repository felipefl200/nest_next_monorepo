import { Injectable, Inject } from "@nestjs/common";
import { PRODUCT_REPOSITORY } from "../../domain/tokens";
import type { ActorContext } from "../../domain/shared/actor.types";
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

  public async execute(
    input: Omit<CreateProductInput, "ownerUserId">,
    actor: ActorContext,
  ): Promise<CreateProductResult> {
    return this.productRepository.create({
      ...input,
      ownerUserId: actor.actorUserId,
    });
  }
}
