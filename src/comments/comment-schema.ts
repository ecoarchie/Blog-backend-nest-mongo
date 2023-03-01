import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { Like, LikeReaction, LikeSchema } from './like.schema';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ _id: false })
export class CommentLikesInfo {
  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  dislikesCount: number;

  @Prop({ default: 'None' })
  myStatus: string;

  @Prop({ type: [LikeSchema] })
  userLikes: Like[];
}

const CommentLikesInfoSchema = SchemaFactory.createForClass(CommentLikesInfo);

@Schema({ _id: false })
export class CommentatorInfo {
  @Prop({ required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userLogin: string;

  @Prop({ default: false })
  isBanned: boolean;
}

const CommentatorInfoSchema = SchemaFactory.createForClass(CommentatorInfo);

@Schema()
export class Comment {
  @Prop({ required: true })
  postId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: CommentatorInfoSchema, default: () => ({}) })
  commentatorInfo: CommentatorInfo;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: CommentLikesInfoSchema, default: () => ({}) })
  likesInfo: CommentLikesInfo;

  getMyLikeStatus(userId: string): LikeReaction {
    const myLikeObj = this.likesInfo.userLikes.find(
      (m) => m.userId.toString() === userId,
    );
    return myLikeObj ? myLikeObj.reaction : 'None';
  }

  updateContent(content: string) {
    this.content = content;
  }

  makeReaction(newReaction: LikeReaction, userId: string, userLogin: string) {
    const userLikeObj = this.likesInfo.userLikes.find(
      (u) => u.userId.toString() === userId,
    );
    const oldReaction = userLikeObj ? userLikeObj.reaction : 'None';
    if (!userLikeObj) {
      this.likesInfo.userLikes.push({
        userId: new Types.ObjectId(userId),
        login: userLogin,
        reaction: newReaction,
      } as Omit<Like, 'createdAt'>);
    } else {
      userLikeObj.reaction = newReaction;
    }
    this.changeLikeDislikeCount(oldReaction, newReaction);
  }

  changeLikeDislikeCount(oldReaction: LikeReaction, newReaction: LikeReaction) {
    if (oldReaction === newReaction) return;

    if (oldReaction === 'None') {
      if (newReaction === 'Like') this.likesInfo.likesCount += 1;
      else this.likesInfo.dislikesCount += 1;
    }

    if (oldReaction === 'Like') {
      if (newReaction === 'Dislike') {
        this.likesInfo.likesCount -= 1;
        this.likesInfo.dislikesCount += 1;
      } else if (newReaction === 'None') {
        this.likesInfo.likesCount -= 1;
      }
    }

    if (oldReaction === 'Dislike') {
      if (newReaction === 'Like') {
        this.likesInfo.dislikesCount -= 1;
        this.likesInfo.likesCount += 1;
      } else if (newReaction === 'None') {
        this.likesInfo.dislikesCount -= 1;
      }
    }
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.methods = {
  getMyLikeStatus: Comment.prototype.getMyLikeStatus,
  updateContent: Comment.prototype.updateContent,
  makeReaction: Comment.prototype.makeReaction,
  changeLikeDislikeCount: Comment.prototype.changeLikeDislikeCount,
};

export class CreateCommentDto {
  @IsString()
  @MaxLength(300)
  @MinLength(20)
  content: string;
}

export class UpdateCommentDto extends CreateCommentDto {}

type SortDirection = 'asc' | 'desc';

export class CommentsPaginationOptions {
  public sortBy: string;
  public sortDirection: SortDirection;
  public pageNumber: number;
  public pageSize: number;
  public skip: number;

  constructor(data: Partial<CommentsPaginationOptions> = {}) {
    this.sortBy = data.sortBy || 'createdAt';
    this.sortDirection = data.sortDirection || 'desc';
    this.pageNumber = Number(data.pageNumber) || 1;
    this.pageSize = Number(data.pageSize) || 10;
    this.skip = (this.pageNumber - 1) * this.pageSize;
  }
}
