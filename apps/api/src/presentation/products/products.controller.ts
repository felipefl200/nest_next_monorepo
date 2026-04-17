import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { CreateProductUseCase } from "../../application/products/create-product.use-case";
import { DeleteProductUseCase } from "../../application/products/delete-product.use-case";
import { GetProductUseCase } from "../../application/products/get-product.use-case";
import { ListProductsUseCase } from "../../application/products/list-products.use-case";
import { UpdateProductUseCase } from "../../application/products/update-product.use-case";
import type { AccessTokenPayload } from "../../domain/auth/auth.types";
import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
} from "../../domain/products/product.schemas";
import type { UpdateProductInput } from "../../domain/products/product.types";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

type AuthenticatedRequest = Request & {
  user: AccessTokenPayload;
};

@Controller("products")
@UseGuards(JwtAuthGuard)
export class ProductsController {
  public constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  @Post()
  public async create(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const validated = createProductSchema.parse(body);
    const input = {
      name: validated.name,
      description: validated.description,
      category: validated.category,
      price: validated.price,
      stock: validated.stock,
      isActive: validated.isActive,
    };

    return this.createProductUseCase.execute(input, {
      actorUserId: request.user.sub,
      actorRole: request.user.role,
    });
  }

  @Get()
  public async list(@Query() query: unknown) {
    const validated = listProductsQuerySchema.parse(query);
    return this.listProductsUseCase.execute({
      page: validated.page,
      perPage: validated.perPage,
      category: validated.category,
      isActive: validated.isActive,
      search: validated.search,
    });
  }

  @Get(":id")
  public async getById(@Param("id") id: string) {
    return this.getProductUseCase.execute(id);
  }

  @Patch(":id")
  public async update(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ) {
    const validated = updateProductSchema.parse(body);
    const input: UpdateProductInput = { ...validated };

    return this.updateProductUseCase.execute(id, input, {
      actorUserId: request.user.sub,
      actorRole: request.user.role,
    });
  }

  @Delete(":id")
  public async delete(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    await this.deleteProductUseCase.execute(id, {
      actorUserId: request.user.sub,
      actorRole: request.user.role,
    });

    return {
      statusCode: HttpStatus.OK,
      message: "Product deleted successfully",
    };
  }
}
