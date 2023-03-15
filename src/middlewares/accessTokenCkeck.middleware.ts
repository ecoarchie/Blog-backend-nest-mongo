import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { IUsersQueryRepository } from '../users/repositories/users.query-repository.interface';
// import { UsersQueryRepository } from '../users/repositories/users.query-repository';

@Injectable()
export class AccessTokenValidationMiddleware implements NestMiddleware {
  constructor(
    private readonly authService: AuthService,
    @Inject('UsersQueryRepository')
    protected usersQueryRepo: IUsersQueryRepository,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization;
    if (!authorization) {
      req.user = null;
      return next();
    }
    const token = authorization.split(' ')[1];

    const userId = await this.authService.getUserIdFromAccessToken(token);
    const userLogin = await this.usersQueryRepo.getUserLoginById(userId);

    req.user = {
      id: userId,
      login: userLogin,
    };

    return next();
  }
}
