import { CheckoutModule } from './checkout/checkout.module';
import { Module } from '@nestjs/common';
import { CatalogModule } from './catalog/catalog.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, CatalogModule, CheckoutModule],
})
export class AppModule {}
