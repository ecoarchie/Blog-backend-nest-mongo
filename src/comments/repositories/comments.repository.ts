import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from '../comment-schema';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private commentsModel: Model<CommentDocument>,
  ) {}

  async deleteAllComments() {
    return this.commentsModel.deleteMany({});
  }

  async createComment(
    content: string,
    commentatorId: string,
    commentatorLogin: string,
  ): Promise<CommentDocument['id']> {
    const newComment = new this.commentsModel({
      content,
      commentatorInfo: {
        userId: new Types.ObjectId(commentatorId),
        userLogin: commentatorLogin,
      },
    });
    return this.saveComment(newComment);
  }

  async saveComment(
    newComment: CommentDocument,
  ): Promise<CommentDocument['id']> {
    const result = await newComment.save();
    return result.id as string;
  }
}
