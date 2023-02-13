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
} from '@nestjs/common';
import { Response } from 'express';
import {
  CreatePostWithBlogIdDto,
  BlogPost,
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
    return postFound;
  }

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

  @Delete(':postId')
  async deletePostById(@Param('postId') postId: string, @Res() res: Response) {
    const isPostDeleted = await this.postsQueryRepository.deletePostById(
      postId,
    );
    if (!isPostDeleted) return res.sendStatus(404);
    return res.sendStatus(204);
  }
}
