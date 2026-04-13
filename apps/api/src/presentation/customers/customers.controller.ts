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
  UseGuards,
} from "@nestjs/common";
import { CreateCustomerUseCase } from "../../application/customers/create-customer.use-case";
import { DeleteCustomerUseCase } from "../../application/customers/delete-customer.use-case";
import { GetCustomerUseCase } from "../../application/customers/get-customer.use-case";
import { ListCustomersUseCase } from "../../application/customers/list-customers.use-case";
import { UpdateCustomerUseCase } from "../../application/customers/update-customer.use-case";
import {
  createCustomerSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from "../../domain/customers/customer.schemas";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "../../domain/customers/customer.types";
import { Roles } from "../decorators/roles.decorator";
import { RoleGuard } from "../guards/role.guard";

@Controller("customers")
export class CustomersController {
  public constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly getCustomerUseCase: GetCustomerUseCase,
    private readonly listCustomersUseCase: ListCustomersUseCase,
    private readonly updateCustomerUseCase: UpdateCustomerUseCase,
    private readonly deleteCustomerUseCase: DeleteCustomerUseCase,
  ) {}

  @Post()
  public async create(@Body() body: unknown) {
    const validated = createCustomerSchema.parse(body);
    const input: CreateCustomerInput = {
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      taxId: validated.taxId,
    };

    return this.createCustomerUseCase.execute(input);
  }

  @Get()
  public async list(@Query() query: unknown) {
    const validated = listCustomersQuerySchema.parse(query);
    return this.listCustomersUseCase.execute({
      page: validated.page,
      perPage: validated.perPage,
      search: validated.search,
    });
  }

  @Get(":id")
  public async getById(@Param("id") id: string) {
    return this.getCustomerUseCase.execute(id);
  }

  @Patch(":id")
  public async update(@Param("id") id: string, @Body() body: unknown) {
    const validated = updateCustomerSchema.parse(body);
    const input: UpdateCustomerInput = {
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      taxId: validated.taxId,
    };

    return this.updateCustomerUseCase.execute(id, input);
  }

  @Delete(":id")
  @UseGuards(RoleGuard)
  @Roles("ADMIN")
  public async delete(@Param("id") id: string) {
    await this.deleteCustomerUseCase.execute(id);

    return {
      statusCode: HttpStatus.OK,
      message: "Customer deleted successfully",
    };
  }
}
