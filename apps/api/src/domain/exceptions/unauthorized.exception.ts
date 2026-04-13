import { AppException } from "./app-exception";

export class UnauthorizedException extends AppException {
  public constructor(code = "UNAUTHORIZED", message = "Unauthorized") {
    super(code, message, 401);
    this.name = "UnauthorizedException";
  }
}
