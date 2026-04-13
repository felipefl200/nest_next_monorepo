import { loadEnv } from "@repo/config";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { ApiEnv } from "@repo/config";
import { AppModule } from "./app.module";

loadEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService<ApiEnv, true>>(ConfigService);
  const port = configService.get("PORT", { infer: true });

  await app.listen(port);
}
void bootstrap();
