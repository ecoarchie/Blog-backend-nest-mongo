import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model, Types } from 'mongoose';
import { BlogPost, PostDocument, PostPaginatorOptions } from '../post-schema';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(BlogPost.name) private postModel: Model<PostDocument>,
  ) {}
  async savePost(post: PostDocument): Promise<PostDocument['_id']> {
    const result = await post.save();
    return result.id;
  }

  async findPostById(postId: Types.ObjectId) {
    if (!Types.ObjectId.isValid(postId)) return null;
    const postDocument = await this.postModel.findById(postId).lean();
    return this.toPostDto(postDocument);
  }

  async findAllPostsForBlog(
    blogId: string,
    paginatorOptions: PostPaginatorOptions,
  ) {
    const result = await this.postModel
      .find({ blogId: new Types.ObjectId(blogId) })
      .limit(paginatorOptions.pageSize)
      .skip(paginatorOptions.skip)
      .sort([[paginatorOptions.sortBy, paginatorOptions.sortDirection]])
      .lean();
    const totalCount = result.length;
    const pagesCount = Math.ceil(totalCount / paginatorOptions.pageSize);
    return {
      pagesCount,
      page: paginatorOptions.pageNumber,
      pageSize: paginatorOptions.pageSize,
      totalCount,
      items: result.map(this.toPostDto),
    };
  }

  async findAll(paginatorOptions: PostPaginatorOptions) {
    const result = await this.postModel
      .find()
      .limit(paginatorOptions.pageSize)
      .skip(paginatorOptions.skip)
      .sort([[paginatorOptions.sortBy, paginatorOptions.sortDirection]])
      .lean();

    const totalCount = result.length;
    const pagesCount = Math.ceil(totalCount / paginatorOptions.pageSize);
    return {
      pagesCount,
      page: paginatorOptions.pageNumber,
      pageSize: paginatorOptions.pageSize,
      totalCount,
      items: result.map(this.toPostDto),
    };
  }

  private toPostDto(post: LeanDocument<PostDocument>) {
    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: post.extendedLikesInfo.likesCount,
        dislikesCount: post.extendedLikesInfo.dislikesCount,
        newestLikes: post.extendedLikesInfo.newestLikes,
      },
    };
  }
}
