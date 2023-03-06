import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';
import { PostDocument } from '../../posts/post-schema';
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
    const commentDocument = await this.commentModel
      .findOne()
      .and([
        { _id: new Types.ObjectId(commentId) },
        { 'commentatorInfo.isBanned': false },
      ])
      .lean();
    if (!commentDocument) return null;
    return this.toCommentDtoWithMyLikeStatus(commentDocument, userId);
  }

  async findCommentsDtoForPost(
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
        likesCount: commentDoc.likesInfo.userLikes.filter(
          (l) => l.reaction === 'Like' && !l.isBanned,
        ).length,
        dislikesCount: commentDoc.likesInfo.userLikes.filter(
          (l) => l.reaction === 'Dislike' && !l.isBanned,
        ).length,
        myStatus:
          commentDoc.likesInfo.userLikes.find(
            (u) => u.userId.toString() === userId,
          )?.reaction || 'None',
      },
    };
  }

  async findAllCommentsForPosts(
    posts: LeanDocument<PostDocument[]>,
    paginator: CommentsPaginationOptions,
  ) {
    const postsIds = posts.map((p) => p._id);
    const comments = await this.commentModel
      .find()
      .where('postId')
      .in(postsIds)
      .limit(paginator.pageSize)
      .skip(paginator.skip)
      .sort([[paginator.sortBy, paginator.sortDirection]])
      .lean();

    const totalCount = await this.commentModel.count().where('postId').in(postsIds);
    const pagesCount = Math.ceil(totalCount / paginator.pageSize);
    const items = comments.map((c) => {
      const cPost = posts.find((p) => p._id.toString() === c.postId.toString());
      return {
        id: c.id,
        content: c.content,
        commentatorInfo: {
          userId: c.commentatorInfo.userId,
          userLogin: c.commentatorInfo.userLogin,
        },
        createdAt: c.createdAt,
        postInfo: {
          id: c.postId,
          title: cPost.title,
          blogId: cPost.blogId,
          blogName: cPost.blogName,
        },
      };
    });

    return {
      pagesCount,
      page: paginator.pageNumber,
      pageSize: paginator.pageSize,
      totalCount,
      items: items,
    };
  }
}
