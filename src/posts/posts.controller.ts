import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { BasicAuthGuard } from '../auth/guards/basic.auth.guard';
import { BearerAuthGuard } from '../auth/guards/bearer.auth.guard';
import { BlogsService } from '../blogs/services/blogs.service';
import {
  CommentsPaginationOptions,
  CreateCommentDto,
} from '../comments/comment-schema';
import { CommentsService } from '../comments/comments.services';
import { LikeInputDto } from '../comments/like.schema';
import { CommentsQueryRepository } from '../comments/repositories/comments.query-repository';
import { CurrentUserReq } from '../users/user-schema';
import { CurrentUser } from '../utils/current-user.param.decorator';
import { CreatePostWithBlogIdDto, PostPaginatorOptions } from './post-schema';
import { PostsService } from './posts.service';
import { PostsQueryRepository } from './repositories/posts.query-repository';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly commentsQueryRepo: CommentsQueryRepository,
    private readonly blogsService: BlogsService,
  ) {}

  @Get()
  async findAllPosts(
    @Query() postsPaginatorQuery: PostPaginatorOptions,
    @CurrentUser('id') currentUserId: string,
    @Res() res: Response,
  ) {
    const postsPaginatorOptions = new PostPaginatorOptions(postsPaginatorQuery);
    const posts = await this.postsQueryRepository.findAll(
      currentUserId,
      postsPaginatorOptions,
    );
    return res.send(posts);
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(@Body() postDto: CreatePostWithBlogIdDto) {
    const newPostId = await this.postService.createNewPost(postDto);
    return this.postsQueryRepository.findPostById(newPostId, null);
  }

  @Get(':postId')
  async getPostById(
    @Param('postId') postId: string,
    @CurrentUser('id') currentUserId: string,
    @Res() res: Response,
  ) {
    const postFound = await this.postsQueryRepository.findPostById(
      postId,
      currentUserId,
    );
    if (!postFound) return res.sendStatus(404);
    const isBlogBanned = await this.blogsService.isBlogBanned(postFound.blogId.toString())
    if(isBlogBanned) return res.status(404);
    res.status(200).send(postFound);
  }

  // @UseGuards(BasicAuthGuard)
  // @Put(':postId')
  // async updatePostById(
  //   @Param('postId') postId: string,
  //   @Body() updatePostDto: UpdatePostDto,
  //   @Res() res: Response,
  // ) {
  //   await this.postService.updatePostById(postId, updatePostDto);
  //   res.sendStatus(204);
  // }

  @UseGuards(BasicAuthGuard)
  @Delete(':postId')
  async deletePostById(@Param('postId') postId: string, @Res() res: Response) {
    const isPostDeleted = await this.postsQueryRepository.deletePostById(
      postId,
    );
    if (!isPostDeleted) return res.sendStatus(404);
    return res.sendStatus(204);
  }

  @UseGuards(BearerAuthGuard)
  @Post(':postId/comments')
  async createComment(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() currentUser: CurrentUserReq,
    @Res() res: Response,
  ) {
    const isPostExist = await this.postsQueryRepository.findPostById(
      postId,
      currentUser.id,
    );
    if (!isPostExist) throw new NotFoundException();

    const isUserBanned = await this.blogsService.isUserBannedForCurrentBlog(
      isPostExist.blogId.toString(),
      currentUser.id,
    );

    if (isUserBanned) throw new ForbiddenException();

    const newCommentId = await this.commentsService.createComment(
      createCommentDto.content,
      postId,
      currentUser.id,
      currentUser.login,
    );
    res.send(await this.commentsQueryRepo.findCommentById(newCommentId, null));
  }

  @Get(':postId/comments')
  async getCommentsForPost(
    @Param('postId') postId: string,
    @Query() commentsPaginator: CommentsPaginationOptions,
    @CurrentUser('id') currentUserId: string,
    @Res() res: Response,
  ) {
    const isPostExist = await this.postsQueryRepository.findPostById(
      postId,
      currentUserId,
    );
    if (!isPostExist) throw new NotFoundException();

    const commentsPaginatorOptions = new CommentsPaginationOptions(
      commentsPaginator,
    );
    const comments = await this.commentsQueryRepo.findCommentsDtoForPost(
      currentUserId,
      postId,
      commentsPaginatorOptions,
    );
    res.send(comments);
  }

  @HttpCode(204)
  @UseGuards(BearerAuthGuard)
  @Put(':postId/like-status')
  async reactToPost(
    @Param('postId') postId: string,
    @Body() likeStatusDto: LikeInputDto,
    @CurrentUser() currentUser: CurrentUserReq,
  ) {
    await this.postService.reactToPost(
      currentUser.id,
      currentUser.login,
      postId,
      likeStatusDto.likeStatus,
    );
  }
}
