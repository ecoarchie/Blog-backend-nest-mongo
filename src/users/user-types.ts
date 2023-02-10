import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class SerializedUser {
  @Transform(({ value }) => value.toString())
  @Expose({ name: 'id' })
  id: Types.ObjectId;

  login: string;

  @Exclude()
  password: string;

  email: string;

  createdAt: Date;
}
