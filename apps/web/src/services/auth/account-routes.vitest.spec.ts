import { beforeEach, describe, expect, it, vi } from "vitest";

const getRouteAccessToken = vi.fn();
const handleRouteError = vi.fn((error: unknown) => error);
const unauthorizedRouteResponse = vi.fn(() => new Response("unauthorized", { status: 401 }));
const getOwnAccountProfileWithApi = vi.fn();
const updateOwnAccountProfileWithApi = vi.fn();
const changeOwnPasswordWithApi = vi.fn();

vi.mock("@/src/services/shared/route-handler", () => ({
  getRouteAccessToken,
  handleRouteError,
  unauthorizedRouteResponse,
}));

vi.mock("@/src/services/auth/api", () => ({
  getOwnAccountProfileWithApi,
  updateOwnAccountProfileWithApi,
  changeOwnPasswordWithApi,
}));

describe("account route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/auth/account returns unauthorized when token is missing", async () => {
    getRouteAccessToken.mockResolvedValue(null);
    const route = await import("@/app/api/auth/account/route");

    const response = await route.GET();

    expect(response.status).toBe(401);
    expect(unauthorizedRouteResponse).toHaveBeenCalled();
  });

  it("PATCH /api/auth/account delegates to auth api", async () => {
    getRouteAccessToken.mockResolvedValue("access-token");
    updateOwnAccountProfileWithApi.mockResolvedValue({
      id: "user-1",
      name: "Updated",
      email: "updated@example.com",
      role: "MANAGER",
      isActive: true,
    });
    const route = await import("@/app/api/auth/account/route");

    const response = await route.PATCH(
      new Request("http://localhost/api/auth/account", {
        method: "PATCH",
        body: JSON.stringify({
          name: "Updated",
          email: "updated@example.com",
          currentPassword: "secret",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    expect(updateOwnAccountProfileWithApi).toHaveBeenCalledWith("access-token", {
      name: "Updated",
      email: "updated@example.com",
      currentPassword: "secret",
    });
  });

  it("POST /api/auth/account/change-password delegates to auth api", async () => {
    getRouteAccessToken.mockResolvedValue("access-token");
    changeOwnPasswordWithApi.mockResolvedValue({ success: true });
    const route = await import("@/app/api/auth/account/change-password/route");

    const response = await route.POST(
      new Request("http://localhost/api/auth/account/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "secret",
          newPassword: "new-password-123",
          confirmNewPassword: "new-password-123",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    expect(changeOwnPasswordWithApi).toHaveBeenCalledWith("access-token", {
      currentPassword: "secret",
      newPassword: "new-password-123",
      confirmNewPassword: "new-password-123",
    });
  });
});
