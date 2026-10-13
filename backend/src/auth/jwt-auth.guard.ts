import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { toRole } from '../contracts/user.contract';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string = req.headers?.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Unauthorized');
    try {
      const payload = await this.jwt.verifyAsync(token);
      // Token phát trước khi có role, hoặc role ngoài enum, coi là CUSTOMER
      req.user = { id: payload.sub, email: payload.email, role: toRole(payload.role) };
      return true;
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
