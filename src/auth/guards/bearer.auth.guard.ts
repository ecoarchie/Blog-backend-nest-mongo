import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(protected authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    const userId = await this.authService.validateUserBearer(authorization);
    request.userId = userId;
    if (userId) return true;
    else return false;
  }
}
