import { AppException } from "./app-exception";

export class ForbiddenException extends AppException {
  public constructor(code = "FORBIDDEN", message = "Forbidden") {
    super(code, message, 403);
    this.name = "ForbiddenException";
  }
}
