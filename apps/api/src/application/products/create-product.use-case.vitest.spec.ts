import { describe, expect, it, vi, beforeEach } from "vitest";
import { CreateProductUseCase } from "./create-product.use-case";
import type {
  IProductRepository,
  CreateProductInput,
  ProductEntity,
} from "../../domain/products/product.types";

const ACTOR = {
  actorUserId: "user-1",
  actorRole: "MANAGER" as const,
};

function createMockRepository(): IProductRepository {
  const mockProduct: ProductEntity = {
    id: "product-1",
    name: "Test Product",
    description: "A test product",
    category: "Electronics",
    price: "99.99",
    stock: 100,
    isActive: true,
    ownerUserId: ACTOR.actorUserId,
    createdAt: "2026-04-06T10:00:00.000Z",
    updatedAt: "2026-04-06T10:00:00.000Z",
  };

  return {
    create: vi.fn(async () => mockProduct),
    findById: vi.fn(async () => null),
    findOwnedById: vi.fn(async () => null),
    findManyByIds: vi.fn(async () => []),
    list: vi.fn(async () => ({
      data: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    })),
    update: vi.fn(async () => mockProduct),
    delete: vi.fn(async () => undefined),
    countOrderItemsByProductId: vi.fn(async () => 0),
  };
}

describe("CreateProductUseCase", () => {
  let mockRepo: IProductRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
  });

  it("creates a product successfully", async () => {
    const input = {
      name: "Test Product",
      description: "A test product",
      category: "Electronics",
      price: "99.99",
      stock: 100,
    };

    const useCase = new CreateProductUseCase(mockRepo);
    const result = await useCase.execute(input, ACTOR);

    expect(result).toMatchObject({
      id: "product-1",
      name: "Test Product",
      category: "Electronics",
      price: "99.99",
      stock: 100,
      isActive: true,
    });
    expect(mockRepo.create).toHaveBeenCalledWith({ ...input, ownerUserId: ACTOR.actorUserId });
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
  });

  it("creates a product with minimal fields", async () => {
    const input = {
      name: "Minimal Product",
      category: "Books",
      price: "29.99",
      stock: 50,
    };

    const useCase = new CreateProductUseCase(mockRepo);
    await useCase.execute(input, ACTOR);

    expect(mockRepo.create).toHaveBeenCalledWith({ ...input, ownerUserId: ACTOR.actorUserId });
  });

  it("creates a product with isActive default", async () => {
    const input = {
      name: "Inactive Product",
      category: "Toys",
      price: "19.99",
      stock: 0,
      isActive: false,
    };

    const useCase = new CreateProductUseCase(mockRepo);
    await useCase.execute(input, ACTOR);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
      }),
    );
  });
});
