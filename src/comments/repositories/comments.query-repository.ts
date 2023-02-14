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
    const postDocument = await this.commentModel.findById(commentId).lean();
    if (!postDocument) return null;
    return this.toCommentDto(postDocument);
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
