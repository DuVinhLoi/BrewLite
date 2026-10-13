import { SetMetadata } from '@nestjs/common';
import { Role } from '../contracts/user.contract';

export const ROLES_KEY = 'roles';
// Gắn lên route cần vai trò; dùng cùng @UseGuards(JwtAuthGuard, RolesGuard) (JwtAuthGuard phải đứng trước để có req.user)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
