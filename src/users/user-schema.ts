import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  // @Prop()
  // _id: Types.ObjectId;

  @Prop({
    required: true,
  })
  login: string;

  @Prop({
    required: true,
  })
  password: string;

  @Prop({
    required: true,
  })
  email: string;

  @Prop({
    default: Date.now,
  })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

export interface IUser {
  id: string;
  login: string;
  email: string;
  createdAt: Date;
}

export class CreateUserDto {
  @Matches(/^[a-zA-Z0-9_-]*$/)
  @Length(3, 10)
  @IsNotEmpty()
  login: string;

  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Length(6, 20)
  @IsNotEmpty()
  password: string;
}

type SortDirection = 'asc' | 'desc';

export class UserPaginatorOptions {
  public sortBy: string;
  public sortDirection: SortDirection;
  public pageNumber: number;
  public pageSize: number;
  public searchLoginTerm: string;
  public searchEmailTerm: string;
  public skip: number;

  constructor(data: Partial<UserPaginatorOptions> = {}) {
    this.sortBy = data.sortBy || 'createdAt';
    this.sortDirection = data.sortDirection || 'desc';
    this.pageNumber = Number(data.pageNumber) || 1;
    this.pageSize = Number(data.pageSize) || 10;
    this.searchLoginTerm = data.searchLoginTerm || null;
    this.searchEmailTerm = data.searchEmailTerm || null;
    this.skip = (this.pageNumber - 1) * this.pageSize;
  }
}

export interface Pagination {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface UsersPagination extends Pagination {
  items: Partial<User>[];
}
