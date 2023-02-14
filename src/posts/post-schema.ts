import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsMongoId, IsNotEmpty, MaxLength } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { Pagination } from 'src/users/user-schema';

export type PostDocument = HydratedDocument<BlogPost>;

@Schema()
export class NewestLikesDetails {
  @Prop()
  addedAt: Date;

  @Prop()
  userId: Types.ObjectId;

  @Prop()
  login: string;
}

export const LikesDetailsSchema =
  SchemaFactory.createForClass(NewestLikesDetails);

@Schema()
export class ExtendedLikesInfo {
  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  dislikesCount: number;

  @Prop({
    type: [LikesDetailsSchema],
    default: () => [] as NewestLikesDetails[],
  })
  newestLikes: [NewestLikesDetails];
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
}

export const PostSchema = SchemaFactory.createForClass(BlogPost);
PostSchema.methods = {
  setTitle: BlogPost.prototype.setTitle,
  setDescription: BlogPost.prototype.setDescription,
  setContent: BlogPost.prototype.setContent,
};

export class CreatePostDto {
  @IsNotEmpty()
  @MaxLength(30)
  title: string;

  @IsNotEmpty()
  @MaxLength(100)
  shortDescription: string;

  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}

export class CreatePostWithBlogIdDto extends CreatePostDto {
  @IsNotEmpty()
  blogId: string;
}

export class UpdatePostDto extends CreatePostWithBlogIdDto {}

// export class PostIdParam {
//   @IsMongoId()
//   postId: string;
// }

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
