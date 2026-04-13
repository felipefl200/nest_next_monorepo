import { AppException } from "./app-exception";

export class RateLimitException extends AppException {
  public constructor(code = "RATE_LIMIT_EXCEEDED", message = "Too many requests") {
    super(code, message, 429);
    this.name = "RateLimitException";
  }
}
