import { Injectable } from '@nestjs/common';
import { Blog, BlogDocument, CreateBlogDto } from '../blog-schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>) {}

  async createBlog(dto: CreateBlogDto): Promise<BlogDocument['id']> {
    const newBlog = new this.blogModel(dto);
    const result = await newBlog.save();
    return result._id.toString();
  }
}
