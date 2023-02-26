import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

type LikeReaction = 'None' | 'Like' | 'Dislike';

@Schema()
export class Like {
  @Prop({ default: Date.now })
  addedAt: Date;

  @Prop()
  userId: Types.ObjectId;

  @Prop()
  login: string;

  @Prop()
  reaction: LikeReaction;
}

export const LikeSchema = SchemaFactory.createForClass(Like);
export type LikeDocument = HydratedDocument<Like>;
