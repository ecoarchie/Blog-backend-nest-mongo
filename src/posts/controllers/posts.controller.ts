import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  CreatePostWithBlogId,
  BlogPost,
  PostPaginatorOptions,
  PostsPagination,
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
    @Body() postDto: CreatePostWithBlogId,
  ): Promise<Partial<BlogPost>> {
    const newPostId = await this.postService.createNewPost(postDto);
    return this.postsQueryRepository.findPostById(newPostId);
  }
}
