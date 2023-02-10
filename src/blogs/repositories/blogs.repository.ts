import { Injectable } from '@nestjs/common';
import { Blog, BlogDocument } from '../blog-schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>) {}

  async saveBlog(blog: BlogDocument): Promise<BlogDocument['id']> {
    const result = await blog.save();
    return result.id;
  }

  async findBlogById(blogId: string): Promise<BlogDocument> {
    return this.blogModel.findById(blogId);
  }
}
