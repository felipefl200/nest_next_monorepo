import { IHashProvider } from "../../domain/auth/ihash-provider";
import argon2 from "argon2";

export type Argon2idHashProviderOptions = {
  timeCost?: number;
  memoryCost?: number;
  parallelism?: number;
  hashLength?: number;
};

const DEFAULT_HASH_OPTIONS = {
  timeCost: 2,
  memoryCost: 19_456,
  parallelism: 1,
  hashLength: 32,
} satisfies Required<Argon2idHashProviderOptions>;

export class Argon2idHashProvider implements IHashProvider {
  private readonly options: Required<Argon2idHashProviderOptions>;

  public constructor(options?: Argon2idHashProviderOptions) {
    this.options = {
      ...DEFAULT_HASH_OPTIONS,
      ...options,
    };
  }

  public async hash(value: string): Promise<string> {
    return argon2.hash(value, {
      type: argon2.argon2id,
      timeCost: this.options.timeCost,
      memoryCost: this.options.memoryCost,
      parallelism: this.options.parallelism,
      hashLength: this.options.hashLength,
    });
  }

  public async compare(value: string, hashedValue: string): Promise<boolean> {
    return argon2.verify(hashedValue, value);
  }
}
