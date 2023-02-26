import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Comment,
  CommentDocument,
  CommentsPaginationOptions,
} from '../comment-schema';

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
    postId: string,
    commentatorId: string,
    commentatorLogin: string,
  ): Promise<CommentDocument['id']> {
    const newComment = new this.commentsModel({
      content,
      postId: new Types.ObjectId(postId),
      commentatorInfo: {
        userId: new Types.ObjectId(commentatorId),
        userLogin: commentatorLogin,
      },
    });
    return this.saveComment(newComment);
  }

  async findCommentsForPost(
    userId: string,
    postId: string,
    paginator: CommentsPaginationOptions,
  ) {
    const result = await this.commentsModel
      .find({ postId: new Types.ObjectId(postId) })
      .limit(paginator.pageSize)
      .skip(paginator.skip)
      .sort([[paginator.sortBy, paginator.sortDirection]]);

    const totalCount = await this.countAllCommentsForPost(postId);
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
    return this.commentsModel.count({ postId: new Types.ObjectId(postId) });
  }

  async saveComment(
    newComment: CommentDocument,
  ): Promise<CommentDocument['id']> {
    const result = await newComment.save();
    return result.id as string;
  }

  private toCommentDtoWithMyLikeStatus(
    commentDoc: CommentDocument,
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
        myStatus: commentDoc.getMyLikeStatus(userId),
      },
    };
  }
}
