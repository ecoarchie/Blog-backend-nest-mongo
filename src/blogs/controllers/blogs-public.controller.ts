import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { PostPaginatorOptions } from '../../posts/post-schema';
import { PostsQueryRepository } from '../../posts/repositories/posts.query-repository';
import { BlogPaginatorOptions, BlogsPagination } from '../blog-schema';
import { BlogsQueryRepository } from '../repositories/blogs.query-repository';
import { BlogsService } from '../services/blogs.service';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async findAllBlogs(
    @Query() blogsPaginatorQuery: BlogPaginatorOptions,
  ): Promise<BlogsPagination> {
    const blogsPaginatorOptions = new BlogPaginatorOptions(blogsPaginatorQuery);
    const blogs = await this.blogsQueryRepository.findAllBlogs(
      blogsPaginatorOptions,
    );
    return blogs;
  }

  @Get(':id')
  async findBlogById(@Param('id') id: string, @Res() res: Response) {
    const blogFound = await this.blogsQueryRepository.findNotBannedBlogById(id);
    if (!blogFound) return res.sendStatus(404);
    return res.status(200).send(blogFound);
  }

  @Get(':blogId/posts')
  async getAllPostForBlog(
    @Param('blogId') blogId: string,
    @Query() postsPaginatorQuery: PostPaginatorOptions,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const blogFound = await this.blogsQueryRepository.findBlogById(blogId);
    if (!blogFound) return res.sendStatus(404);

    const postsPaginatorOptions = new PostPaginatorOptions(postsPaginatorQuery);
    const posts = await this.postsQueryRepository.findAllPostsForBlog(
      blogId,
      postsPaginatorOptions,
      req.user?.id || null,
    );
    res.send(posts);
  }
}
