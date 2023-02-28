import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsMongoId, IsNotEmpty, Matches, MaxLength } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { Pagination } from '../users/user-schema';

export type BlogDocument = HydratedDocument<Blog>;

@Schema()
export class Blog {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  websiteUrl: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: false })
  isMembership: boolean;

  @Prop({ required: true })
  ownerId: Types.ObjectId;

  setName(newName: string) {
    this.name = newName;
  }

  setDescription(newDescription: string) {
    this.description = newDescription;
  }

  setWebsiteUrl(newUrl: string) {
    this.websiteUrl = newUrl;
  }

  setMembership(membership: boolean) {
    this.isMembership = membership;
  }
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
BlogSchema.methods = {
  setName: Blog.prototype.setName,
  setDescription: Blog.prototype.setDescription,
  setWebsiteUrl: Blog.prototype.setWebsiteUrl,
  setMembership: Blog.prototype.setMembership,
};

export class CreateBlogDto {
  @MaxLength(15)
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  name: string;

  @MaxLength(500)
  @IsNotEmpty()
  description: string;

  @MaxLength(100)
  @Matches(
    /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
  )
  @IsNotEmpty()
  websiteUrl: string;
}

export class UpdateBlogDto extends CreateBlogDto {}

export interface BlogsPagination extends Pagination {
  items: Partial<Blog>[];
}

type SortDirection = 'asc' | 'desc';

export class BlogPaginatorOptions {
  public sortBy: string;
  public sortDirection: SortDirection;
  public pageNumber: number;
  public pageSize: number;
  public searchNameTerm: string;
  public skip: number;

  constructor(data: Partial<BlogPaginatorOptions> = {}) {
    this.sortBy = data.sortBy || 'createdAt';
    this.sortDirection = data.sortDirection || 'desc';
    this.pageNumber = Number(data.pageNumber) || 1;
    this.pageSize = Number(data.pageSize) || 10;
    this.searchNameTerm = data.searchNameTerm || null;
    this.skip = (this.pageNumber - 1) * this.pageSize;
  }
}

export class BlogIdParam {
  @IsMongoId()
  postId: string;
}
