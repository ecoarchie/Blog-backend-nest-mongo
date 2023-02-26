import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from '../comment-schema';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private commentsModel: Model<CommentDocument>,
  ) {}

  async deleteAllComments() {
    return this.commentsModel.deleteMany({});
  }

  async createComment(content: string): Promise<CommentDocument['id']> {
    const newComment = new this.commentsModel({ content });
    return this.saveComment(newComment);
  }
  async saveComment(
    newComment: CommentDocument,
  ): Promise<CommentDocument['id']> {
    const result = await newComment.save();
    return result.id as string;
  }
}
