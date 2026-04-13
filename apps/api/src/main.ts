import helmet from "helmet";
import { loadEnv } from "@repo/config";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { ApiEnv } from "@repo/config";
import { AppModule } from "./app.module";
import { attachCorrelationId } from "./presentation/http/correlation-id.middleware";

loadEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService<ApiEnv, true>>(ConfigService);
  const port = configService.getOrThrow("PORT");
  const corsOrigin = configService.getOrThrow("APP_CORS_ORIGIN");

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
  });

  app.use(
    helmet({
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
        },
      },
    }),
  );

  app.use(attachCorrelationId);

  await app.listen(port);
}
void bootstrap();
