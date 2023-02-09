import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../repositories/blogs.repository';
import { BlogDocument, CreateBlogDto } from '../blog-schema';

@Injectable()
export class BlogsService {
  constructor(private blogsRepository: BlogsRepository) {}

  async createNewBlog(dto: CreateBlogDto): Promise<BlogDocument['id']> {
    return await this.blogsRepository.createBlog(dto);
  }
}
