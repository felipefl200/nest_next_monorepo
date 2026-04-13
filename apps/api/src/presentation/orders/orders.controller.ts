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
import { CreateOrderUseCase } from "../../application/orders/create-order.use-case";
import { GetOrderUseCase } from "../../application/orders/get-order.use-case";
import { ListOrdersUseCase } from "../../application/orders/list-orders.use-case";
import { UpdateOrderUseCase } from "../../application/orders/update-order.use-case";
import { DeleteOrderUseCase } from "../../application/orders/delete-order.use-case";
import {
  createOrderSchema,
  updateOrderSchema,
  listOrdersQuerySchema,
} from "../../domain/orders/order.schemas";
import type { CreateOrderInput, OrderStatus } from "../../domain/orders/order.types";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  public constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly updateOrderUseCase: UpdateOrderUseCase,
    private readonly deleteOrderUseCase: DeleteOrderUseCase,
  ) {}

  @Post()
  public async create(@Body() body: unknown) {
    const validated = createOrderSchema.parse(body);
    const input: CreateOrderInput = {
      customerId: validated.customerId,
      items: validated.items,
    };
    return this.createOrderUseCase.execute(input);
  }

  @Get()
  public async list(@Query() query: unknown) {
    const validated = listOrdersQuerySchema.parse(query);
    return this.listOrdersUseCase.execute({
      page: validated.page,
      perPage: validated.perPage,
      status: validated.status,
      customerId: validated.customerId,
    });
  }

  @Get(":id")
  public async getById(@Param("id") id: string) {
    return this.getOrderUseCase.execute(id);
  }

  @Patch(":id")
  public async updateStatus(
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const validated = updateOrderSchema.parse(body);
    return this.updateOrderUseCase.execute(id, validated.status as OrderStatus);
  }

  @Delete(":id")
  public async delete(@Param("id") id: string) {
    await this.deleteOrderUseCase.execute(id);
    return {
      statusCode: HttpStatus.OK,
      message: "Order deleted successfully",
    };
  }
}
