import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import type {
  IOrderRepository,
  CreateOrderInput,
  OrderEntity,
  OrderItemData,
  ListOrdersQuery,
  OrderStatus,
  UpdateOrderInput,
} from "../../domain/orders/order.types";
import type { PaginatedResult } from "../../domain/shared/pagination.types";

type PrismaOrderWithRelations = {
  id: string;
  number: string;
  customerId: string;
  ownerUserId: string;
  customer: {
    name: string;
  };
  status: OrderStatus;
  total: number;
  items: {
    id: string;
    productId: string;
    product: {
      name: string;
    };
    quantity: number;
    unitPrice: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

function mapPrismaOrderToEntity(order: PrismaOrderWithRelations): OrderEntity {
  return {
    id: order.id,
    number: order.number,
    customerId: order.customerId,
    customerName: order.customer.name,
    ownerUserId: order.ownerUserId,
    status: order.status,
    total: order.total.toString(),
    items: order.items.map(
      (item): OrderItemData => ({
        productId: item.productId,
        productName: item.product?.name ?? "",
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
      }),
    ),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(input: CreateOrderInput): Promise<OrderEntity> {
    const orderNumber = await this.generateNextOrderNumber();

    const total = input.items.reduce(
      (sum, item) => sum + Number.parseFloat(item.unitPrice) * item.quantity,
      0,
    );

    const order = await this.prisma.order.create({
      data: {
        number: orderNumber,
        customerId: input.customerId,
        ownerUserId: input.ownerUserId,
        status: "PENDING",
        total,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: Number.parseFloat(item.unitPrice),
          })),
        },
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return mapPrismaOrderToEntity(order as unknown as PrismaOrderWithRelations);
  }

  public async findById(id: string): Promise<OrderEntity | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    return mapPrismaOrderToEntity(order as unknown as PrismaOrderWithRelations);
  }

  public async findOwnedById(id: string, ownerUserId: string): Promise<OrderEntity | null> {
    const order = await this.prisma.order.findFirst({
      where: { id, ownerUserId },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (order === null) {
      return null;
    }

    return mapPrismaOrderToEntity(order as unknown as PrismaOrderWithRelations);
  }

  public async findByNumber(number: string): Promise<OrderEntity | null> {
    const order = await this.prisma.order.findUnique({
      where: { number },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    return mapPrismaOrderToEntity(order as unknown as PrismaOrderWithRelations);
  }

  public async list(query: ListOrdersQuery): Promise<PaginatedResult<OrderEntity>> {
    const { page, perPage, status, customerId } = query;
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: perPage,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          customer: {
            select: {
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return {
      data: (orders as unknown as PrismaOrderWithRelations[]).map(mapPrismaOrderToEntity),
      total,
      page,
      perPage,
      totalPages,
    };
  }

  public async update(id: string, input: UpdateOrderInput): Promise<OrderEntity> {
    const total = input.items.reduce(
      (sum, item) => sum + Number.parseFloat(item.unitPrice) * item.quantity,
      0,
    );

    const order = await this.prisma.$transaction(async (transaction) => {
      await transaction.orderItem.deleteMany({
        where: { orderId: id },
      });

      return transaction.order.update({
        where: { id },
        data: {
          customerId: input.customerId,
          status: input.status,
          total,
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: Number.parseFloat(item.unitPrice),
            })),
          },
        },
        include: {
          customer: {
            select: {
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    return mapPrismaOrderToEntity(order as unknown as PrismaOrderWithRelations);
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.order.delete({
      where: { id },
    });
  }

  public async generateNextOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });

    const sequence = count + 1;
    return `ORD-${year}-${String(sequence).padStart(4, "0")}`;
  }
}
