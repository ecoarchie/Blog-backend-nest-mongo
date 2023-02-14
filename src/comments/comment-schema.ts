import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

export class CommentLikesInfo {
  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  dislikesCount: number;

  @Prop({ default: 'None' })
  myStatus: string;
}

const CommentLikesInfoSchema = SchemaFactory.createForClass(CommentLikesInfo);

export class CommentatorInfo {
  @Prop({ required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userLogin: string;
}

const CommentatorInfoSchema = SchemaFactory.createForClass(CommentatorInfo);

export class Comment {
  @Prop({ required: true })
  content: string;

  @Prop({ type: CommentatorInfoSchema })
  commentatorInfo: CommentatorInfo;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: CommentLikesInfoSchema })
  likesInfo: CommentLikesInfo;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
