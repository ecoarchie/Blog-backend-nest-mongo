import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';
import { ILeanUser } from '../users/user-schema';

dotenv.config();

@Injectable()
export class EmailService {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'app.cronosport@gmail.com',
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  async sendEmailConfirmationMessage(user: ILeanUser) {
    const info = await this.transporter.sendMail({
      from: 'BlogPost <app.cronosport.gmail.com>',
      to: user.email,
      subject: 'Email confirmation',
      html: `<h1>Thank for your registration</h1><p>To finish registration please follow the link below: <a href='https://somesite.com/confirm-email?code=${user.emailConfirmation.confirmationCode}'>complete registration</a> </p>`,
    });
  }

  async sendPasswordRecoveryMessage(user: ILeanUser) {
    const info = await this.transporter.sendMail({
      from: 'BlogPost <app.cronosport.gmail.com>',
      to: user.email,
      subject: 'Password Recovery',
      html: `<h1>Password recovery</h1>
       <p>To finish password recovery please follow the link below:
          <a href='https://somesite.com/password-recovery?recoveryCode=${user.passwordRecovery.recoveryCode}'>recovery password</a>
      </p>`,
    });
  }
}
