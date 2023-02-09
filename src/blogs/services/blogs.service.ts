import { Injectable } from '@nestjs/common';
import {
  Blog,
  BlogDocument,
  CreateBlogDto,
  UpdateBlogDto,
} from '../blog-schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { BlogsQueryRepository } from '../repositories/blogs.query-repository';

@Injectable()
export class BlogsService {
  constructor(
    private blogsQueryRepository: BlogsQueryRepository,
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
  ) {}

  async createNewBlog(dto: CreateBlogDto) {
    const newBlog = new this.blogModel(dto);
    const blogId = await this.blogsQueryRepository.saveBlog(newBlog);
    return blogId;
  }

  async updateBlog(blog: BlogDocument, updateBlogDto: UpdateBlogDto) {
    blog.setName(updateBlogDto.name);
    blog.setDescription(updateBlogDto.description);
    blog.setWebsiteUrl(updateBlogDto.websiteUrl);
    const result = await this.blogsQueryRepository.saveBlog(blog);
    console.log(
      '🚀 ~ file: blogs.service.ts:32 ~ BlogsService ~ updateBlog ~ result',
      result,
    );
    return result;
  }
}
