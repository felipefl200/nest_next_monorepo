import { describe, expect, it, vi, beforeEach } from "vitest";
import { ListProductsUseCase } from "./list-products.use-case";
import type {
  IProductRepository,
  ListProductsQuery,
  ProductEntity,
  PaginatedResult,
} from "../../domain/products/product.types";

function createMockRepository(): IProductRepository {
  const mockProducts: ProductEntity[] = [
    {
      id: "product-1",
      name: "Product 1",
      description: "Description 1",
      category: "Electronics",
      price: "99.99",
      stock: 100,
      isActive: true,
      createdAt: "2026-04-06T10:00:00.000Z",
      updatedAt: "2026-04-06T10:00:00.000Z",
    },
    {
      id: "product-2",
      name: "Product 2",
      description: "Description 2",
      category: "Books",
      price: "29.99",
      stock: 50,
      isActive: true,
      createdAt: "2026-04-06T11:00:00.000Z",
      updatedAt: "2026-04-06T11:00:00.000Z",
    },
  ];

  const mockResult: PaginatedResult<ProductEntity> = {
    data: mockProducts,
    total: 2,
    page: 1,
    perPage: 20,
    totalPages: 1,
  };

  const firstProduct = mockProducts[0]!;
  const mockCreate = vi.fn(async (_input): Promise<ProductEntity> => firstProduct);
  const mockUpdate = vi.fn(async (_id: string, _input): Promise<ProductEntity> => firstProduct);

  return {
    create: mockCreate,
    findById: vi.fn(async () => null),
    findManyByIds: vi.fn(async () => mockProducts),
    list: vi.fn(async () => mockResult),
    update: mockUpdate,
    delete: vi.fn(async () => undefined),
    countOrderItemsByProductId: vi.fn(async () => 0),
  };
}

describe("ListProductsUseCase", () => {
  let mockRepo: IProductRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
  });

  it("returns paginated products", async () => {
    const query: ListProductsQuery = {
      page: 1,
      perPage: 20,
    };

    const useCase = new ListProductsUseCase(mockRepo);
    const result = await useCase.execute(query);

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
    expect(result.totalPages).toBe(1);
    expect(mockRepo.list).toHaveBeenCalledWith(query);
  });

  it("filters products by category", async () => {
    const query: ListProductsQuery = {
      page: 1,
      perPage: 10,
      category: "Electronics",
    };

    const useCase = new ListProductsUseCase(mockRepo);
    await useCase.execute(query);

    expect(mockRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Electronics",
      }),
    );
  });

  it("filters products by isActive status", async () => {
    const query: ListProductsQuery = {
      page: 1,
      perPage: 10,
      isActive: true,
    };

    const useCase = new ListProductsUseCase(mockRepo);
    await useCase.execute(query);

    expect(mockRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
      }),
    );
  });

  it("returns empty result when no products exist", async () => {
    const emptyRepo: IProductRepository = {
      create: vi.fn(async () => {
        throw new Error("Not implemented");
      }),
      findById: vi.fn(async () => null),
      findManyByIds: vi.fn(async () => []),
      list: vi.fn(async () => ({
        data: [],
        total: 0,
        page: 1,
        perPage: 20,
        totalPages: 0,
      })),
      update: vi.fn(async () => {
        throw new Error("Not implemented");
      }),
      delete: vi.fn(async () => undefined),
      countOrderItemsByProductId: vi.fn(async () => 0),
    };

    const useCase = new ListProductsUseCase(emptyRepo);
    const result = await useCase.execute({ page: 1, perPage: 20 });

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});
