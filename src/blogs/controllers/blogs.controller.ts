import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
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
import { CreatePostDto, PostPaginatorOptions } from 'src/posts/post-schema';
import { PostsQueryRepository } from 'src/posts/repositories/posts.query-repository';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly blogsService: BlogsService,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Post()
  async createBlog(@Body() blogDto: CreateBlogDto): Promise<Partial<Blog>> {
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
  async updateBlog(
    @Param('id') blogId: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @Res() res: Response,
  ) {
    const result = await this.blogsService.updateBlog(blogId, updateBlogDto);
    if (result) return res.sendStatus(204);
    else res.sendStatus(404);
  }

  @Post(':blogId/posts')
  async createBlogPost(
    @Param('blogId') blogId: string,
    @Body() createPostDto: CreatePostDto,
    @Res() res: Response,
  ) {
    const postId = await this.blogsService.createBlogPost(
      blogId,
      createPostDto,
    );
    if (!postId) return res.sendStatus(404);
    const post = await this.postsQueryRepository.findPostById(postId);
    res.send(post);
  }

  @Get(':blogId/posts')
  async getAllPostForBlog(
    @Param('blogId') blogId: string,
    @Query() postsPaginatorQuery: PostPaginatorOptions,
    @Res() res: Response,
  ) {
    const blogFound = await this.blogsQueryRepository.findBlogById(blogId);
    if (!blogFound) return res.sendStatus(404);

    const postsPaginatorOptions = new PostPaginatorOptions(postsPaginatorQuery);
    const posts = await this.postsQueryRepository.findAllPostsForBlog(
      blogId,
      postsPaginatorOptions,
    );
    res.send(posts);
  }
}
