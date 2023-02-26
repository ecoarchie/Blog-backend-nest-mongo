import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { BasicAuthGuard } from 'src/auth/guards/basic.auth.guard';
import { BearerAuthGuard } from 'src/auth/guards/bearer.auth.guard';
import { CreateCommentDto } from 'src/comments/comment-schema';
import { CommentsQueryRepository } from 'src/comments/repositories/comments.query-repository';
import { CommentsService } from 'src/comments/services/comments.services';
import {
  BlogPost,
  CreatePostWithBlogIdDto,
  PostPaginatorOptions,
  PostsPagination,
  UpdatePostDto,
} from '../post-schema';
import { PostsQueryRepository } from '../repositories/posts.query-repository';
import { PostsService } from '../services/posts.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly postService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly commentsQueryRepo: CommentsQueryRepository,
  ) {}

  @Get()
  async findAllPosts(
    @Query() postsPaginatorQuery: PostPaginatorOptions,
  ): Promise<PostsPagination> {
    const postsPaginatorOptions = new PostPaginatorOptions(postsPaginatorQuery);
    const posts = await this.postsQueryRepository.findAll(
      postsPaginatorOptions,
    );
    return posts;
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async createPost(
    @Body() postDto: CreatePostWithBlogIdDto,
  ): Promise<Partial<BlogPost>> {
    const newPostId = await this.postService.createNewPost(postDto);
    return this.postsQueryRepository.findPostById(newPostId);
  }

  @Get(':postId')
  async getPostById(@Param('postId') postId: string, @Res() res: Response) {
    const postFound = await this.postsQueryRepository.findPostById(postId);
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
    //TODO why we need blogId in postImputModel?
    const result = await this.postService.updatePostById(postId, updatePostDto);
    if (!result) return res.sendStatus(404);
    else res.sendStatus(204);
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
  ) {
    const isPostExist = await this.postsQueryRepository.findPostById(postId);
    if (!isPostExist) return res.sendStatus(404);

    const newCommentId = await this.commentsService.createComment(
      createCommentDto.content,
    );
    return this.commentsQueryRepo.findCommentById(newCommentId);
  }
}
