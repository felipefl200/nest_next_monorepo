export class AppException extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  public constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = "AppException";
    this.code = code;
    this.statusCode = statusCode;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
