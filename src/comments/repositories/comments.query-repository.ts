import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';
import { Comment, CommentDocument } from '../comment-schema';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async findCommentById(commentId: string) {
    if (!Types.ObjectId.isValid(commentId)) return null;
    const commentDocument = await this.commentModel.findById(commentId).lean();
    if (!commentDocument) return null;
    return this.toCommentDto(commentDocument);
  }

  private toCommentDto(commentDoc: LeanDocument<CommentDocument>) {
    return {
      id: commentDoc.id,
      content: commentDoc.content,
      commentatorInfo: {
        userId: commentDoc.commentatorInfo.userId,
        userLogin: commentDoc.commentatorInfo.userLogin,
      },
      createdAt: commentDoc.createdAt,
      likesInfo: {
        likesCount: commentDoc.likesInfo.likesCount,
        dislikesCount: commentDoc.likesInfo.dislikesCount,
        myStatus: commentDoc.likesInfo.myStatus,
      },
    };
  }
}
