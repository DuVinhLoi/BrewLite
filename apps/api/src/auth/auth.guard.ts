import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthService, Identity } from './auth.service';
export type AuthRequest = Request & { user: Identity };
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    request.user = this.auth.authenticate(request.headers.authorization);
    return true;
  }
}