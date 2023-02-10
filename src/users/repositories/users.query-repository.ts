import { LeanDocument, Model, Types } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  User,
  UserDocument,
  UserPaginatorOptions,
  UsersPagination,
} from '../user-schema';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(
    paginatorOptions: UserPaginatorOptions,
  ): Promise<UsersPagination> {
    const loginRegex = new RegExp(paginatorOptions.searchLoginTerm, 'i');
    const emailRegex = new RegExp(paginatorOptions.searchEmailTerm, 'i');
    const result = await this.userModel
      .find(
        paginatorOptions.searchEmailTerm || paginatorOptions.searchLoginTerm
          ? {
              $or: [
                {
                  login: { $regex: loginRegex },
                },
                {
                  email: { $regex: emailRegex },
                },
              ],
            }
          : {},
      )
      .limit(paginatorOptions.pageSize)
      .skip(paginatorOptions.skip)
      .sort([[paginatorOptions.sortBy, paginatorOptions.sortDirection]])
      .lean();

    const totalCount = result.length;
    const pagesCount = Math.ceil(totalCount / paginatorOptions.pageSize);
    return {
      pagesCount,
      page: paginatorOptions.pageNumber,
      pageSize: paginatorOptions.pageSize,
      totalCount,
      items: result.map(this.toUserDto),
    };
  }

  async findUserById(id: string) {
    const user = await this.userModel.findById(id).lean();

    return this.toUserDto(user);
  }

  async deleteUserById(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await this.userModel.deleteOne({ _id: id });
    return result.deletedCount === 1;
  }

  private toUserDto(user: LeanDocument<UserDocument>) {
    return {
      id: user._id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
