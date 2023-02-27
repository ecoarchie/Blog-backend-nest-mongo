import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from 'src/users/sessions/session.schema';
import { SessionRepository } from 'src/users/sessions/sessions.repository';
import { UserModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Session.name,
        schema: SessionSchema,
      },
    ]),
    UserModule,
  ],
  exports: [AuthService],
  controllers: [AuthController],
  providers: [AuthService, SessionRepository],
})
export class AuthModule {}
