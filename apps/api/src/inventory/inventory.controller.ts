import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard, type AuthRequest } from '../auth/auth.guard';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class AvailabilityController {
  constructor(private readonly inventory: InventoryService) {}
  @Post('availability') availability(@Body() body: unknown) { return this.inventory.availability(body); }
}

@Controller('inventory')
@UseGuards(AuthGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}
  @Get('ingredients') ingredients(@Req() req: AuthRequest) { return this.inventory.ingredients(req.user); }
  @Get('movements') movements(@Req() req: AuthRequest) { return this.inventory.movements(req.user); }
  @Post('ingredients/:id/movements') move(@Req() req: AuthRequest, @Param('id') id: string, @Body() body: unknown) { return this.inventory.move(req.user, id, body); }
  @Get('recipes') recipes(@Req() req: AuthRequest) { return this.inventory.recipes(req.user); }
  @Put('recipes') save(@Req() req: AuthRequest, @Body() body: unknown) { return this.inventory.saveRecipe(req.user, body); }
}
