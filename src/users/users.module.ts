import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { EmailService } from 'src/utils/email.service';
import { UsersQueryRepository } from './repositories/users.query-repository';
import { UsersRepository } from './repositories/users.repository';
import { SessionController } from './sessions/session.controller';
import { Session, SessionSchema } from './sessions/session.schema';
import { SessionRepository } from './sessions/sessions.repository';
import { User, UserSchema } from './user-schema';
import { UserController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Session.name,
        schema: SessionSchema,
      },
    ]),
    forwardRef(() => AuthModule),
  ],
  exports: [
    UsersRepository,
    UsersQueryRepository,
    UsersService,
    SessionRepository,
  ],
  controllers: [UserController, SessionController],
  providers: [
    UsersQueryRepository,
    UsersRepository,
    UsersService,
    EmailService,
    SessionRepository,
  ],
})
export class UserModule {}
