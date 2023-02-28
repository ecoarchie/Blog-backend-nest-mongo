import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';
import { add } from 'date-fns';
import { HydratedDocument, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class EmailComfirmation {
  @Prop({ default: uuidv4 })
  confirmationCode: string;

  @Prop({ default: () => Date.now() + 70 * 60 * 1000 })
  expirationDate: Date;

  @Prop({ default: false })
  isConfirmed: boolean;
}
const EmailComfirmationSchema = SchemaFactory.createForClass(EmailComfirmation);

@Schema({ _id: false })
export class PasswordRecovery {
  @Prop({ default: null })
  recoveryCode: string;

  @Prop({ default: null })
  expirationDate: Date;

  @Prop({ default: false })
  isUsed: boolean;
}
const PasswordRecoverySchema = SchemaFactory.createForClass(PasswordRecovery);

@Schema()
export class User {
  // @Prop()
  _id: Types.ObjectId;

  @Prop({ required: true })
  login: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: EmailComfirmationSchema, default: () => ({}) })
  emailConfirmation: EmailComfirmation;

  @Prop({ type: PasswordRecoverySchema, default: () => ({}) })
  passwordRecovery: PasswordRecovery;

  async checkCredentials(password: string) {
    const match = await bcrypt.compare(password, this.password);
    return match ? this._id.toString() : null;
  }

  toLeanUserDocument() {
    return {
      id: this._id.toString(),
      login: this.login,
      email: this.email,
      createdAt: this.createdAt,
      emailConfirmation: this.emailConfirmation,
      passwordRecovery: this.passwordRecovery,
    };
  }

  setEmailIsConfirmedToTrue() {
    this.emailConfirmation.isConfirmed = true;
  }

  updateConfirmationCode(newCode: string) {
    this.emailConfirmation.confirmationCode = newCode;
  }

  setNewPasswordRecoveryCode() {
    this.passwordRecovery.recoveryCode = uuidv4();
    this.passwordRecovery.expirationDate = add(new Date(), {
      hours: 1,
      minutes: 30,
    });
    this.passwordRecovery.isUsed = false;
  }

  async updatePasswordAndResetRecoveryCode(newPassword: string) {
    this.password = await bcrypt.hash(newPassword, 1);
    // this.passwordRecovery.recoveryCode = null;
    // this.passwordRecovery.expirationDate = null;
    this.passwordRecovery.isUsed = true;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.methods = {
  checkCredentials: User.prototype.checkCredentials,
  toLeanUserDocument: User.prototype.toLeanUserDocument,
  setEmailIsConfirmedToTrue: User.prototype.setEmailIsConfirmedToTrue,
  updateConfirmationCode: User.prototype.updateConfirmationCode,
  setNewPasswordRecoveryCode: User.prototype.setNewPasswordRecoveryCode,
  updatePasswordAndResetRecoveryCode:
    User.prototype.updatePasswordAndResetRecoveryCode,
};

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

export class CurrentUserReq {
  id: string;
  login: string;
}

export class EmailDto {
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export interface ILeanUser {
  login: string;
  email: string;
  createdAt: Date;
  emailConfirmation: EmailComfirmation;
  passwordRecovery: PasswordRecovery;
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
