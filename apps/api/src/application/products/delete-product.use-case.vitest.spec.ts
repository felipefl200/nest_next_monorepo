import { describe, expect, it, vi, beforeEach } from "vitest";
import { DeleteProductUseCase } from "./delete-product.use-case";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { IProductRepository, ProductEntity } from "../../domain/products/product.types";

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
    findById: vi.fn(async (id: string) => (id === "product-1" ? mockProduct : null)),
    findManyByIds: vi.fn(async () => [mockProduct]),
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

describe("DeleteProductUseCase", () => {
  let mockRepo: IProductRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
  });

  it("deletes product successfully", async () => {
    const useCase = new DeleteProductUseCase(mockRepo);
    await useCase.execute("product-1");

    expect(mockRepo.findById).toHaveBeenCalledWith("product-1");
    expect(mockRepo.delete).toHaveBeenCalledWith("product-1");
    expect(mockRepo.delete).toHaveBeenCalledTimes(1);
  });

  it("throws NotFoundException when product not found", async () => {
    const useCase = new DeleteProductUseCase(mockRepo);

    await expect(useCase.execute("non-existent-id")).rejects.toThrow(
      NotFoundException,
    );
    await expect(useCase.execute("non-existent-id")).rejects.toThrow(
      "Product not found",
    );
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it("throws conflict when product has related order items", async () => {
    vi.mocked(mockRepo.countOrderItemsByProductId).mockResolvedValue(2);

    const useCase = new DeleteProductUseCase(mockRepo);

    await expect(useCase.execute("product-1")).rejects.toThrow(ConflictException);
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });
});
