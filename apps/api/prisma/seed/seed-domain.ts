import { loadEnv, parseSeedDomainEnv } from "@repo/config";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { fakerPT_BR as faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

loadEnv(fileURLToPath(new URL("../..", import.meta.url)));
const env = parseSeedDomainEnv(process.env);

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED";

type SeedCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  taxId: string | null;
  ownerUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

type SeedProduct = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  stock: number;
  isActive: boolean;
  ownerUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

type SeedSetting = {
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
};

type SeedOrder = {
  id: string;
  number: string;
  customerId: string;
  ownerUserId: string;
  status: OrderStatus;
  total: string;
  createdAt: Date;
  updatedAt: Date;
};

type SeedOrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  createdAt: Date;
  updatedAt: Date;
};

type ProductCategory = {
  name: string;
  minPrice: number;
  maxPrice: number;
};

const categories: ProductCategory[] = [
  { name: "Electronics", minPrice: 500, maxPrice: 8000 },
  { name: "Home", minPrice: 80, maxPrice: 3000 },
  { name: "Fashion", minPrice: 40, maxPrice: 1200 },
  { name: "Books", minPrice: 20, maxPrice: 200 },
  { name: "Sports", minPrice: 60, maxPrice: 2500 },
  { name: "Beauty", minPrice: 25, maxPrice: 600 },
  { name: "Food", minPrice: 10, maxPrice: 150 },
  { name: "Office", minPrice: 15, maxPrice: 900 },
  { name: "Pet", minPrice: 20, maxPrice: 400 },
  { name: "Tools", minPrice: 30, maxPrice: 1800 },
];

const statusDistributionPast: Array<{ status: OrderStatus; weight: number }> = [
  { status: "DELIVERED", weight: 55 },
  { status: "SHIPPED", weight: 15 },
  { status: "CONFIRMED", weight: 12 },
  { status: "CANCELED", weight: 10 },
  { status: "PENDING", weight: 8 },
];

const statusDistributionFuture: Array<{ status: OrderStatus; weight: number }> =
  [
    { status: "PENDING", weight: 65 },
    { status: "CONFIRMED", weight: 35 },
  ];

function toMoney(value: number): string {
  return value.toFixed(2);
}

function weightedPick<T>(items: Array<{ weight: number; value: T }>): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const threshold = faker.number.float({ min: 0, max: total });

  let running = 0;
  for (const item of items) {
    running += item.weight;
    if (threshold <= running) {
      return item.value;
    }
  }

  return items[items.length - 1]!.value;
}

function randomDateWithinWeightedWindow(start: Date, end: Date): Date {
  const maxWeight = 1.75;

  while (true) {
    const date = faker.date.between({ from: start, to: end });
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const lastDayOfMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    const isLastFiveDays = date.getDate() >= lastDayOfMonth - 4;

    let weight = 1;
    if (isWeekend) {
      weight *= 1.4;
    }
    if (isLastFiveDays) {
      weight *= 1.25;
    }

    const acceptance = weight / maxWeight;
    if (faker.number.float({ min: 0, max: 1 }) <= acceptance) {
      return date;
    }
  }
}

function pickStatus(createdAt: Date, now: Date): OrderStatus {
  const distribution =
    createdAt > now ? statusDistributionFuture : statusDistributionPast;

  return weightedPick(
    distribution.map((item) => ({
      weight: item.weight,
      value: item.status,
    })),
  );
}

function uniqueEmail(baseName: string, index: number): string {
  const slug = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");

  return `${slug}.${index}@example.local`;
}

function uniqueTaxId(used: Set<string>): string {
  while (true) {
    const candidate = faker.string.numeric(11);
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
}

function createCustomers(count: number, ownerUserId: string): SeedCustomer[] {
  const taxIdRegistry = new Set<string>();
  const now = new Date();
  const customers: SeedCustomer[] = [];

  for (let index = 0; index < count; index += 1) {
    const name = faker.person.fullName();
    const createdAt = faker.date.past({ years: 2 });

    customers.push({
      id: faker.string.uuid(),
      name,
      email: uniqueEmail(name, index + 1),
      phone: faker.phone.number(),
      taxId:
        faker.number.int({ min: 1, max: 100 }) <= 85
          ? uniqueTaxId(taxIdRegistry)
          : null,
      ownerUserId,
      createdAt,
      updatedAt: now,
    });
  }

  return customers;
}

function randomProductName(category: string): string {
  const adjectives = [
    "Premium",
    "Compact",
    "Advanced",
    "Essential",
    "Smart",
    "Classic",
    "Ultra",
    "Eco",
    "Pro",
    "Max",
  ];

  const nouns = [
    "Kit",
    "Pack",
    "Model",
    "Set",
    "Edition",
    "Series",
    "Collection",
    "Solution",
    "Line",
    "Version",
  ];

  return `${category} ${faker.helpers.arrayElement(adjectives)} ${faker.helpers.arrayElement(nouns)}`;
}

function createProducts(count: number, ownerUserId: string): SeedProduct[] {
  const now = new Date();
  const products: SeedProduct[] = [];

  for (let index = 0; index < count; index += 1) {
    const category = faker.helpers.arrayElement(categories);
    const rawPrice = faker.number.float({
      min: category.minPrice,
      max: category.maxPrice,
      fractionDigits: 2,
    });

    products.push({
      id: faker.string.uuid(),
      name: randomProductName(category.name),
      description: faker.commerce.productDescription(),
      category: category.name,
      price: toMoney(rawPrice),
      stock: faker.number.int({ min: 0, max: 450 }),
      isActive: faker.number.int({ min: 1, max: 100 }) <= 92,
      ownerUserId,
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: now,
    });
  }

  return products;
}

function createSettings(): SeedSetting[] {
  const now = new Date();

  const baseSettings: Array<{ key: string; value: string }> = [
    { key: "company.name", value: "Ecommerce Admin" },
    { key: "company.timezone", value: "America/Sao_Paulo" },
    { key: "orders.autoCancelHours", value: "72" },
    { key: "orders.defaultPageSize", value: "20" },
    { key: "products.lowStockThreshold", value: "10" },
    { key: "dashboard.currency", value: "BRL" },
    { key: "dashboard.kpiMonths", value: "6" },
    { key: "security.passwordMinLength", value: "8" },
    { key: "security.maxLoginAttempts", value: "5" },
    { key: "security.refreshLimitPerMinute", value: "10" },
  ];

  return baseSettings.map((setting) => ({
    key: setting.key,
    value: setting.value,
    createdAt: now,
    updatedAt: now,
  }));
}

function createOrdersAndItems(params: {
  orderCount: number;
  customers: SeedCustomer[];
  products: SeedProduct[];
  ownerUserId: string;
}): { orders: SeedOrder[]; orderItems: SeedOrderItem[] } {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - 3);

  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 3);

  const orders: SeedOrder[] = [];
  const orderItems: SeedOrderItem[] = [];

  for (let index = 0; index < params.orderCount; index += 1) {
    const createdAt = randomDateWithinWeightedWindow(startDate, endDate);
    const status = pickStatus(createdAt, now);
    const customer = faker.helpers.arrayElement(params.customers);

    const orderId = faker.string.uuid();
    const orderNumber = `ORD-${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, "0")}-${String(index + 1).padStart(6, "0")}`;

    const itemsInOrder = faker.number.int({ min: 1, max: 5 });
    const usedProductIds = new Set<string>();

    let total = 0;

    for (let itemIndex = 0; itemIndex < itemsInOrder; itemIndex += 1) {
      let product = faker.helpers.arrayElement(params.products);

      while (usedProductIds.has(product.id)) {
        product = faker.helpers.arrayElement(params.products);
      }

      usedProductIds.add(product.id);

      const quantity = faker.number.int({ min: 1, max: 6 });
      const baseUnitPrice = Number.parseFloat(product.price);
      const variationFactor = faker.number.float({
        min: 0.85,
        max: 1.15,
        fractionDigits: 4,
      });
      const variedUnitPrice = Math.max(
        1,
        Number.parseFloat((baseUnitPrice * variationFactor).toFixed(2)),
      );

      total += variedUnitPrice * quantity;

      orderItems.push({
        id: faker.string.uuid(),
        orderId,
        productId: product.id,
        quantity,
        unitPrice: toMoney(variedUnitPrice),
        createdAt,
        updatedAt: createdAt,
      });
    }

    orders.push({
      id: orderId,
      number: orderNumber,
      customerId: customer.id,
      ownerUserId: params.ownerUserId,
      status,
      total: toMoney(Number.parseFloat(total.toFixed(2))),
      createdAt,
      updatedAt: createdAt,
    });
  }

  return { orders, orderItems };
}

async function createManyInChunks<T>(params: {
  data: T[];
  chunkSize: number;
  insert: (chunk: T[]) => Promise<void>;
}): Promise<void> {
  for (let start = 0; start < params.data.length; start += params.chunkSize) {
    const chunk = params.data.slice(start, start + params.chunkSize);
    await params.insert(chunk);
  }
}

async function cleanupDomain(prisma: PrismaClient): Promise<void> {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
}

async function main(): Promise<void> {
  faker.seed(env.DOMAIN_SEED_RANDOM_SEED);

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await cleanupDomain(prisma);

    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@ecommerce.local" },
    });

    if (adminUser === null) {
      throw new Error("Admin seed user not found. Run auth seed before domain seed.");
    }

    const customers = createCustomers(50, adminUser.id);
    const products = createProducts(100, adminUser.id);
    const settings = createSettings();
    const { orders, orderItems } = createOrdersAndItems({
      orderCount: env.DOMAIN_SEED_ORDER_COUNT,
      customers,
      products,
      ownerUserId: adminUser.id,
    });

    await prisma.customer.createMany({ data: customers });
    await prisma.product.createMany({ data: products });
    await prisma.setting.createMany({ data: settings });

    await createManyInChunks({
      data: orders,
      chunkSize: 500,
      insert: async (chunk) => {
        await prisma.order.createMany({ data: chunk });
      },
    });

    await createManyInChunks({
      data: orderItems,
      chunkSize: 1000,
      insert: async (chunk) => {
        await prisma.orderItem.createMany({ data: chunk });
      },
    });

    const minDate = orders.reduce(
      (min, order) => (order.createdAt < min ? order.createdAt : min),
      orders[0]!.createdAt,
    );
    const maxDate = orders.reduce(
      (max, order) => (order.createdAt > max ? order.createdAt : max),
      orders[0]!.createdAt,
    );

    const statusSummary = orders.reduce<Record<OrderStatus, number>>(
      (acc, order) => {
        acc[order.status] += 1;
        return acc;
      },
      {
        PENDING: 0,
        CONFIRMED: 0,
        SHIPPED: 0,
        DELIVERED: 0,
        CANCELED: 0,
      },
    );

    console.info("Domain seed completed");
    console.info(`Customers: ${customers.length}`);
    console.info(`Products: ${products.length}`);
    console.info(`Settings: ${settings.length}`);
    console.info(`Orders: ${orders.length}`);
    console.info(`OrderItems: ${orderItems.length}`);
    console.info(
      `Date range: ${minDate.toISOString()} -> ${maxDate.toISOString()}`,
    );
    console.info(`Status distribution: ${JSON.stringify(statusSummary)}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
