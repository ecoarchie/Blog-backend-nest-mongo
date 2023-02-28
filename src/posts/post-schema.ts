import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsMongoId, IsNotEmpty, MaxLength } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { Like, LikeReaction, LikeSchema } from '../comments/like.schema';
import { Pagination } from '../users/user-schema';
import { IsBlogExists } from '../utils/blog-id.validator';

export type PostDocument = HydratedDocument<BlogPost>;

// @Schema()
// export class NewestLikesDetails {
//   @Prop()
//   addedAt: Date;

//   @Prop()
//   userId: Types.ObjectId;

//   @Prop()
//   login: string;
// }

// export const LikesDetailsSchema =
//   SchemaFactory.createForClass(NewestLikesDetails);

@Schema()
export class ExtendedLikesInfo {
  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  dislikesCount: number;

  @Prop({ type: [LikeSchema], default: () => [] as Like[] })
  userLikes: Like[];
}

export const ExtendedLikesInfoSchema =
  SchemaFactory.createForClass(ExtendedLikesInfo);

@Schema()
export class BlogPost {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  shortDescription: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  blogId: Types.ObjectId;

  @Prop({ required: true })
  blogName: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: ExtendedLikesInfoSchema, default: async () => ({}) })
  extendedLikesInfo: ExtendedLikesInfo;

  setTitle(newTitle: string) {
    this.title = newTitle;
  }

  setDescription(newDescription: string) {
    this.shortDescription = newDescription;
  }

  setContent(newContent: string) {
    this.content = newContent;
  }

  makeReaction(newReaction: LikeReaction, userId: string, userLogin: string) {
    const userLikeObj = this.extendedLikesInfo.userLikes.find(
      (u) => u.userId.toString() === userId,
    );
    const oldReaction = userLikeObj ? userLikeObj.reaction : 'None';
    if (!userLikeObj) {
      this.extendedLikesInfo.userLikes.push({
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
      if (newReaction === 'Like') this.extendedLikesInfo.likesCount += 1;
      else this.extendedLikesInfo.dislikesCount += 1;
    }

    if (oldReaction === 'Like') {
      if (newReaction === 'Dislike') {
        this.extendedLikesInfo.likesCount -= 1;
        this.extendedLikesInfo.dislikesCount += 1;
      } else if (newReaction === 'None') {
        this.extendedLikesInfo.likesCount -= 1;
      }
    }

    if (oldReaction === 'Dislike') {
      if (newReaction === 'Like') {
        this.extendedLikesInfo.dislikesCount -= 1;
        this.extendedLikesInfo.likesCount += 1;
      } else if (newReaction === 'None') {
        this.extendedLikesInfo.dislikesCount -= 1;
      }
    }
  }
}

export const PostSchema = SchemaFactory.createForClass(BlogPost);
PostSchema.methods = {
  setTitle: BlogPost.prototype.setTitle,
  setDescription: BlogPost.prototype.setDescription,
  setContent: BlogPost.prototype.setContent,
  makeReaction: BlogPost.prototype.makeReaction,
  changeLikeDislikeCount: BlogPost.prototype.changeLikeDislikeCount,
};

export class CreatePostDto {
  @MaxLength(30)
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  title: string;

  @MaxLength(100)
  @IsNotEmpty()
  shortDescription: string;

  @MaxLength(1000)
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  content: string;
}

export class CreatePostWithBlogIdDto extends CreatePostDto {
  // @Validate(IsBlogExistsConstraint) // same as below
  @IsBlogExists()
  @IsMongoId()
  @IsNotEmpty()
  blogId: string;
}

export class UpdatePostDto extends CreatePostWithBlogIdDto {}

export class UpdatePostWithoutBlogIdDto extends CreatePostDto {}

export class PostIdParam {
  @IsMongoId()
  postId: string;
}

export interface PostsPagination extends Pagination {
  items: Partial<BlogPost>[];
}

type SortDirection = 'asc' | 'desc';

export class PostPaginatorOptions {
  public sortBy: string;
  public sortDirection: SortDirection;
  public pageNumber: number;
  public pageSize: number;
  public skip: number;

  constructor(data: Partial<PostPaginatorOptions> = {}) {
    this.sortBy = data.sortBy || 'createdAt';
    this.sortDirection = data.sortDirection || 'desc';
    this.pageNumber = Number(data.pageNumber) || 1;
    this.pageSize = Number(data.pageSize) || 10;
    this.skip = (this.pageNumber - 1) * this.pageSize;
  }
}
