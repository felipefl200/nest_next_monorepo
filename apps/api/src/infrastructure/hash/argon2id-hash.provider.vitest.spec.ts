import { describe, expect, it } from "vitest";
import { Argon2idHashProvider } from "./argon2id-hash.provider";

describe("Argon2idHashProvider", () => {
  it("creates a non-plaintext hash", async () => {
    const provider = new Argon2idHashProvider();
    const plainValue = "MyStrongPassword@123";

    const hash = await provider.hash(plainValue);
    expect(hash).not.toBe(plainValue);
    expect(hash).toContain("$argon2id$");
  });

  it("compares hash values correctly", async () => {
    const provider = new Argon2idHashProvider();
    const plainValue = "MyStrongPassword@123";
    const hash = await provider.hash(plainValue);

    await expect(provider.compare(plainValue, hash)).resolves.toBe(true);
    await expect(provider.compare("wrong-password", hash)).resolves.toBe(false);
  });
});
