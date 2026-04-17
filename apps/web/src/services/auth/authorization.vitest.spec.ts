import { describe, expect, it } from "vitest";
import { canManageOwnedResource } from "./authorization";

describe("canManageOwnedResource", () => {
  it("returns true for admin regardless of owner", () => {
    expect(
      canManageOwnedResource(
        { id: "admin-1", name: "Admin", email: "admin@example.com", role: "ADMIN" },
        "user-2",
      ),
    ).toBe(true);
  });

  it("returns true when manager owns the resource", () => {
    expect(
      canManageOwnedResource(
        { id: "user-1", name: "User", email: "user@example.com", role: "MANAGER" },
        "user-1",
      ),
    ).toBe(true);
  });

  it("returns false when manager does not own the resource", () => {
    expect(
      canManageOwnedResource(
        { id: "user-1", name: "User", email: "user@example.com", role: "MANAGER" },
        "user-2",
      ),
    ).toBe(false);
  });
});
