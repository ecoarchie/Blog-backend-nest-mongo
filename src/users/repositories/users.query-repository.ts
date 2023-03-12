import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';
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
    const banFilter =
      paginatorOptions.banStatus === 'all'
        ? {}
        : paginatorOptions.banStatus === 'banned'
        ? { 'banInfo.isBanned': true }
        : { 'banInfo.isBanned': false };

    const loginOrEmailFilter =
      paginatorOptions.searchEmailTerm || paginatorOptions.searchLoginTerm
        ? {
            $or: [
              { login: { $regex: loginRegex } },
              { email: { $regex: emailRegex } },
            ],
          }
        : {};

    const result = await this.userModel
      .find()
      .and([loginOrEmailFilter, banFilter])
      .limit(paginatorOptions.pageSize)
      .skip(paginatorOptions.skip)
      .sort([[paginatorOptions.sortBy, paginatorOptions.sortDirection]])
      .lean();

    const totalCount = await this.userModel
      .count()
      .and([loginOrEmailFilter, banFilter]);
    // .exec(); // result.length;
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
    if (!user) throw new NotFoundException();

    return this.toUserDto(user);
  }

  async findUserByRecoveryCode(recoveryCode: string) {
    const user = await this.userModel
      .findOne({ 'passwordRecovery.recoveryCode': recoveryCode })
      .lean();

    return user;
  }

  async findUserLeanDocumentById(id: string) {
    const user = await this.userModel.findById(id).lean();
    const { password, ...rest } = user;
    return rest;
  }

  async findUserByLoginOrEmail(login: string, email: string) {
    const user = await this.userModel
      .findOne()
      .or([{ login }, { email }])
      .lean();

    if (!user) return null;
    return this.toUserDto(user);
  }

  async getUserLoginById(id: string): Promise<string | null> {
    const user = await this.userModel.findById(id).lean();

    return user ? user.login : null;
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
      banInfo: user.banInfo,
    };
  }
}
