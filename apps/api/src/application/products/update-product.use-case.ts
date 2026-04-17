import { Injectable, Inject } from "@nestjs/common";
import { PRODUCT_REPOSITORY } from "../../domain/tokens";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { ActorContext } from "../../domain/shared/actor.types";
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
    actor: ActorContext,
  ): Promise<UpdateProductResult> {
    const product =
      actor.actorRole === "ADMIN"
        ? await this.productRepository.findById(id)
        : await this.productRepository.findOwnedById(id, actor.actorUserId);

    if (!product) {
      const existingProduct = await this.productRepository.findById(id);

      if (existingProduct === null) {
        throw new NotFoundException("PRODUCT_NOT_FOUND", "Product not found");
      }

      throw new ForbiddenException("PRODUCT_EDIT_FORBIDDEN", "Product does not belong to the authenticated user");
    }

    return this.productRepository.update(id, input);
  }
}
