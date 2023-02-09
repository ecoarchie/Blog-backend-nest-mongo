import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { UsersRepository } from './users-repository';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user-schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UsersRepository],
})
export class UserModule {}
