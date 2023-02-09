import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { BlogsQueryRepository } from '../repositories/blogs.query-repository';
import { BlogsService } from '../services/blogs.service';
import {
  Blog,
  BlogPaginatorOptions,
  BlogsPagination,
  CreateBlogDto,
} from '../blog-schema';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly blogsService: BlogsService,
  ) {}

  @Post()
  @UsePipes(ValidationPipe)
  async createBlog(@Body() blogDto: CreateBlogDto): Promise<Blog> {
    const newBlogId = await this.blogsService.createNewBlog(blogDto);
    return this.blogsQueryRepository.findBlogById(newBlogId);
  }

  @Get()
  async findAllBlogs(
    @Query() blogsPaginatorQuery: BlogPaginatorOptions,
  ): Promise<BlogsPagination> {
    const blogsPaginatorOptions = new BlogPaginatorOptions(blogsPaginatorQuery);
    const blogs = await this.blogsQueryRepository.findAll(
      blogsPaginatorOptions,
    );
    return blogs;
  }
}
