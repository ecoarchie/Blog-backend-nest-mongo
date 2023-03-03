import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';
import {
  Blog,
  BlogDocument,
  BlogPaginatorOptions,
  BlogsPagination,
} from '../blog-schema';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>) {}

  async findBlogById(blogId: string): Promise<Partial<Blog>> {
    if (!Types.ObjectId.isValid(blogId)) return null;
    const blogDocument = await this.blogModel.findById(blogId).lean();
    if (!blogDocument) return null;
    return this.toBlogDto(blogDocument);
  }

  async findAllBlogs(
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

    // const totalCount = paginatorOptions.searchNameTerm
    //   ? result.length
    //   : await this.blogModel.count(); //TODO maybe delete count all blogs since we need always result count
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
    };
  }
}
