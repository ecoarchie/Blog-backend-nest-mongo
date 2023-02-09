import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Blog,
  BlogDocument,
  BlogPaginatorOptions,
  BlogsPagination,
} from '../blog-schema';
import { Model, Types } from 'mongoose';
import { resourceLimits } from 'worker_threads';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>) {}

  async findBlogById(blogId: string): Promise<Blog> {
    if (!Types.ObjectId.isValid(blogId)) return null;
    return this.blogModel.findById(blogId).exec();
  }

  async findAll(
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
      .exec();

    const totalCount = result.length;
    const pagesCount = Math.ceil(totalCount / paginatorOptions.pageSize);
    return {
      pagesCount,
      page: paginatorOptions.pageNumber,
      pageSize: paginatorOptions.pageSize,
      totalCount,
      items: result,
    };
  }
}
