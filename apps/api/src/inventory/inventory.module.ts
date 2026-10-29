import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { AvailabilityController, InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({ controllers: [AvailabilityController, InventoryController], providers: [InventoryService, AuthGuard, AuthService], exports: [InventoryService] })
export class InventoryModule {}
