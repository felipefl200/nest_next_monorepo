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
import { GetOwnAccountProfileUseCase } from './application/auth/get-own-account-profile.use-case';
import { UpdateOwnProfileUseCase } from './application/auth/update-own-profile.use-case';
import { ChangeOwnPasswordUseCase } from './application/auth/change-own-password.use-case';
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
    GetOwnAccountProfileUseCase,
    UpdateOwnProfileUseCase,
    ChangeOwnPasswordUseCase,
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
        return new Rs256JwtProvider({
          privateKey: configService.getOrThrow('JWT_PRIVATE_KEY'),
          publicKey: configService.getOrThrow('JWT_PUBLIC_KEY'),
          issuer: configService.getOrThrow('JWT_ISSUER'),
          audience: configService.getOrThrow('JWT_AUDIENCE'),
          accessTokenExpiresIn: configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRES_IN'),
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
