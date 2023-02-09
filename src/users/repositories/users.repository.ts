import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto, User, UserDocument } from '../user-schema';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserDocument['id']> {
    const createdUser = new this.userModel(createUserDto);
    const result = await createdUser.save();
    return result._id.toString();
  }

  async saveUser(user: UserDocument) {
    await user.save();
  }
}
