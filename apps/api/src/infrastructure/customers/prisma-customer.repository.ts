import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import type {
  CreateCustomerInput,
  CustomerEntity,
  ICustomerRepository,
  ListCustomersQuery,
  UpdateCustomerInput,
} from "../../domain/customers/customer.types";
import type { PaginatedResult } from "../../domain/shared/pagination.types";

type PrismaCustomerRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  taxId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapPrismaCustomerToEntity(customer: PrismaCustomerRecord): CustomerEntity {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    taxId: customer.taxId,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

@Injectable()
export class PrismaCustomerRepository implements ICustomerRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(input: CreateCustomerInput): Promise<CustomerEntity> {
    const customer = await this.prisma.customer.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        taxId: input.taxId ?? null,
      },
    });

    return mapPrismaCustomerToEntity(customer as PrismaCustomerRecord);
  }

  public async findById(id: string): Promise<CustomerEntity | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (customer === null) {
      return null;
    }

    return mapPrismaCustomerToEntity(customer as PrismaCustomerRecord);
  }

  public async findByEmail(email: string): Promise<CustomerEntity | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { email },
    });

    if (customer === null) {
      return null;
    }

    return mapPrismaCustomerToEntity(customer as PrismaCustomerRecord);
  }

  public async findByTaxId(taxId: string): Promise<CustomerEntity | null> {
    const customer = await this.prisma.customer.findUnique({
      where: { taxId },
    });

    if (customer === null) {
      return null;
    }

    return mapPrismaCustomerToEntity(customer as PrismaCustomerRecord);
  }

  public async list(query: ListCustomersQuery): Promise<PaginatedResult<CustomerEntity>> {
    const skip = (query.page - 1) * query.perPage;

    const where: Record<string, unknown> = {};

    if (query.search !== undefined) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: query.perPage,
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.perPage);

    return {
      data: (customers as PrismaCustomerRecord[]).map(mapPrismaCustomerToEntity),
      total,
      page: query.page,
      perPage: query.perPage,
      totalPages,
    };
  }

  public async update(id: string, input: UpdateCustomerInput): Promise<CustomerEntity> {
    const data: Record<string, unknown> = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }
    if (input.email !== undefined) {
      data.email = input.email;
    }
    if (input.phone !== undefined) {
      data.phone = input.phone;
    }
    if (input.taxId !== undefined) {
      data.taxId = input.taxId;
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data,
    });

    return mapPrismaCustomerToEntity(customer as PrismaCustomerRecord);
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.customer.delete({
      where: { id },
    });
  }

  public async countOrdersByCustomerId(customerId: string): Promise<number> {
    return this.prisma.order.count({
      where: { customerId },
    });
  }
}
