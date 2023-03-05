import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  Matches,
  MaxLength,
} from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { Pagination } from '../users/user-schema';

export type BlogDocument = HydratedDocument<Blog>;

@Schema({ _id: false })
export class BlogOwnerInfo {
  @Prop()
  userId: Types.ObjectId;

  @Prop()
  userLogin: string;
}

export const BlogOwnerInfoSchema = SchemaFactory.createForClass(BlogOwnerInfo);

@Schema({ _id: false })
export class UserBanInBlogInfo {
  @Prop()
  isBanned: boolean;

  @Prop()
  banDate: Date;

  @Prop()
  banReason: string;
}
const UserBanInBlogInfoSchema = SchemaFactory.createForClass(UserBanInBlogInfo);

@Schema({ _id: false })
export class BannedUser {
  @Prop()
  id: Types.ObjectId;

  @Prop()
  login: string;

  @Prop({ type: UserBanInBlogInfoSchema })
  banInfo: UserBanInBlogInfo;
}

const BannedUsersSchema = SchemaFactory.createForClass(BannedUser);

@Schema({ _id: false })
class BannedBlogInfo {
  @Prop({default: false})
  isBanned: boolean;

  @Prop({default: null})
  banDate: Date;
}

const BannedBlogInfoSchema = SchemaFactory.createForClass(BannedBlogInfo);

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

  @Prop({ type: BlogOwnerInfoSchema, default: async () => ({}) })
  ownerInfo: BlogOwnerInfo;

  @Prop({ type: [BannedUsersSchema] })
  bannedUsers: BannedUser[];

  @Prop({ type: BannedBlogInfoSchema, default: async () => ({}) })
  banInfo: BannedBlogInfo;

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

  bindToUser(userId: string, userLogin: string) {
    this.ownerInfo.userId = new Types.ObjectId(userId);
    this.ownerInfo.userLogin = userLogin;
  }

  addUserToBanList(
    userId: string,
    userLogin: string,
    banInfo: UserBanInBlogInfo,
  ) {
    const userInBanListIndex = this.bannedUsers.findIndex(
      (u) => u.id.toString() === userId,
    );
    if (!banInfo.isBanned) {
      if (userInBanListIndex === -1) return;
      this.bannedUsers[userInBanListIndex].banInfo.isBanned = false;
      this.bannedUsers[userInBanListIndex].banInfo.banDate = null;
      this.bannedUsers[userInBanListIndex].banInfo.banReason = null;
      return;
    }
    if (userInBanListIndex === -1) {
      const bannedUserObj: BannedUser = {
        id: new Types.ObjectId(userId),
        login: userLogin,
        banInfo,
      };
      this.bannedUsers.push(bannedUserObj);
    } else {
      this.bannedUsers[userInBanListIndex].banInfo = { ...banInfo };
    }
  }

  getBannedUsers() {
    const bannedUsers = this.bannedUsers.filter((u) => u.banInfo.isBanned);
    return bannedUsers;
  }

  banOrUnban(banBlogDto: BanBlogDto) {
    this.banInfo.isBanned = banBlogDto.isBanned;
    if (banBlogDto.isBanned) this.banInfo.banDate = new Date();
    else this.banInfo.banDate = null;
  }
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
BlogSchema.methods = {
  setName: Blog.prototype.setName,
  setDescription: Blog.prototype.setDescription,
  setWebsiteUrl: Blog.prototype.setWebsiteUrl,
  setMembership: Blog.prototype.setMembership,
  bindToUser: Blog.prototype.bindToUser,
  addUserToBanList: Blog.prototype.addUserToBanList,
  getBannedUsers: Blog.prototype.getBannedUsers,
  banOrUnban: Blog.prototype.banOrUnban,
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

export class BindToBlogDto {
  @IsMongoId()
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  blogId: string;

  @IsMongoId()
  @IsNotEmpty()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  userId: string;
}

export class UpdateBlogDto extends CreateBlogDto {}

export class BanBlogDto {
  @IsBoolean()
  isBanned: boolean;
}

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
