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
import { CreateOrderUseCase } from "../../application/orders/create-order.use-case";
import { DeleteOrderUseCase } from "../../application/orders/delete-order.use-case";
import { GetOrderUseCase } from "../../application/orders/get-order.use-case";
import { ListOrdersUseCase } from "../../application/orders/list-orders.use-case";
import { UpdateOrderUseCase } from "../../application/orders/update-order.use-case";
import type { AccessTokenPayload } from "../../domain/auth/auth.types";
import {
  createOrderSchema,
  listOrdersQuerySchema,
  updateOrderSchema,
} from "../../domain/orders/order.schemas";
import type { UpdateOrderInput } from "../../domain/orders/order.types";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

type AuthenticatedRequest = Request & {
  user: AccessTokenPayload;
};

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
  public async create(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const validated = createOrderSchema.parse(body);
    const input = {
      customerId: validated.customerId,
      items: validated.items,
    };

    return this.createOrderUseCase.execute(input, {
      actorUserId: request.user.sub,
      actorRole: request.user.role,
    });
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
    @Req() request: AuthenticatedRequest,
  ) {
    const validated = updateOrderSchema.parse(body);
    const input: UpdateOrderInput = {
      customerId: validated.customerId,
      status: validated.status,
      items: validated.items,
    };

    return this.updateOrderUseCase.execute(id, input, {
      actorUserId: request.user.sub,
      actorRole: request.user.role,
    });
  }

  @Delete(":id")
  public async delete(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    await this.deleteOrderUseCase.execute(id, {
      actorUserId: request.user.sub,
      actorRole: request.user.role,
    });

    return {
      statusCode: HttpStatus.OK,
      message: "Order deleted successfully",
    };
  }
}
