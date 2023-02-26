import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Ip,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { UsersQueryRepository } from 'src/users/repositories/users.query-repository';
import { CreateUserDto, EmailDto } from 'src/users/user-schema';
import { UsersService } from 'src/users/users.service';
import { AuthUserDto, NewPasswordDto } from './auth.schema';
import { BearerAuthGuard } from './guards/bearer.auth.guard';

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersQueryRepo: UsersQueryRepository,
  ) {}

  @Post('login')
  async loginUser(
    @Ip() ip: string,
    @Headers('user-agent') browserTitle: string,
    @Res() res: Response,
    @Body() authUserDto: AuthUserDto,
  ) {
    const result = await this.usersService.loginUser(
      authUserDto.loginOrEmail,
      authUserDto.password,
    );
    if (!result) return res.sendStatus(401);
    const { accessToken, refreshToken } = result;

    const newSessionId = await this.usersService.createNewSession(
      refreshToken,
      ip,
      browserTitle,
    );
    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    res.status(200).send({ accessToken });
  }

  @SkipThrottle()
  @UseGuards(BearerAuthGuard)
  @Get('me')
  async getCurrentUserInfo(@Req() req: Request) {
    const user = await this.usersQueryRepo.findUserById(req.userId);
    return {
      email: user.email,
      login: user.login,
      userId: req.userId,
    };
  }

  @HttpCode(204)
  @Post('registration')
  async registerUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersQueryRepo.findUserByLoginOrEmail(
      createUserDto.login,
      createUserDto.email,
    );
    if (user) {
      const errorField = user.login === createUserDto.login ? 'login' : 'email';
      throw new BadRequestException({
        message: `User with this ${errorField} is already registered`,
        field: `${errorField}`,
      });
    }
    const newUserId = await this.usersService.createNewUser(createUserDto);
    await this.usersService.sendEmailConfirmation(newUserId);
  }

  @HttpCode(204)
  @Post('registration-confirmation')
  async comfirmRegistration(@Body('code') confirmationCode: string) {
    const result = await this.usersService.confirmEmail(confirmationCode);
    if (!result) {
      throw new BadRequestException({
        message:
          'Confirmation code is incorrect, expired or already been applied',
        field: 'code',
      });
    }
  }

  @HttpCode(204)
  @Post('registration-email-resending')
  async resendRegistrationEmail(@Body() emailDto: EmailDto) {
    await this.usersService.resendRegistrationEmail(emailDto.email);
  }

  @SkipThrottle()
  @Post('refresh-token')
  async refreshTokens(
    @Ip() ip: string,
    @Headers('user-agent') browserTitle: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const result = await this.usersService.refreshTokens(
      refreshToken,
      ip,
      browserTitle,
    );
    const { newAccessToken, newRefreshToken } = result;
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
    });
    res.status(200).send({ accessToken: newAccessToken });
  }

  @SkipThrottle()
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    await this.usersService.logoutUser(refreshToken);
    res.sendStatus(204);
  }

  @HttpCode(204)
  @Post('password-recovery')
  async recoverPassword(@Body() emailDto: EmailDto) {
    const email = emailDto.email;
    await this.usersService.recoverPassword(email);
  }

  @HttpCode(204)
  @Post('new-password')
  async confirmNewPassword(@Body() newPasswordDto: NewPasswordDto) {
    await this.usersService.updateRecoveryCodeAndPassword(newPasswordDto);
  }
}
