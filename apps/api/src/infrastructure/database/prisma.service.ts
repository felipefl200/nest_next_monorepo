import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { parsePrismaEnv } from "@repo/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaAuthSessionClient } from "../auth/prisma-auth-session.repository";
import { PrismaRateLimitClient } from "../rate-limit/prisma-rate-limit.store";

type PrismaOrderItemRecord = {
  id: string;
  productId: string;
  orderId: string;
  product?: { name: string };
  quantity: number;
  unitPrice: number;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaOrderRecord = {
  id: string;
  number: string;
  customerId: string;
  ownerUserId: string;
  customer: { name: string };
  status: string;
  total: number;
  items: PrismaOrderItemRecord[];
  createdAt: Date;
  updatedAt: Date;
};

type PrismaProductRecord = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  isActive: boolean;
  ownerUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaIncludeWithSelect = {
  select?: Record<string, boolean>;
  include?: Record<string, boolean | PrismaIncludeWithSelect>;
};

type PrismaDomainClient = {
  setting: {
    findMany(args?: { orderBy?: { key: "asc" | "desc" } }): Promise<
      {
        key: string;
        value: string;
        createdAt: Date;
        updatedAt: Date;
      }[]
    >;
    upsert(args: {
      where: { key: string };
      update: { value: string };
      create: { key: string; value: string };
    }): Promise<{
      key: string;
      value: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
  customer: {
    count(args?: { where?: Record<string, unknown> }): Promise<number>;
    create(args: { data: Record<string, unknown> }): Promise<{
      id: string;
      name: string;
      email: string;
      phone: string;
      taxId: string | null;
      ownerUserId: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    findUnique(args: { where: { id?: string; email?: string; taxId?: string } }): Promise<{
      id: string;
      name: string;
      email: string;
      phone: string;
      taxId: string | null;
      ownerUserId: string;
      createdAt: Date;
      updatedAt: Date;
    } | null>;
    findFirst(args: {
      where?: Record<string, unknown>;
    }): Promise<{
      id: string;
      name: string;
      email: string;
      phone: string;
      taxId: string | null;
      ownerUserId: string;
      createdAt: Date;
      updatedAt: Date;
    } | null>;
    findMany(args: {
      where?: Record<string, unknown>;
      skip?: number;
      take?: number;
      orderBy?: { createdAt?: "asc" | "desc" };
    }): Promise<
      {
        id: string;
        name: string;
        email: string;
        phone: string;
        taxId: string | null;
        ownerUserId: string;
        createdAt: Date;
        updatedAt: Date;
      }[]
    >;
    update(args: {
      where: { id: string };
      data: Record<string, unknown>;
    }): Promise<{
      id: string;
      name: string;
      email: string;
      phone: string;
      taxId: string | null;
      ownerUserId: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    delete(args: { where: { id: string } }): Promise<void>;
  };
  product: {
    count(args?: { where?: Record<string, unknown> }): Promise<number>;
    create(args: {
      data: Record<string, unknown>;
    }): Promise<PrismaProductRecord>;
    findUnique(args: {
      where: { id?: string };
    }): Promise<PrismaProductRecord | null>;
    findFirst(args: {
      where?: Record<string, unknown>;
    }): Promise<PrismaProductRecord | null>;
    findMany(args: {
      where?: Record<string, unknown>;
      skip?: number;
      take?: number;
      orderBy?: { createdAt?: "asc" | "desc" };
    }): Promise<PrismaProductRecord[]>;
    update(args: {
      where: { id: string };
      data: Record<string, unknown>;
    }): Promise<PrismaProductRecord>;
    delete(args: { where: { id: string } }): Promise<void>;
  };
  order: {
    aggregate(args?: {
      _count?: Record<string, boolean>;
      _sum?: { total?: boolean };
      where?: Record<string, unknown>;
      orderBy?: { createdAt?: "asc" | "desc" };
      skip?: number;
      take?: number;
      select?: Record<string, unknown>;
      groupBy?: { createdAt: true }[];
    }): Promise<
      {
        _count?: { id?: number } | null;
        _sum?: { total?: number | string | null } | null;
      }[]
    >;
    groupBy(args?: {
      by: string[];
      _count?: Record<string, boolean>;
      _sum?: { total?: boolean };
      where?: Record<string, unknown>;
    }): Promise<
      {
        createdAt: Date;
        _count: { id: number };
        _sum: { total: number | string | null };
      }[]
    >;
    create(args: {
      data: Record<string, unknown>;
      include?: Record<string, boolean | PrismaIncludeWithSelect>;
    }): Promise<PrismaOrderRecord>;
    findUnique(args: {
      where: { id?: string; number?: string };
      include?: Record<string, boolean | PrismaIncludeWithSelect>;
    }): Promise<PrismaOrderRecord | null>;
    findFirst(args: {
      where?: Record<string, unknown>;
      include?: Record<string, boolean | PrismaIncludeWithSelect>;
    }): Promise<PrismaOrderRecord | null>;
    findMany(args: {
      where?: Record<string, unknown>;
      skip?: number;
      take?: number;
      orderBy?: { createdAt?: "asc" | "desc" };
      include?: Record<string, boolean | PrismaIncludeWithSelect>;
    }): Promise<PrismaOrderRecord[]>;
    update(args: {
      where: { id: string };
      data: Record<string, unknown>;
      include?: Record<string, boolean | PrismaIncludeWithSelect>;
    }): Promise<PrismaOrderRecord>;
    delete(args: { where: { id: string } }): Promise<void>;
    count(args?: { where?: Record<string, unknown> }): Promise<number>;
  };
  orderItem: {
    count(args?: { where?: Record<string, unknown> }): Promise<number>;
    deleteMany(args?: { where?: Record<string, unknown> }): Promise<{ count: number }>;
  };
};

type PrismaCoreClient = PrismaAuthSessionClient &
  PrismaRateLimitClient &
  PrismaDomainClient & {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRaw<T>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
    $transaction<T>(callback: (transaction: PrismaCoreClient) => Promise<T>): Promise<T>;
  };

type PrismaServiceInit = {
  client: PrismaCoreClient;
  pool: Pool;
};

function createPrismaClient(): PrismaServiceInit {
  const databaseUrl = parsePrismaEnv(process.env).DATABASE_URL;

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter }) as unknown as PrismaCoreClient;

  return { client, pool };
}

@Injectable()
export class PrismaService
  implements
    OnModuleInit,
    OnModuleDestroy,
    PrismaAuthSessionClient,
    PrismaRateLimitClient,
    PrismaDomainClient
{
  private readonly client: PrismaCoreClient;
  private readonly pool: Pool;

  public constructor() {
    const init = createPrismaClient();
    this.client = init.client;
    this.pool = init.pool;
  }

  public get user(): PrismaAuthSessionClient["user"] {
    return this.client.user;
  }

  public get session(): PrismaAuthSessionClient["session"] {
    return this.client.session;
  }

  public get rateLimitEntry(): PrismaRateLimitClient["rateLimitEntry"] {
    return this.client.rateLimitEntry;
  }

  public $queryRaw<T>(query: TemplateStringsArray, ...values: unknown[]): Promise<T> {
    return this.client.$queryRaw<T>(query, ...values);
  }

  public $transaction<T>(
    callback: (transaction: PrismaCoreClient) => Promise<T>,
  ): Promise<T> {
    return this.client.$transaction<T>(callback);
  }

  public get customer(): PrismaDomainClient["customer"] {
    return this.client.customer;
  }

  public get setting(): PrismaDomainClient["setting"] {
    return this.client.setting;
  }

  public get product(): PrismaDomainClient["product"] {
    return this.client.product;
  }

  public get order(): PrismaDomainClient["order"] {
    return this.client.order;
  }

  public get orderItem(): PrismaDomainClient["orderItem"] {
    return this.client.orderItem;
  }

  public async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  public async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
    await this.pool.end();
  }
}
