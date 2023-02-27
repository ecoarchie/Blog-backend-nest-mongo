import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { NewPasswordDto } from 'src/auth/auth.schema';
import { AuthService } from 'src/auth/auth.service';
import { EmailService } from 'src/utils/email.service';
import { v4 as uuidv4 } from 'uuid';
import { UsersQueryRepository } from './repositories/users.query-repository';
import { UsersRepository } from './repositories/users.repository';
import { CreateUserDto, UserDocument } from './user-schema';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) {}

  async createNewUser(dto: CreateUserDto): Promise<UserDocument['id'] | null> {
    return await this.usersRepository.createUser(dto);
  }

  async loginUser(loginOrEmail: string, password: string) {
    const user = await this.usersRepository.findUserByLoginOrEmail(
      loginOrEmail,
      loginOrEmail,
    );
    if (!user) return null;
    const userId = await user.checkCredentials(password);
    if (userId) {
      const deviceId = uuidv4();
      return {
        accessToken: await this.authService.createJwtAccessToken(userId),
        refreshToken: await this.authService.createJwtRefresh(userId, deviceId),
      };
    }
    return null;
  }

  async createNewSession(
    refreshToken: string,
    ip: string,
    browserTitle: string,
  ) {
    const tokenData: any = jwt.verify(refreshToken, process.env.SECRET);
    const tokenExpireDate = tokenData.exp;
    const tokenIssuedDate = tokenData.iat;
    const { deviceId, userId } = tokenData;
    return this.usersRepository.createNewSession({
      ip,
      browserTitle,
      deviceId,
      lastActiveDate: new Date(tokenIssuedDate * 1000),
      tokenExpireDate: new Date(tokenExpireDate * 1000),
      userId,
    });
  }

  async sendEmailConfirmation(userId: string) {
    const user = await this.usersRepository.findUserById(userId);
    const leanUser = user.toLeanUserDocument();
    try {
      await this.emailService.sendEmailConfirmationMessage(leanUser);
    } catch (error) {
      console.log('Could not send email');
      console.log(error);
      return;
    }
  }

  async confirmEmail(code: string): Promise<boolean> {
    const user = await this.usersRepository.findUserByConfirmCode(code);
    if (
      !user ||
      user.emailConfirmation.confirmationCode !== code ||
      user.emailConfirmation.expirationDate < new Date() ||
      user.emailConfirmation.isConfirmed
    ) {
      return false;
    }
    user.setEmailIsConfirmedToTrue();
    await this.usersRepository.saveUser(user);
    return true;
  }

  async resendRegistrationEmail(email: string) {
    const user = await this.usersRepository.findUserByEmail(email);
    if (user && !user.emailConfirmation.isConfirmed) {
      const newConfirmationCode = uuidv4();
      user.updateConfirmationCode(newConfirmationCode);
      await this.usersRepository.saveUser(user);

      await this.emailService.sendEmailConfirmationMessage(
        user.toLeanUserDocument(),
      );
    } else {
      throw new BadRequestException({
        message: `Email is already confirmed or doesn't exist`,
        field: 'email',
      });
    }
  }

  async refreshTokens(
    refreshToken: string,
    ip: string,
    browserTitle: string,
  ): Promise<{ newAccessToken: string; newRefreshToken: string }> {
    const validSession = await this.authService.verifyToken(refreshToken);
    if (!validSession) throw new UnauthorizedException();

    const newAccessToken = await this.authService.createJwtAccessToken(
      validSession.userId,
    );
    const newRefreshToken = await this.authService.createJwtRefresh(
      validSession.userId,
      validSession.deviceId,
    );
    const tokenData: any = jwt.verify(newRefreshToken, process.env.SECRET);
    await validSession.refresh(ip, browserTitle, tokenData.iat, tokenData.exp);
    await this.usersRepository.saveSession(validSession);
    return { newAccessToken, newRefreshToken };
  }

  async logoutUser(refreshToken: string) {
    const validSession = await this.authService.verifyToken(refreshToken);
    console.log(validSession);
    if (!validSession) throw new UnauthorizedException();

    await this.usersRepository.deleteSession(validSession.id);
  }

  async recoverPassword(email: string) {
    const registeredUser = await this.usersRepository.findUserByEmail(email);
    if (!registeredUser) return;

    registeredUser.setNewPasswordRecoveryCode();
    await this.usersRepository.saveUser(registeredUser);
    await this.emailService.sendPasswordRecoveryMessage(
      registeredUser.toLeanUserDocument(),
    );
  }

  private async checkRecoveryCode(user: UserDocument): Promise<boolean> {
    if (!user) {
      return false;
    }
    if (
      user.passwordRecovery.expirationDate < new Date() ||
      user.passwordRecovery.isUsed
    ) {
      return false;
    }
    return true;
  }

  async updateRecoveryCodeAndPassword(data: NewPasswordDto) {
    const user = await this.usersRepository.findUserByRecoveryCode(
      data.recoveryCode,
    );
    const isRecoveryCodeValid = await this.checkRecoveryCode(user);
    if (!isRecoveryCodeValid)
      throw new BadRequestException({
        message: 'Recovery code is not valid or already been used',
        field: 'recoveryCode',
      });

    await user.updatePasswordAndResetRecoveryCode(data.newPassword);
    await this.usersRepository.saveUser(user);
  }
}
