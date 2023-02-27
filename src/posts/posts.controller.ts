import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BasicAuthGuard } from '../auth/guards/basic.auth.guard';
import { BearerAuthGuard } from '../auth/guards/bearer.auth.guard';
import {
  CommentsPaginationOptions,
  CreateCommentDto,
} from '../comments/comment-schema';
import { CommentsService } from '../comments/comments.services';
import { LikeInputDto } from '../comments/like.schema';
import { CommentsQueryRepository } from '../comments/repositories/comments.query-repository';
import { CommentsRepository } from '../comments/repositories/comments.repository';
import { UsersQueryRepository } from '../users/repositories/users.query-repository';
import {
  CreatePostWithBlogIdDto,
  PostPaginatorOptions,
  UpdatePostDto,
} from './post-schema';
import { PostsService } from './posts.service';
import { PostsQueryRepository } from './repositories/posts.query-repository';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly commentsRepository: CommentsRepository,
    private readonly commentsQueryRepo: CommentsQueryRepository,
    private readonly usersQueryRepo: UsersQueryRepository,
  ) {}

  @Get()
  async findAllPosts(
    @Query() postsPaginatorQuery: PostPaginatorOptions,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const postsPaginatorOptions = new PostPaginatorOptions(postsPaginatorQuery);
    const posts = await this.postsQueryRepository.findAll(
      req.userId,
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
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const postFound = await this.postsQueryRepository.findPostById(
      postId,
      req.userId,
    );
    if (!postFound) return res.sendStatus(404);
    res.status(200).send(postFound);
  }

  @UseGuards(BasicAuthGuard)
  @Put(':postId')
  async updatePostById(
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
    @Res() res: Response,
  ) {
    await this.postService.updatePostById(postId, updatePostDto);
    res.sendStatus(204);
  }

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
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const isPostExist = await this.postsQueryRepository.findPostById(
      postId,
      req.userId,
    );
    if (!isPostExist) return res.sendStatus(404);

    const commentatorLogin = await this.usersQueryRepo.getUserLoginById(
      req.userId,
    );
    const newCommentId = await this.commentsService.createComment(
      createCommentDto.content,
      postId,
      req.userId,
      commentatorLogin,
    );
    res.send(await this.commentsQueryRepo.findCommentById(newCommentId, null));
  }

  @Get(':postId/comments')
  async getCommentsForPost(
    @Param('postId') postId: string,
    @Query() commentsPaginator: CommentsPaginationOptions,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const isPostExist = await this.postsQueryRepository.findPostById(
      postId,
      req.userId,
    );
    if (!isPostExist) throw new NotFoundException();

    const commentsPaginatorOptions = new CommentsPaginationOptions(
      commentsPaginator,
    );
    const comments = await this.commentsQueryRepo.findCommentsForPost(
      req.userId,
      postId,
      commentsPaginatorOptions,
    );
    res.send(comments);
  }

  @UseGuards(BearerAuthGuard)
  @Put(':postId/like-status')
  async reactToPost(
    @Param('postId') postId: string,
    @Body() likeStatusDto: LikeInputDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userLogin = await this.usersQueryRepo.getUserLoginById(req.userId);
    await this.postService.reactToPost(
      req.userId,
      userLogin,
      postId,
      likeStatusDto.likeStatus,
    );
    res.sendStatus(204);
  }
}
