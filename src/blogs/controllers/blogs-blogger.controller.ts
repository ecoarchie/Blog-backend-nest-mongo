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
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { BearerAuthGuard } from '../../auth/guards/bearer.auth.guard';
import { CommentsPaginationOptions } from '../../comments/comment-schema';
import { CommentsQueryRepository } from '../../comments/repositories/comments.query-repository';
import {
  CreatePostDto,
  UpdatePostWithoutBlogIdDto,
} from '../../posts/post-schema';
import { PostsService } from '../../posts/posts.service';
import { PostsQueryRepository } from '../../posts/repositories/posts.query-repository';
import { CurrentUserReq } from '../../users/user-schema';
import { CurrentUser } from '../../utils/current-user.param.decorator';
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
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly blogsRepository: BlogsRepository,
    private readonly blogsService: BlogsService,
    private readonly postsService: PostsService,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commentsQueryRepo: CommentsQueryRepository,
  ) { }

  @Post()
  async createBlog(
    @Body() blogDto: CreateBlogDto,
    @CurrentUser() currentUser: CurrentUserReq,
  ): Promise<Partial<Blog>> {
    const ownerInfo: BlogOwnerInfo = {
      userId: new Types.ObjectId(currentUser.id),
      userLogin: currentUser.login,
    };
    const newBlogId = await this.blogsService.createNewBlog(blogDto, ownerInfo);
    return this.blogsQueryRepository.findBlogById(newBlogId);
  }

  @Get()
  async findAllBlogs(
    @Query() blogsPaginatorQuery: BlogPaginatorOptions,
    @CurrentUser('id') currentUserId: string,
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
    @CurrentUser('id') currentUserId: string,
  ) {
    await this.blogsService.updateBlog(currentUserId, blogId, updateBlogDto);
  }

  @HttpCode(201)
  @Post(':blogId/posts')
  async createBlogPost(
    @Param('blogId') blogId: string,
    @CurrentUser('id') currentUserId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    const postId = await this.blogsService.createBlogPost(
      blogId,
      createPostDto,
      currentUserId,
    );
    const post = await this.postsQueryRepository.findPostById(
      postId,
      currentUserId,
    );
    return post;
  }

  @HttpCode(204)
  @Put(':blogId/posts/:postId')
  async updatePostById(
    @CurrentUser('id') currentUserId: string,
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

  @HttpCode(204)
  @Delete(':blogId')
  async deleteBlogById(
    @CurrentUser('id') currentUserId: string,
    @Param('blogId') blogId: string,
  ) {
    await this.blogsRepository.deleteBlogById(currentUserId, blogId);
    await this.blogsService.deletePostsOfDeletedBlog(blogId);
  }

  @HttpCode(204)
  @Delete(':blogId/posts/:postId')
  async deletePostById(
    @CurrentUser('id') currentUserId: string,
    @Param('blogId') blogId: string,
    @Param('postId') postId: string,
  ) {
    await this.postsService.deletePostById(blogId, postId, currentUserId);
  }

  @Get('comments')
  async getAllCommentsForAllPostsOfCurrentUser(
    @Query() commentPaginationQuery: CommentsPaginationOptions,
    @CurrentUser('id') currentUserId: string,
  ) {
    const allUsersPosts =
      await this.blogsQueryRepository.findAllPostsForAllBlogsOfCurrentUser(
        currentUserId,
      );

    const paginator = new CommentsPaginationOptions(commentPaginationQuery);
    const comments = await this.commentsQueryRepo.findAllCommentsForPosts(
      allUsersPosts,
      paginator,
    );
    return comments;
  }
}
