import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema()
export class CommentLikesInfo {
  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  dislikesCount: number;

  @Prop({ default: 'None' })
  myStatus: string;
}

const CommentLikesInfoSchema = SchemaFactory.createForClass(CommentLikesInfo);

@Schema()
export class CommentatorInfo {
  @Prop({ required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userLogin: string;
}

const CommentatorInfoSchema = SchemaFactory.createForClass(CommentatorInfo);

@Schema()
export class Comment {
  @Prop({ required: true })
  content: string;

  @Prop({ type: CommentatorInfoSchema, default: () => ({}) })
  commentatorInfo: CommentatorInfo;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: CommentLikesInfoSchema, default: () => ({}) })
  likesInfo: CommentLikesInfo;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

export class CreateCommentDto {
  @IsString()
  @MaxLength(300)
  @MinLength(20)
  content: string;
}
