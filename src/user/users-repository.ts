import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, CreateUserDto } from './user-schema';
// import { Cat, CatDocument } from './schemas/cat.schema';
// import { CreateCatDto } from './dto/create-cat.dto';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select({ password: 0 }).exec();
  }

  async deleteUserById(id: string) {
    return this.userModel.deleteOne({ _id: id });
  }
}
