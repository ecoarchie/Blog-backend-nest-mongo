import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import { Session, SessionDocument } from 'src/users/sessions/session.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async validateUserBasic(authorization: string): Promise<boolean> {
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const [method, encoded] = authorization.split(' ');
    const decoded = Buffer.from(encoded, 'base64').toString('ascii');

    const [username, password]: Array<string> = decoded.split(':');
    if (
      method !== 'Basic' ||
      username !== 'admin' ||
      password !== process.env.ADMIN_PASS
    ) {
      throw new UnauthorizedException();
    }
    return true;
  }

  async validateUserBearer(authorization: string): Promise<string> {
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const token = authorization.split(' ')[1];

    const userId = await this.getUserIdFromAccessToken(token);
    // const sessionId = userId
    //   ? await this.sessionModel.findOne
    //   : null;
    // if (!result) throw new UnauthorizedException();

    if (!userId) {
      throw new UnauthorizedException();
    }
    // request.user = await usersService.findUserByIdService(userId);
    return userId;
  }

  async createJwtAccessToken(userId: string) {
    const token = jwt.sign({ userId }, process.env.SECRET, {
      expiresIn: '2h',
    });
    return token;
  }

  async createJwtRefresh(userId: string, deviceId: string) {
    const token = jwt.sign({ userId, deviceId }, process.env.SECRET, {
      expiresIn: '4h',
    });
    return token;
  }

  async getUserIdFromAccessToken(token: string): Promise<string | null> {
    try {
      const result: any = jwt.verify(token, process.env.SECRET);
      return result.userId;
    } catch (error) {
      return null;
    }
  }

  async getExpDateFromRefreshToken(refreshToken: string) {
    const tokenRes: any = jwt.verify(refreshToken, process.env.SECRET);
    return tokenRes.exp;
  }

  async verifyToken(token: string): Promise<SessionDocument | null> {
    try {
      const tokenData: any = jwt.verify(token, process.env.SECRET);
      if (tokenData.exp < Date.now() / 1000) {
        return null;
      }
      const session = await this.sessionModel
        .findOne()
        .and([
          { lastActiveDate: new Date(tokenData.iat * 1000) },
          { deviceId: tokenData.deviceId },
          { userId: tokenData.userId },
        ]);
      return session;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
