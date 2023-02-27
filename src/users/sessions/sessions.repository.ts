import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { Session, SessionDocument } from './session.schema';

@Injectable()
export class SessionRepository {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private readonly authService: AuthService,
  ) {}

  async getActiveSessions(refreshToken: string) {
    const validSession = await this.authService.verifyToken(refreshToken);
    if (!validSession) throw new UnauthorizedException();

    const userId = validSession.userId;
    const result = await this.sessionModel.find({
      userId,
    });
    if (!result) throw new UnauthorizedException();

    return result.map((session) => ({
      ip: session.ip,
      title: session.browserTitle,
      lastActiveDate: session.lastActiveDate,
      deviceId: session.deviceId,
    }));
  }

  async deleteRestSessions(refreshToken: string): Promise<boolean> {
    const validSession = await this.authService.verifyToken(refreshToken);
    if (!validSession) throw new UnauthorizedException();

    const userId = validSession.userId;
    const deviceId = validSession.deviceId;
    const result = await this.sessionModel.deleteMany({
      $and: [{ userId }, { deviceId: { $ne: deviceId } }],
    });

    return result.acknowledged;
  }

  async deleteDeviceSessions(
    refreshToken: string,
    deviceId: string,
  ): Promise<void> {
    const validSession = await this.authService.verifyToken(refreshToken);
    if (!validSession) throw new UnauthorizedException();

    const userId = validSession.userId;
    const foundDeviceSession = await this.sessionModel.findOne({ deviceId });
    if (!foundDeviceSession) {
      throw new NotFoundException();
    }
    if (foundDeviceSession.userId !== userId) {
      throw new ForbiddenException();
    } else {
      try {
        await this.sessionModel.deleteOne({ deviceId });
      } catch (error) {
        console.log(error);
        console.log('cannot delete device session');
        throw new BadRequestException();
      }
    }
  }
}
