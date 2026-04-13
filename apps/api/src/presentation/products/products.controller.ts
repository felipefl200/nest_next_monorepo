import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { CreateProductUseCase } from "../../application/products/create-product.use-case";
import { GetProductUseCase } from "../../application/products/get-product.use-case";
import { ListProductsUseCase } from "../../application/products/list-products.use-case";
import { UpdateProductUseCase } from "../../application/products/update-product.use-case";
import { DeleteProductUseCase } from "../../application/products/delete-product.use-case";
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
} from "../../domain/products/product.schemas";
import type { CreateProductInput, UpdateProductInput } from "../../domain/products/product.types";

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
  public async create(@Body() body: unknown) {
    const validated = createProductSchema.parse(body);
    const input: CreateProductInput = {
      name: validated.name,
      description: validated.description,
      category: validated.category,
      price: validated.price,
      stock: validated.stock,
      isActive: validated.isActive,
    };
    return this.createProductUseCase.execute(input);
  }

  @Get()
  public async list(@Query() query: unknown) {
    const validated = listProductsQuerySchema.parse(query);
    return this.listProductsUseCase.execute({
      page: validated.page,
      perPage: validated.perPage,
      category: validated.category,
      isActive: validated.isActive,
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
  ) {
    const validated = updateProductSchema.parse(body);
    return this.updateProductUseCase.execute(id, validated);
  }

  @Delete(":id")
  public async delete(@Param("id") id: string) {
    await this.deleteProductUseCase.execute(id);
    return {
      statusCode: HttpStatus.OK,
      message: "Product deleted successfully",
    };
  }
}
