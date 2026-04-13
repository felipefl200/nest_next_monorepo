import { Reflector } from '@nestjs/core';
import { loadEnv, parseApiEnv } from '@repo/config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ApiEnv } from '@repo/config';

loadEnv();
import { ADMIN_USER_REPOSITORY, AUTH_SESSION_REPOSITORY, CUSTOMER_REPOSITORY, DASHBOARD_REPOSITORY, ORDER_REPOSITORY, PRODUCT_REPOSITORY, SETTING_REPOSITORY, HASH_PROVIDER, JWT_PROVIDER, RATE_LIMIT_STORE } from './domain/tokens';
import { Argon2idHashProvider } from './infrastructure/hash/argon2id-hash.provider';
import { Rs256JwtProvider } from './infrastructure/jwt/rs256-jwt.provider';
import { GlobalExceptionFilter } from './presentation/filters/global-exception.filter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './infrastructure/database/prisma.service';
import { PrismaRateLimitStore } from './infrastructure/rate-limit/prisma-rate-limit.store';
import { PrismaAuthSessionRepository } from './infrastructure/auth/prisma-auth-session.repository';
import { PrismaDashboardRepository } from './infrastructure/dashboard/prisma-dashboard.repository';
import { PrismaOrderRepository } from './infrastructure/orders/prisma-order.repository';
import { PrismaProductRepository } from './infrastructure/products/prisma-product.repository';
import { PrismaCustomerRepository } from './infrastructure/customers/prisma-customer.repository';
import { PrismaSettingRepository } from './infrastructure/settings/prisma-setting.repository';
import { PrismaAdminUserRepository } from './infrastructure/admin-users/prisma-admin-user.repository';
import { LoginUseCase } from './application/auth/login.use-case';
import { RefreshSessionUseCase } from './application/auth/refresh-session.use-case';
import { LogoutUseCase } from './application/auth/logout.use-case';
import { LogoutAllUseCase } from './application/auth/logout-all.use-case';
import { GetCurrentUserProfileUseCase } from './application/auth/get-current-user-profile.use-case';
import { GetDashboardOverviewUseCase } from './application/dashboard/get-dashboard-overview.use-case';
import { CreateOrderUseCase } from './application/orders/create-order.use-case';
import { GetOrderUseCase } from './application/orders/get-order.use-case';
import { ListOrdersUseCase } from './application/orders/list-orders.use-case';
import { UpdateOrderUseCase } from './application/orders/update-order.use-case';
import { DeleteOrderUseCase } from './application/orders/delete-order.use-case';
import { CreateProductUseCase } from './application/products/create-product.use-case';
import { GetProductUseCase } from './application/products/get-product.use-case';
import { ListProductsUseCase } from './application/products/list-products.use-case';
import { UpdateProductUseCase } from './application/products/update-product.use-case';
import { DeleteProductUseCase } from './application/products/delete-product.use-case';
import { CreateCustomerUseCase } from './application/customers/create-customer.use-case';
import { GetCustomerUseCase } from './application/customers/get-customer.use-case';
import { ListCustomersUseCase } from './application/customers/list-customers.use-case';
import { UpdateCustomerUseCase } from './application/customers/update-customer.use-case';
import { DeleteCustomerUseCase } from './application/customers/delete-customer.use-case';
import { ListSettingsUseCase } from './application/settings/list-settings.use-case';
import { UpsertSettingUseCase } from './application/settings/upsert-setting.use-case';
import { CreateManagedUserUseCase } from './application/admin-users/create-managed-user.use-case';
import { ListManagedUsersUseCase } from './application/admin-users/list-managed-users.use-case';
import { UpdateManagedUserUseCase } from './application/admin-users/update-managed-user.use-case';
import { DeactivateManagedUserUseCase } from './application/admin-users/deactivate-managed-user.use-case';
import { AuthController } from './presentation/auth/auth.controller';
import { DashboardController } from './presentation/dashboard/dashboard.controller';
import { OrdersController } from './presentation/orders/orders.controller';
import { ProductsController } from './presentation/products/products.controller';
import { CustomersController } from './presentation/customers/customers.controller';
import { SettingsController } from './presentation/settings/settings.controller';
import { AdminUsersController } from './presentation/admin-users/admin-users.controller';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RoleGuard } from './presentation/guards/role.guard';

const DEV_FALLBACK_PRIVATE_KEY =
  "-----BEGIN PRIVATE KEY-----\n" +
  "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDWi8SEO8G8iiX5\n" +
  "WaOerYBYMOiERix8ofGR5UmP30kMUdXpZkYeBuY8ihNXd9F9g1phIsuVbzH/qJ+z\n" +
  "s1FUI4FLS5GlqRJUOBTxC+Gamz054RLcwTWYHmTOImVW7xY6f6JeHmY7K8erdqyS\n" +
  "Jt3eHFQm7m/P5o6L0QHewI+2ComDl+oym7YpdBgyrh35aud7x0QP4FBbjQaDl9LL\n" +
  "QNLHdgjZBLS5qfND/z607MxUevkU8LkN2d+AHN5Del6Ws7eS3+3qUNRuxKDkDPGQ\n" +
  "LPIWuvlJ4XQI2Q8dy4ElIjpOoiSiym1sGpA7KLSRfBShjLXe8+nrk8JKeosyC/KQ\n" +
  "hA0UkZc9AgMBAAECggEAAhnesVXSz77ItgesSI7yXPVnNmrZn4OdfLUymZZYZTT2\n" +
  "g8waMS951XYbs4yO0GU3DXROQF4G/RJu+4DXeOopivUIIxXgev3T8R5DXPoMfmuj\n" +
  "4QKCYFOTpmzOaxc5XkEDV80eIjyZmvR1GFqJlk66b7CcePxF5NHpQXjHdNh1Sz29\n" +
  "G+EHDfG7SFvxHN6RH3TrxPomeIlluiDrDCc+5p8526CJvwD4iyHBriXCa5M6QTVo\n" +
  "t6zHpFXbKMG8cTRkFdZuGUTeb1CupKzVFF9iQ2+kWoHDMEwfOzKjbIsGT+U/EYG7\n" +
  "r4kd5S7IyKaCY4j6XJiZy/i3a5E3BiRfyxYTjvEr6QKBgQDwlP2xPG2lADs/ujdw\n" +
  "Ef4zj5bcWYeWS9ZaYhozmjYDAX1zYp97pU/n17kz0zMAXNRl3c+kop+93KNo/BCY\n" +
  "0WgxKqx7iWxzy28VOc7CXODxSIT8DXUfglZPSfZV2zwDxSbJn0VM5Hv1woDq88YU\n" +
  "n2sytu4HrrNwjkXcEawNdh/OlQKBgQDkS6CYGYeYShpwobIcvMRgSJCsS+jyUXKI\n" +
  "oupCYV/f1IMElWOp03XgZz9QODS6LTym9lCjTV+5CX1G+divtf5zCycspaezpsI7\n" +
  "5ZyciRUo4uaW9aYjRFVhVqecxhkJwIA1D4NJ46Cl/ldjDgNjfiZyZKEB/l4nDQGq\n" +
  "+GAOjBUECQKBgQDpCck79ybWH4VE06KDokozs7EUPH0D7u3xmvl6ZrRO8RCNxkhp\n" +
  "wtXF48Z4FupePY1YJyXNeeF2TdTUCuYgwSdGCOoOuC0fdT1iuB45UzJpRi/a30ZG\n" +
  "gUANib1dqQFXPY+22dqNAv24LvIlpICI1WtHMr8bHfSe4JF2/H9GgteIiQKBgH4D\n" +
  "nMa4ONd/9+454sXoEIGRLIJeeFvhR1ZSjvpLI4+6jwNlrpicR5GxjAosrDYkKDmE\n" +
  "9ufdGrxZl5Qo70m2LJi2DE6htdr9bnN/f54MMOjbriqft6/51SMgoO5xjnqKjno7\n" +
  "cN3FTvSxWu0rXAV8KZ61GwatsKzfig8kgGknO6Z5AoGBAJ/cfAH1+JmqdQpGzwAG\n" +
  "QUs/9FZArF0LSbaYZfgXQjYjR6kN25f+ubL+qYFJTnc8Dl9QNxMbcDJbdfRaW3lT\n" +
  "QGLB5rBIrsJDpbjeudBip/5R3rjuSV0gOa+f6Ud2ZI49EyL1nA7HhhjwEiu5+v2c\n" +
  "hxkvmosdnTwKW/h/BKs7SxG+\n" +
  "-----END PRIVATE KEY-----";

const DEV_FALLBACK_PUBLIC_KEY =
  "-----BEGIN PUBLIC KEY-----\n" +
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1ovEhDvBvIol+Vmjnq2A\n" +
  "WDDohEYsfKHxkeVJj99JDFHV6WZGHgbmPIoTV3fRfYNaYSLLlW8x/6ifs7NRVCOB\n" +
  "S0uRpakSVDgU8Qvhmps9OeES3ME1mB5kziJlVu8WOn+iXh5mOyvHq3askibd3hxU\n" +
  "Ju5vz+aOi9EB3sCPtgqJg5fqMpu2KXQYMq4d+Wrne8dED+BQW40Gg5fSy0DSx3YI\n" +
  "2QS0uanzQ/8+tOzMVHr5FPC5DdnfgBzeQ3pelrO3kt/t6lDUbsSg5AzxkCzyFrr5\n" +
  "SeF0CNkPHcuBJSI6TqIkosptbBqQOyi0kXwUoYy13vPp65PCSnqLMgvykIQNFJGX\n" +
  "PQIDAQAB\n" +
  "-----END PUBLIC KEY-----";

function resolveJwtKeys(privateKey: string, publicKey: string): { privateKey: string; publicKey: string } {
  const isPlaceholder =
    privateKey.includes("YOUR_PRIVATE_KEY") || publicKey.includes("YOUR_PUBLIC_KEY");

  if (isPlaceholder && process.env.NODE_ENV !== "production") {
    return {
      privateKey: DEV_FALLBACK_PRIVATE_KEY,
      publicKey: DEV_FALLBACK_PUBLIC_KEY,
    };
  }

  return { privateKey, publicKey };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => parseApiEnv(env),
    }),
  ],
  controllers: [AppController, AuthController, DashboardController, OrdersController, ProductsController, CustomersController, SettingsController, AdminUsersController],
  providers: [
    Reflector,
    AppService,
    PrismaService,
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    LogoutAllUseCase,
    GetCurrentUserProfileUseCase,
    GetDashboardOverviewUseCase,
    CreateOrderUseCase,
    GetOrderUseCase,
    ListOrdersUseCase,
    UpdateOrderUseCase,
    DeleteOrderUseCase,
    CreateProductUseCase,
    GetProductUseCase,
    ListProductsUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    CreateCustomerUseCase,
    GetCustomerUseCase,
    ListCustomersUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
    ListSettingsUseCase,
    UpsertSettingUseCase,
    CreateManagedUserUseCase,
    ListManagedUsersUseCase,
    UpdateManagedUserUseCase,
    DeactivateManagedUserUseCase,
    RoleGuard,
    {
      provide: JWT_PROVIDER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ApiEnv, true>) => {
        const keys = resolveJwtKeys(
          configService.get('JWT_PRIVATE_KEY', { infer: true }),
          configService.get('JWT_PUBLIC_KEY', { infer: true }),
        );

        return new Rs256JwtProvider({
          privateKey: keys.privateKey,
          publicKey: keys.publicKey,
          issuer: configService.get('JWT_ISSUER', { infer: true }),
          audience: configService.get('JWT_AUDIENCE', { infer: true }),
          accessTokenExpiresIn: configService.get('JWT_ACCESS_TOKEN_EXPIRES_IN', { infer: true }),
        });
      },
    },
    {
      provide: HASH_PROVIDER,
      useFactory: () => new Argon2idHashProvider(),
    },
    {
      provide: RATE_LIMIT_STORE,
      inject: [PrismaService],
      useFactory: (prismaService: PrismaService) => new PrismaRateLimitStore(prismaService),
    },
    {
      provide: AUTH_SESSION_REPOSITORY,
      useClass: PrismaAuthSessionRepository,
    },
    {
      provide: DASHBOARD_REPOSITORY,
      useClass: PrismaDashboardRepository,
    },
    {
      provide: ORDER_REPOSITORY,
      useClass: PrismaOrderRepository,
    },
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: PrismaCustomerRepository,
    },
    {
      provide: SETTING_REPOSITORY,
      useClass: PrismaSettingRepository,
    },
    {
      provide: ADMIN_USER_REPOSITORY,
      useClass: PrismaAdminUserRepository,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
