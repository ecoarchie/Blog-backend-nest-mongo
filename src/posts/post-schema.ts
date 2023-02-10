import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsMongoId, IsNotEmpty, MaxLength } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { Pagination } from 'src/users/user-schema';

export type PostDocument = HydratedDocument<Post>;

@Schema()
export class LikesDetails {
  @Prop()
  addedAt: Date;

  @Prop()
  userId: Types.ObjectId;

  @Prop()
  login: string;
}

export const LikesDetailsSchema = SchemaFactory.createForClass(LikesDetails);

@Schema()
export class ExtendedLikesInfo {
  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  dislikesCount: number;

  @Prop({ type: [LikesDetailsSchema], default: () => [] as LikesDetails[] })
  newestLikes: [LikesDetails];
}

export const ExtendedLikesInfoSchema =
  SchemaFactory.createForClass(ExtendedLikesInfo);

@Schema()
export class Post {
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
}

export const PostSchema = SchemaFactory.createForClass(Post);

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

export class BlogIdParam {
  @IsMongoId()
  blogId: string;
}

export class UpdatePostDto extends CreatePostDto {}

export interface PostsPagination extends Pagination {
  items: Post[];
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
