import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema()
export class Session {
  _id: Types.ObjectId;

  @Prop({ required: true })
  ip: string;

  @Prop({ required: true })
  browserTitle: string;

  @Prop({ required: true })
  lastActiveDate: Date;

  @Prop({ required: true })
  deviceId: string;

  @Prop({ required: true })
  tokenExpireDate: Date;

  @Prop({ required: true })
  userId: string;

  async refresh(
    newIp: string,
    newBrowserTitle: string,
    newActiveDate: number,
    newTokenExpDate: number,
  ) {
    this.ip = newIp;
    this.browserTitle = newBrowserTitle;
    this.lastActiveDate = new Date(newActiveDate * 1000);
    this.tokenExpireDate = new Date(newTokenExpDate * 1000);
  }
}

export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.methods = {
  refresh: Session.prototype.refresh,
};

export type SessionDocument = HydratedDocument<Session>;

export class CreateSessionDto {
  ip: string;
  browserTitle: string;
  lastActiveDate: Date;
  deviceId: string;
  tokenExpireDate: Date;
  userId: string;
}
