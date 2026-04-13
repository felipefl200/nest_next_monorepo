import { AppException } from "./app-exception";

export class ConflictException extends AppException {
  public constructor(code = "CONFLICT", message = "Conflict") {
    super(code, message, 409);
    this.name = "ConflictException";
  }
}
