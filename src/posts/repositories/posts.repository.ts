import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogsRepository } from '../../blogs/repositories/blogs.repository';
import {
  BlogPost,
  CreatePostWithBlogIdDto,
  PostDocument,
} from '../post-schema';

@Injectable()
export class PostsRepository {
  constructor(
    private blogsRepository: BlogsRepository,
    @InjectModel(BlogPost.name) private postModel: Model<PostDocument>,
  ) {}
  async savePost(post: PostDocument): Promise<PostDocument['id']> {
    const result = await post.save();
    return result.id as string;
  }

  async findPostById(postId: string) {
    if (!Types.ObjectId.isValid(postId)) return null;
    return this.postModel.findById(postId).exec();
  }

  async createPost(postDto: CreatePostWithBlogIdDto) {
    const blog = await this.blogsRepository.findBlogById(postDto.blogId);
    const newPost = new this.postModel({ ...postDto, blogName: blog.name });
    const postId = await this.savePost(newPost);
    return postId as string;
  }

  async deleteAllPosts() {
    return this.postModel.deleteMany({});
  }
}
