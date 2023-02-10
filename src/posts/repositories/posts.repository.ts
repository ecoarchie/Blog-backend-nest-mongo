import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../post-schema';

@Injectable()
export class PostsRepository {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}
  async savePost(post: PostDocument): Promise<PostDocument['_id']> {
    const result = await post.save();
    return result.id;
  }

  async findPostById(postId: Types.ObjectId) {
    if (!Types.ObjectId.isValid(postId)) return null;
    return this.postModel.findById(postId).exec();
  }
}
