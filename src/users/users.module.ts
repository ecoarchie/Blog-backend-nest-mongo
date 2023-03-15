import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { CommentsModule } from '../comments/comments.module';
import { PostsModule } from '../posts/posts.module';
import { EmailService } from '../utils/email.service';
import { UserController } from './controllers/users-sa.controller';
import {
  // UsersQueryRepository,
  UsersQueryRepositoryMongo,
} from './repositories/users.query-repository';
import { UsersRepository } from './repositories/users.repository';
import { SessionController } from './sessions/session.controller';
import { Session, SessionSchema } from './sessions/session.schema';
import { SessionRepository } from './sessions/sessions.repository';
import { User, UserSchema } from './user-schema';
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
    CommentsModule,
    PostsModule,
    forwardRef(() => AuthModule),
  ],
  exports: [
    UsersRepository,
    {
      provide: 'UsersQueryRepository',
      useClass: UsersQueryRepositoryMongo,
    },
    // UsersQueryRepositoryMongo,
    UsersService,
    SessionRepository,
  ],
  controllers: [UserController, SessionController],
  providers: [
    // UsersQueryRepository,
    {
      provide: 'UsersQueryRepository',
      useClass: UsersQueryRepositoryMongo,
    },
    UsersRepository,
    UsersService,
    EmailService,
    SessionRepository,
  ],
})
export class UserModule {}
