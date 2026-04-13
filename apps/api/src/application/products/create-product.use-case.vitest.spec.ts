import { describe, expect, it, vi, beforeEach } from "vitest";
import { CreateProductUseCase } from "./create-product.use-case";
import type {
  IProductRepository,
  CreateProductInput,
  ProductEntity,
} from "../../domain/products/product.types";

function createMockRepository(): IProductRepository {
  const mockProduct: ProductEntity = {
    id: "product-1",
    name: "Test Product",
    description: "A test product",
    category: "Electronics",
    price: "99.99",
    stock: 100,
    isActive: true,
    createdAt: "2026-04-06T10:00:00.000Z",
    updatedAt: "2026-04-06T10:00:00.000Z",
  };

  return {
    create: vi.fn(async () => mockProduct),
    findById: vi.fn(async () => null),
    list: vi.fn(async () => ({
      data: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    })),
    update: vi.fn(async () => mockProduct),
    delete: vi.fn(async () => undefined),
  };
}

describe("CreateProductUseCase", () => {
  let mockRepo: IProductRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
  });

  it("creates a product successfully", async () => {
    const input: CreateProductInput = {
      name: "Test Product",
      description: "A test product",
      category: "Electronics",
      price: "99.99",
      stock: 100,
    };

    const useCase = new CreateProductUseCase(mockRepo);
    const result = await useCase.execute(input);

    expect(result).toMatchObject({
      id: "product-1",
      name: "Test Product",
      category: "Electronics",
      price: "99.99",
      stock: 100,
      isActive: true,
    });
    expect(mockRepo.create).toHaveBeenCalledWith(input);
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
  });

  it("creates a product with minimal fields", async () => {
    const input: CreateProductInput = {
      name: "Minimal Product",
      category: "Books",
      price: "29.99",
      stock: 50,
    };

    const useCase = new CreateProductUseCase(mockRepo);
    await useCase.execute(input);

    expect(mockRepo.create).toHaveBeenCalledWith(input);
  });

  it("creates a product with isActive default", async () => {
    const input: CreateProductInput = {
      name: "Inactive Product",
      category: "Toys",
      price: "19.99",
      stock: 0,
      isActive: false,
    };

    const useCase = new CreateProductUseCase(mockRepo);
    await useCase.execute(input);

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
      }),
    );
  });
});
