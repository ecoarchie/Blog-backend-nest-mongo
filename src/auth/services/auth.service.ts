import jwt from 'jsonwebtoken';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
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

  async validateUserBearer(authorization: string): Promise<boolean> {
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const token = authorization.split(' ')[1];

    const userId = this.getUserIdByToken(token);
    // const result = userId
    //   ? await userSessionCollection.findOne({ userId: new ObjectId(userId) })
    //   : null;
    // if (!result) throw new UnauthorizedException();

    if (!userId) {
      throw new UnauthorizedException();
    }
    // request.user = await usersService.findUserByIdService(userId);
    return true;
  }

  async createJwt(userId: string) {
    const token = jwt.sign({ userId }, process.env.SECRET, {
      expiresIn: '2h',
    });
    return token;
  }

  async createJwtRefresh(
    userId: string,
    lastActiveDate: string,
    deviceId: string,
  ) {
    const token = jwt.sign(
      { userId, lastActiveDate, deviceId },
      process.env.SECRET,
      {
        expiresIn: '4h',
      },
    );
    return token;
  }

  async getUserIdByToken(token: string): Promise<string | null> {
    try {
      const result: any = jwt.verify(token, process.env.SECRET);
      return result.userId;
    } catch (error) {
      return null;
    }
  }

  //   async verifyToken(token: string): Promise<UserSessionModel | null> {
  //     try {
  //       const result: any = jwt.verify(token, process.env.SECRET);
  //       if (result.exp < Date.now() / 1000) {
  //         return null;
  //       }
  //       const checkToken = await userSessionCollection.findOne({
  //         $and: [
  //           { lastActiveDate: result.lastActiveDate },
  //           { deviceId: result.deviceId },
  //           { userId: new ObjectId(result.userId) },
  //         ],
  //       });
  //       return checkToken;
  //     } catch (error) {
  //       console.log(error);
  //       return null;
  //     }
  //   }
}
