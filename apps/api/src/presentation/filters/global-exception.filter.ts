import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiEnv } from "@repo/config";
import { ApiError } from "../../domain/exceptions/api-error";
import { AppException } from "../../domain/exceptions/app-exception";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeHttpExceptionMessage(response: unknown, fallback: string): string {
  if (typeof response === "string") {
    return response;
  }

  if (isRecord(response)) {
    const messageValue = response.message;
    if (typeof messageValue === "string") {
      return messageValue;
    }

    if (Array.isArray(messageValue) && messageValue.length > 0) {
      const firstMessage = messageValue[0];
      if (typeof firstMessage === "string") {
        return firstMessage;
      }
    }
  }

  return fallback;
}

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  public constructor(private readonly configService: ConfigService<ApiEnv, true>) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse<{
      status(code: number): { json(payload: ApiError): void };
    }>();
    const request = httpContext.getRequest<{ url: string }>();
    const path = request.url;
    const nodeEnv = this.configService.get("NODE_ENV", { infer: true });

    const appError = this.normalizeException(exception, path);
    const stack = exception instanceof Error ? exception.stack : undefined;
    const logPayload =
      nodeEnv === "production"
        ? `${appError.code} ${appError.message} path=${path}`
        : `${appError.code} ${appError.message} path=${path} payload=${JSON.stringify(appError)}`;

    this.logger.error(logPayload, stack);
    response.status(appError.statusCode).json(appError);
  }

  private normalizeException(exception: unknown, path: string): ApiError {
    if (exception instanceof AppException) {
      return {
        statusCode: exception.statusCode,
        code: exception.code,
        message: exception.message,
        timestamp: new Date().toISOString(),
        path,
      };
    }

    if (exception instanceof HttpException) {
      const responseBody = exception.getResponse();
      const statusCode = exception.getStatus();
      const code =
        isRecord(responseBody) && typeof responseBody.code === "string"
          ? responseBody.code
          : "HTTP_EXCEPTION";
      const message = normalizeHttpExceptionMessage(responseBody, exception.message);

      return {
        statusCode,
        code,
        message,
        timestamp: new Date().toISOString(),
        path,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
