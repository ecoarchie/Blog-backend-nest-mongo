import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './comment-schema';
import { CommentsRepository } from './repositories/comments.repository';

@Injectable()
export class CommentsService {
  constructor(
    private commentsRepository: CommentsRepository,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async createComment(
    content: string,
    postId: string,
    commentatorId: string,
    commentatorLogin: string,
  ): Promise<CommentDocument['id']> {
    const commentId = await this.commentsRepository.createComment(
      content,
      postId,
      commentatorId,
      commentatorLogin,
    );
    return commentId;
  }

  async deleteCommentById(commentId: string, userId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException();

    if (comment.commentatorInfo.userId.toString() !== userId)
      throw new ForbiddenException();

    this.commentsRepository.deleteCommentById(commentId);
  }
}
