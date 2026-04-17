import { describe, expect, it, vi, beforeEach } from "vitest";
import { UpdateProductUseCase } from "./update-product.use-case";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { IProductRepository, ProductEntity } from "../../domain/products/product.types";

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

  const updatedProduct: ProductEntity = {
    ...mockProduct,
    name: "Updated Product",
    price: "149.99",
    updatedAt: "2026-04-06T12:00:00.000Z",
  };

  return {
    create: vi.fn(async () => mockProduct),
    findById: vi.fn(async (id: string) => (id === "product-1" ? mockProduct : null)),
    findOwnedById: vi.fn(async (id: string) => (id === "product-1" ? mockProduct : null)),
    findManyByIds: vi.fn(async () => [mockProduct]),
    list: vi.fn(async () => ({
      data: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    })),
    update: vi.fn(async () => updatedProduct),
    delete: vi.fn(async () => undefined),
    countOrderItemsByProductId: vi.fn(async () => 0),
  };
}

describe("UpdateProductUseCase", () => {
  let mockRepo: IProductRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
  });

  it("updates product successfully", async () => {
    const useCase = new UpdateProductUseCase(mockRepo);
    const result = await useCase.execute("product-1", {
      name: "Updated Product",
      price: "149.99",
    }, ACTOR);

    expect(result.name).toBe("Updated Product");
    expect(result.price).toBe("149.99");
    expect(mockRepo.findOwnedById).toHaveBeenCalledWith("product-1", ACTOR.actorUserId);
    expect(mockRepo.update).toHaveBeenCalledWith("product-1", {
      name: "Updated Product",
      price: "149.99",
    });
  });

  it("throws NotFoundException when product not found", async () => {
    const useCase = new UpdateProductUseCase(mockRepo);

    await expect(
      useCase.execute("non-existent-id", { name: "Updated" }, ACTOR),
    ).rejects.toThrow(NotFoundException);
    await expect(
      useCase.execute("non-existent-id", { name: "Updated" }, ACTOR),
    ).rejects.toThrow("Product not found");
  });

  it("can update multiple fields at once", async () => {
    const useCase = new UpdateProductUseCase(mockRepo);
    await useCase.execute("product-1", {
      name: "New Name",
      category: "New Category",
      price: "199.99",
      stock: 200,
      isActive: false,
    }, ACTOR);

    expect(mockRepo.update).toHaveBeenCalledWith("product-1", {
      name: "New Name",
      category: "New Category",
      price: "199.99",
      stock: 200,
      isActive: false,
    });
  });

  it("throws forbidden when manager tries to edit another user's product", async () => {
    vi.mocked(mockRepo.findOwnedById).mockResolvedValue(null);

    const useCase = new UpdateProductUseCase(mockRepo);

    await expect(
      useCase.execute("product-1", { name: "Blocked" }, ACTOR),
    ).rejects.toThrow(ForbiddenException);
  });
});
