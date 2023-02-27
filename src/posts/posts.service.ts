import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LikeReaction } from '../comments/like.schema';
import {
  BlogPost,
  CreatePostWithBlogIdDto,
  PostDocument,
  UpdatePostDto,
} from './post-schema';
import { PostsRepository } from './repositories/posts.repository';

@Injectable()
export class PostsService {
  constructor(
    private postsRepository: PostsRepository,
    @InjectModel(BlogPost.name) private postModel: Model<PostDocument>,
  ) {}

  async createNewPost(postDto: CreatePostWithBlogIdDto) {
    const postId = await this.postsRepository.createPost(postDto);
    return postId.toString();
  }

  async updatePostById(
    postId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostDocument['id']> {
    const post = await this.postsRepository.findPostById(postId);
    if (!post) return null;

    post.setTitle(updatePostDto.title);
    post.setDescription(updatePostDto.shortDescription);
    post.setContent(updatePostDto.content);
    return this.postsRepository.savePost(post);
  }

  async reactToPost(
    userId: string,
    userLogin: string,
    postId: string,
    likeStatus: LikeReaction,
  ) {
    const post = await this.postsRepository.findPostById(postId);
    if (!post) throw new NotFoundException();
    post.makeReaction(likeStatus, userId, userLogin);
    await this.postsRepository.savePost(post);
  }
}
