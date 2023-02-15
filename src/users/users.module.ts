import { Module } from '@nestjs/common';
import { UserController } from './controllers/users.controller';
import { UsersQueryRepository } from './repositories/users.query-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user-schema';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';
import { AuthService } from 'src/auth/services/auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  exports: [UsersRepository],
  controllers: [UserController],
  providers: [UsersQueryRepository, UsersRepository, UsersService, AuthService],
})
export class UserModule {}
