import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
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
  UpdateBlogDto,
} from '../blog-schema';
import { Response } from 'express';

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

  @Get(':id')
  async findBlogById(@Param('id') id: string, @Res() res: Response) {
    const blogFound = await this.blogsQueryRepository.findBlogById(id);
    if (!blogFound) return res.sendStatus(404);
    return res.status(200).send(blogFound);
  }

  @Put(':id')
  @UsePipes(ValidationPipe)
  async updateBlog(
    @Param('id') blogId: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @Res() res: Response,
  ) {
    const blog = await this.blogsQueryRepository.findBlogById(blogId);
    if (!blog) return res.sendStatus(404);
    const result = await this.blogsService.updateBlog(blog, updateBlogDto);
    if (result) return res.sendStatus(204);
    else return res.sendStatus(400);
  }
}
