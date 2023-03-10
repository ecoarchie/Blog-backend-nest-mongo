import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';
import { BlogPost, PostDocument } from '../../posts/post-schema';
import {
  BannedUserPaginatorOptions,
  UsersPagination,
} from '../../users/user-schema';
import {
  BannedUser,
  Blog,
  BlogDocument,
  BlogPaginatorOptions,
  BlogsPagination,
} from '../blog-schema';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(BlogPost.name) private postModel: Model<PostDocument>,
  ) { }

  async findBlogById(blogId: string): Promise<Partial<Blog>> {
    if (!Types.ObjectId.isValid(blogId)) return null;
    const blogDocument = await this.blogModel.findById(blogId).lean();
    if (!blogDocument || blogDocument.banInfo.isBanned) return null;
    return this.toBlogDto(blogDocument);
  }

  async findNotBannedBlogById(blogId: string): Promise<Partial<Blog>> {
    if (!Types.ObjectId.isValid(blogId)) return null;
    const blogDocument = await this.blogModel.findOne()
      .and([
        { _id: new Types.ObjectId(blogId) },
        { 'banInfo.isBanned': false },
      ])
      .lean();
    if (!blogDocument) return null;
    return this.toBlogDto(blogDocument);
  }

  async findAllBlogs(
    paginatorOptions: BlogPaginatorOptions,
  ): Promise<BlogsPagination> {
    const nameRegex = new RegExp(paginatorOptions.searchNameTerm, 'i');
    const result = await this.blogModel
      .find()
      .and([
        paginatorOptions.searchNameTerm ? { name: { $regex: nameRegex } } : {},
        { 'banInfo.isBanned': false },
      ])
      .limit(paginatorOptions.pageSize)
      .skip(paginatorOptions.skip)
      .sort([[paginatorOptions.sortBy, paginatorOptions.sortDirection]])
      .lean();

    const totalCount = paginatorOptions.searchNameTerm
      ? result.length
      : await this.blogModel.count({ 'banInfo.isBanned': false });
    const pagesCount = Math.ceil(totalCount / paginatorOptions.pageSize);
    return {
      pagesCount,
      page: paginatorOptions.pageNumber,
      pageSize: paginatorOptions.pageSize,
      totalCount,
      items: result.map(this.toBlogDto),
    };
  }

  async findAllBlogsWithOwnerInfo(
    paginatorOptions: BlogPaginatorOptions,
  ): Promise<BlogsPagination> {
    const nameRegex = new RegExp(paginatorOptions.searchNameTerm, 'i');
    const result = await this.blogModel
      .find(
        paginatorOptions.searchNameTerm ? { name: { $regex: nameRegex } } : {},
      )
      .limit(paginatorOptions.pageSize)
      .skip(paginatorOptions.skip)
      .sort([[paginatorOptions.sortBy, paginatorOptions.sortDirection]])
      .lean();

    const totalCount = paginatorOptions.searchNameTerm
      ? result.length
      : await this.blogModel.count();
    const pagesCount = Math.ceil(totalCount / paginatorOptions.pageSize);
    return {
      pagesCount,
      page: paginatorOptions.pageNumber,
      pageSize: paginatorOptions.pageSize,
      totalCount,
      items: result.map(this.toBlogWithOwnerInfoDto),
    };
  }

  async findAllBlogsForCurrentUser(
    paginatorOptions: BlogPaginatorOptions,
    currentUserId: string,
  ): Promise<BlogsPagination> {
    const nameRegex = new RegExp(paginatorOptions.searchNameTerm, 'i');
    const nameFilter = paginatorOptions.searchNameTerm
      ? { name: { $regex: nameRegex } }
      : {};
    const ownerFilter = {
      'ownerInfo.userId': new Types.ObjectId(currentUserId),
    };
    const result = await this.blogModel
      .find()
      .and([nameFilter, ownerFilter])
      .limit(paginatorOptions.pageSize)
      .skip(paginatorOptions.skip)
      .sort([[paginatorOptions.sortBy, paginatorOptions.sortDirection]])
      .lean();

    const totalCount = await this.blogModel
      .count()
      .and([nameFilter, ownerFilter]);
    const pagesCount = Math.ceil(totalCount / paginatorOptions.pageSize);
    return {
      pagesCount,
      page: paginatorOptions.pageNumber,
      pageSize: paginatorOptions.pageSize,
      totalCount,
      items: result.map(this.toBlogDto),
    };
  }

  async findAllPostsForAllBlogsOfCurrentUser(userId: string) {
    const blogs = await this.blogModel
      .find({ 'ownerInfo.userId': new Types.ObjectId(userId) })
      .and([
        { 'ownerInfo.userId': new Types.ObjectId(userId) },
        { 'banInfo.isBanned': false }
      ])
      .lean();
    const blogsIds = blogs.map((b) => {
      return b._id;
    });
    const posts = await this.postModel
      .find()
      .where('blogId')
      .in(blogsIds)
      .lean();
    return posts;
  }

  async findAllBannedUsersForBlog(
    currentUserId: string,
    blogId: string,
    paginatorOptions: BannedUserPaginatorOptions,
  ): Promise<UsersPagination> {
    const blog = await this.blogModel.findById(blogId);
    if (!blog) throw new NotFoundException();
    if (blog.ownerInfo.userId.toString() !== currentUserId) throw new ForbiddenException();

    const sort: any = {};
    sort[`bannedUsers.${paginatorOptions.sortBy}`] = paginatorOptions.sortDirection === 'asc' ? 1 : -1;
    const bannedUsers = await this.blogModel.aggregate([
      { $match: { _id: new Types.ObjectId(blogId) } },
      { $unwind: '$bannedUsers' },
      { $sort: sort },
      { $skip: paginatorOptions.skip },
      { $limit: paginatorOptions.pageSize },
      { $project: { _id: 0, bannedUsers: 1 } },
    ])
    const totalCount = blog.getBannedUsers().length;
    const pagesCount = Math.ceil(totalCount / paginatorOptions.pageSize);
    return {
      pagesCount,
      page: paginatorOptions.pageNumber,
      pageSize: paginatorOptions.pageSize,
      totalCount,
      items: bannedUsers.map(u => u.bannedUsers),
    };
  }

  async deleteBlogById(currentUserId: string, blogId: string): Promise<void> {
    const blogToDelete = await this.blogModel.findById(blogId);
    if (!blogToDelete) throw new NotFoundException();
    if (!blogToDelete.ownerInfo.userId.equals(currentUserId))
      throw new ForbiddenException();

    await this.blogModel.deleteOne({
      _id: blogId,
    });
  }

  private toBlogDto(blog: LeanDocument<BlogDocument>) {
    return {
      id: blog._id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    };
  }

  private toBlogWithOwnerInfoDto(blog: LeanDocument<BlogDocument>) {
    return {
      id: blog._id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
      blogOwnerInfo: blog.ownerInfo,
      banInfo: blog.banInfo,
    };
  }
}
