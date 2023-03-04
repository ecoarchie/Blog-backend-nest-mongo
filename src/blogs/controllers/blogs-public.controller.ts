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
    private readonly blogsService: BlogsService,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  // @UseGuards(BasicAuthGuard)
  // @Post()
  // async createBlog(@Body() blogDto: CreateBlogDto): Promise<Partial<Blog>> {
  //   const newBlogId = await this.blogsService.createNewBlog(blogDto);
  //   return this.blogsQueryRepository.findBlogById(newBlogId);
  // }

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
    const blogFound = await this.blogsQueryRepository.findBlogById(id);
    if (!blogFound) return res.sendStatus(404);
    return res.status(200).send(blogFound);
  }

  // @UseGuards(BasicAuthGuard)
  // @Put(':id')
  // async updateBlog(
  //   @Param('id') blogId: string,
  //   @Body() updateBlogDto: UpdateBlogDto,
  //   @Res() res: Response,
  // ) {
  //   const result = await this.blogsService.updateBlog(blogId, updateBlogDto);
  //   if (result) return res.sendStatus(204);
  //   else res.sendStatus(404);
  // }

  // @UseGuards(BasicAuthGuard)
  // @Post(':blogId/posts')
  // async createBlogPost(
  //   @Param('blogId') blogId: string,
  //   @Body() createPostDto: CreatePostDto,
  //   @Res() res: Response,
  //   @Req() req: Request,
  // ) {
  //   const postId = await this.blogsService.createBlogPost(
  //     blogId,
  //     createPostDto,
  //   );
  //   if (!postId) return res.sendStatus(404);
  //   const post = await this.postsQueryRepository.findPostById(
  //     postId,
  //     req.userId,
  //   );
  //   res.send(post);
  // }

  @Get(':blogId/posts')
  async getAllPostForBlog(
    @Param('blogId') blogId: string,
    @Query() postsPaginatorQuery: PostPaginatorOptions,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const blogFound = await this.blogsQueryRepository.findBlogById(blogId);
    if (!blogFound || blogFound.isBannedByAdmin) return res.sendStatus(404);

    const postsPaginatorOptions = new PostPaginatorOptions(postsPaginatorQuery);
    const posts = await this.postsQueryRepository.findAllPostsForBlog(
      blogId,
      postsPaginatorOptions,
      req.user.id,
    );
    res.send(posts);
  }

  // @UseGuards(BasicAuthGuard)
  // @Delete(':blogId')
  // async deletePostById(@Param('blogId') blogId: string, @Res() res: Response) {
  //   const isBlogDeleted = await this.blogsQueryRepository.deleteBlogById(
  //     blogId,
  //   );
  //   if (!isBlogDeleted) return res.sendStatus(404);
  //   return res.sendStatus(204);
  // }
}
