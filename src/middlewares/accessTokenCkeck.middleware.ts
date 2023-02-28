import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AccessTokenValidationMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization;
    if (!authorization) {
      req.user.id = null;
      return next();
    }
    const token = authorization.split(' ')[1];

    const userId = await this.authService.getUserIdFromAccessToken(token);

    req.user.id = userId;

    return next();
  }
}
