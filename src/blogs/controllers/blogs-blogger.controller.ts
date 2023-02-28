import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { BearerAuthGuard } from '../../auth/guards/bearer.auth.guard';
import {
  CreatePostDto,
  UpdatePostWithoutBlogIdDto,
} from '../../posts/post-schema';
import { PostsService } from '../../posts/posts.service';
import { PostsQueryRepository } from '../../posts/repositories/posts.query-repository';
import { UsersQueryRepository } from '../../users/repositories/users.query-repository';
import { CurrentUserId } from '../../utils/current-user-id.param.decorator';
import {
  Blog,
  BlogOwnerInfo,
  BlogPaginatorOptions,
  BlogsPagination,
  CreateBlogDto,
  UpdateBlogDto,
} from '../blog-schema';
import { BlogsQueryRepository } from '../repositories/blogs.query-repository';
import { BlogsRepository } from '../repositories/blogs.repository';
import { BlogsService } from '../services/blogs.service';

@Controller('blogger/blogs')
@UseGuards(BearerAuthGuard)
export class BloggerBlogsController {
  constructor(
    private readonly usersQueryRepo: UsersQueryRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly blogsRepository: BlogsRepository,
    private readonly blogsService: BlogsService,
    private readonly postsService: PostsService,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Post()
  async createBlog(
    @Body() blogDto: CreateBlogDto,
    @CurrentUserId() currentUserId: string,
  ): Promise<Partial<Blog>> {
    const ownerInfo: BlogOwnerInfo = {
      userId: new Types.ObjectId(currentUserId),
      userLogin: await this.usersQueryRepo.getUserLoginById(currentUserId),
    };
    const newBlogId = await this.blogsService.createNewBlog(blogDto, ownerInfo);
    return this.blogsQueryRepository.findBlogById(newBlogId);
  }

  @Get()
  async findAllBlogs(
    @Query() blogsPaginatorQuery: BlogPaginatorOptions,
    @CurrentUserId() currentUserId: string,
  ): Promise<BlogsPagination> {
    const blogsPaginatorOptions = new BlogPaginatorOptions(blogsPaginatorQuery);
    const blogs = await this.blogsQueryRepository.findAllBlogsForCurrentUser(
      blogsPaginatorOptions,
      currentUserId,
    );
    return blogs;
  }

  @HttpCode(204)
  @Put(':id')
  async updateBlog(
    @Param('id') blogId: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @CurrentUserId() currentUserId: string,
  ) {
    await this.blogsService.updateBlog(currentUserId, blogId, updateBlogDto);
  }

  @Post(':blogId/posts')
  async createBlogPost(
    @Param('blogId') blogId: string,
    @CurrentUserId() currentUserId: string,
    @Body() createPostDto: CreatePostDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const postId = await this.blogsService.createBlogPost(
      blogId,
      createPostDto,
      currentUserId,
    );
    const post = await this.postsQueryRepository.findPostById(
      postId,
      req.userId,
    );
    res.send(post);
  }

  @HttpCode(204)
  @Put(':blogId/posts/:postId')
  async updatePostById(
    @CurrentUserId() currentUserId: string,
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostWithoutBlogIdDto,
  ) {
    await this.postsService.updatePostById(
      blogId,
      postId,
      updatePostDto,
      currentUserId,
    );
  }

  //TODO try to implement mongoId validation pipe
  @HttpCode(204)
  @Delete(':blogId')
  async deleteBlogById(
    @CurrentUserId() currentUserId: string,
    @Param('blogId') blogId: string,
  ) {
    await this.blogsRepository.deleteBlogById(currentUserId, blogId);
    await this.blogsService.deletePostsOfDeletedBlog(blogId);
  }

  @HttpCode(204)
  @Delete(':blogId/posts/:postId')
  async deletePostById(
    @CurrentUserId() currentUserId: string,
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ) {
    await this.postsService.deletePostById(blogId, postId, currentUserId);
  }
}
