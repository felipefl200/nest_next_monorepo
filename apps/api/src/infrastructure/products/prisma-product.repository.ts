import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import type {
  IProductRepository,
  CreateProductInput,
  ProductEntity,
  ListProductsQuery,
  PaginatedResult,
  UpdateProductInput,
} from "../../domain/products/product.types";

type PrismaProductRecord = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function mapPrismaProductToEntity(product: PrismaProductRecord): ProductEntity {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price.toString(),
    stock: product.stock,
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async create(input: CreateProductInput): Promise<ProductEntity> {
    const product = await this.prisma.product.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        category: input.category,
        price: Number.parseFloat(input.price),
        stock: input.stock,
        isActive: input.isActive ?? true,
      },
    });

    return mapPrismaProductToEntity(product as PrismaProductRecord);
  }

  public async findById(id: string): Promise<ProductEntity | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return null;
    }

    return mapPrismaProductToEntity(product as PrismaProductRecord);
  }

  public async list(query: ListProductsQuery): Promise<PaginatedResult<ProductEntity>> {
    const { page, perPage, category, isActive } = query;
    const skip = (page - 1) * perPage;

    const where: Record<string, unknown> = {};
    if (category) {
      where.category = category;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: perPage,
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return {
      data: (products as PrismaProductRecord[]).map(mapPrismaProductToEntity),
      total,
      page,
      perPage,
      totalPages,
    };
  }

  public async update(
    id: string,
    input: UpdateProductInput,
  ): Promise<ProductEntity> {
    const data: Record<string, unknown> = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }
    if (input.description !== undefined) {
      data.description = input.description;
    }
    if (input.category !== undefined) {
      data.category = input.category;
    }
    if (input.price !== undefined) {
      data.price = Number.parseFloat(input.price);
    }
    if (input.stock !== undefined) {
      data.stock = input.stock;
    }
    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }

    const product = await this.prisma.product.update({
      where: { id },
      data,
    });

    return mapPrismaProductToEntity(product as PrismaProductRecord);
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id },
    });
  }
}
