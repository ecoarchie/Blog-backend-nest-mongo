import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';
import {
  Comment,
  CommentDocument,
  CommentsPaginationOptions,
} from '../comment-schema';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async findCommentById(commentId: string, userId: string) {
    if (!Types.ObjectId.isValid(commentId)) return null;
    const commentDocument = await this.commentModel.findById(commentId).lean();
    if (!commentDocument) return null;
    return this.toCommentDtoWithMyLikeStatus(commentDocument, userId);
  }

  async findCommentsForPost(
    userId: string,
    postId: string,
    paginator: CommentsPaginationOptions,
  ) {
    const result = await this.commentModel
      .find()
      .and([
        { postId: new Types.ObjectId(postId) },
        { 'commentatorInfo.isBanned': false },
      ])
      .limit(paginator.pageSize)
      .skip(paginator.skip)
      .sort([[paginator.sortBy, paginator.sortDirection]])
      .lean();

    const totalCount = result.length;
    const pagesCount = Math.ceil(totalCount / paginator.pageSize);
    return {
      pagesCount,
      page: paginator.pageNumber,
      pageSize: paginator.pageSize,
      totalCount,
      items: result.map((c) => {
        return this.toCommentDtoWithMyLikeStatus(c, userId);
      }),
    };
  }

  async countAllCommentsForPost(postId: string) {
    return this.commentModel.count({ postId: new Types.ObjectId(postId) });
  }

  private toCommentDtoWithMyLikeStatus(
    commentDoc: LeanDocument<CommentDocument>,
    userId: string,
  ) {
    return {
      id: commentDoc._id,
      content: commentDoc.content,
      commentatorInfo: {
        userId: commentDoc.commentatorInfo.userId,
        userLogin: commentDoc.commentatorInfo.userLogin,
      },
      createdAt: commentDoc.createdAt,
      likesInfo: {
        likesCount: commentDoc.likesInfo.likesCount,
        dislikesCount: commentDoc.likesInfo.dislikesCount,
        myStatus:
          commentDoc.likesInfo.userLikes.find(
            (u) => u.userId.toString() === userId,
          )?.reaction || 'None',
      },
    };
  }
}
