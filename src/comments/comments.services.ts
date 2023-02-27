import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './comment-schema';
import { LikeReaction } from './like.schema';
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

  async updateCommentById(commentId: string, content: string, userId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException();

    if (comment.commentatorInfo.userId.toString() !== userId)
      throw new ForbiddenException();

    comment.updateContent(content);
    await this.commentsRepository.saveComment(comment);
  }

  async deleteCommentById(commentId: string, userId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException();

    if (comment.commentatorInfo.userId.toString() !== userId)
      throw new ForbiddenException();

    this.commentsRepository.deleteCommentById(commentId);
  }

  async reactToComment(
    userId: string,
    userLogin: string,
    commentId: string,
    likeStatus: LikeReaction,
  ) {
    const comment = await this.commentsRepository.findCommentById(
      commentId,
      userId,
    );
    if (!comment) throw new NotFoundException();
    comment.makeReaction(likeStatus, userId, userLogin);
    await this.commentsRepository.saveComment(comment);
  }
}
