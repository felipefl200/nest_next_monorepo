import { AppException } from "./app-exception";

export class NotFoundException extends AppException {
  public constructor(code = "NOT_FOUND", message = "Resource not found") {
    super(code, message, 404);
    this.name = "NotFoundException";
  }
}
