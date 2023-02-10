import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogPost, CreatePostWithBlogId, PostDocument } from '../post-schema';
import { PostsRepository } from '../repositories/posts.repository';

@Injectable()
export class PostsService {
  constructor(
    private postsRepository: PostsRepository,
    @InjectModel(BlogPost.name) private postModel: Model<PostDocument>,
  ) {}

  async createNewPost(postDto: CreatePostWithBlogId) {
    const postId = await this.postsRepository.createPost(postDto);
    return postId;
  }
}
