import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogsRepository } from 'src/blogs/repositories/blogs.repository';
import { BlogPost, CreatePostWithBlogId, PostDocument } from '../post-schema';

@Injectable()
export class PostsRepository {
  constructor(
    private blogsRepository: BlogsRepository,
    @InjectModel(BlogPost.name) private postModel: Model<PostDocument>,
  ) {}
  async savePost(post: PostDocument): Promise<PostDocument['_id']> {
    const result = await post.save();
    return result.id;
  }

  async findPostById(postId: Types.ObjectId) {
    if (!Types.ObjectId.isValid(postId)) return null;
    return this.postModel.findById(postId).exec();
  }

  async createPost(postDto: CreatePostWithBlogId) {
    const blog = await this.blogsRepository.findBlogById(postDto.blogId);
    const newPost = new this.postModel({ ...postDto, blogName: blog.name });
    const postId = await this.savePost(newPost);
    return postId;
  }
}
