import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsIn } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';

export type LikeReaction = 'None' | 'Like' | 'Dislike';

@Schema({ _id: false })
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

export class LikeInputDto {
  @IsIn(['None', 'Like', 'Dislike'])
  likeStatus: LikeReaction;
}
