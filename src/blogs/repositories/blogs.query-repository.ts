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
  ) {}

  async findBlogById(blogId: string): Promise<Partial<Blog>> {
    if (!Types.ObjectId.isValid(blogId)) return null;
    const blogDocument = await this.blogModel.findById(blogId).lean();
    if (!blogDocument) return null;
    return this.toBlogDto(blogDocument);
  }

  async findNotBannedBlogById(blogId: string): Promise<Partial<Blog>> {
    if (!Types.ObjectId.isValid(blogId)) return null;
    const blogDocument = await this.blogModel.findOne()
    .and([
      {_id: new Types.ObjectId(blogId)},
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
      : await this.blogModel.count({ 'banInfo.isBanned': false});
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
      .find({
        'ownerInfo.userId': new Types.ObjectId(userId),
      })
      .lean();
    const blogsIds = blogs.map((b) => {
      return b._id;
    });
    const posts = await this.postModel
      .find()
      .where('blogId')
      .in(blogsIds)
      .lean();
    const postIds = posts.map((p) => p._id);
    return posts;
  }

  async findAllBannedUsersForBlog(
    blogId: string,
    paginatorOptions: BannedUserPaginatorOptions,
  ): Promise<UsersPagination> {
    const blog = await this.blogModel.findById(blogId);
    const bannedUsers = blog.getBannedUsers();
    // const loginRegex = new RegExp(paginatorOptions.searchLoginTerm, 'i');
    // const loginFilter = paginatorOptions.searchLoginTerm
    //   ? { login: { $regex: loginRegex } }
    //   : {};
    // const isBannedFilter = {
    //   arrayFilters: [{ 'banInfo.isBanned': true }],
    // };
    // const result = await this.blogModel
    //   .find()
    //   .and([loginFilter, isBannedFilter])
    //   .limit(paginatorOptions.pageSize)
    //   .skip(paginatorOptions.skip)
    //   .sort([[paginatorOptions.sortBy, paginatorOptions.sortDirection]])
    //   .lean();

    // const totalCount = await this.blogModel
    //   .count()
    //   .and([loginFilter, isBannedFilter]);
    const totalCount = bannedUsers.length;
    const pagesCount = Math.ceil(totalCount / paginatorOptions.pageSize);
    return {
      pagesCount,
      page: paginatorOptions.pageNumber,
      pageSize: paginatorOptions.pageSize,
      totalCount,
      items: this.filterBanList(
        bannedUsers,
        paginatorOptions
      ),
    };
  }

  private filterBanList(
    banList: BannedUser[],
    paginator: BannedUserPaginatorOptions
  ) {
    return banList.sort((a: any, b: any) => {
      if (paginator.sortDirection === 'asc') return a.banInfo[paginator.sortBy] - b.banInfo[paginator.sortBy];
      else return b.banInfo[paginator.sortBy] - a.banInfo[paginator.sortBy];
    }).slice(paginator.pageNumber * paginator.pageSize + 1, paginator.pageNumber * paginator.pageSize + 1 + paginator.pageSize);
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
