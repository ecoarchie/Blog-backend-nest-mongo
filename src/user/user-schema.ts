import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  id: Types.ObjectId;

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
  @IsString()
  login: string;

  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  email: string;

  @Length(6, 20)
  @IsNotEmpty()
  @IsString()
  password: string;
}

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  },
});
