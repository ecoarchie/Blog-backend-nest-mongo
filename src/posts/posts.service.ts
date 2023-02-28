import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogsRepository } from '../blogs/repositories/blogs.repository';
import { LikeReaction } from '../comments/like.schema';
import {
  BlogPost,
  CreatePostWithBlogIdDto,
  PostDocument,
  UpdatePostWithoutBlogIdDto,
} from './post-schema';
import { PostsRepository } from './repositories/posts.repository';

@Injectable()
export class PostsService {
  constructor(
    private postsRepository: PostsRepository,
    private blogsRepository: BlogsRepository,
    @InjectModel(BlogPost.name) private postModel: Model<PostDocument>,
  ) {}

  async createNewPost(postDto: CreatePostWithBlogIdDto) {
    const postId = await this.postsRepository.createPost(postDto);
    return postId.toString();
  }

  async updatePostById(
    blogId: string,
    postId: string,
    updatePostDto: UpdatePostWithoutBlogIdDto,
    currentUserId: string,
  ): Promise<PostDocument['id']> {
    const blog = await this.blogsRepository.findBlogById(blogId);
    const post = await this.postsRepository.findPostById(postId);
    if (!blog || !post) throw new NotFoundException();
    if (!blog.ownerInfo.userId.equals(currentUserId))
      throw new ForbiddenException();

    if (post.blogId.toString() !== blogId)
      throw new BadRequestException({
        message: 'Wrong blogId',
        field: 'blogId',
      });

    post.setTitle(updatePostDto.title);
    post.setDescription(updatePostDto.shortDescription);
    post.setContent(updatePostDto.content);
    return this.postsRepository.savePost(post);
  }

  async reactToPost(
    userId: string,
    userLogin: string,
    postId: string,
    likeStatus: LikeReaction,
  ) {
    const post = await this.postsRepository.findPostById(postId);
    if (!post) throw new NotFoundException();
    post.makeReaction(likeStatus, userId, userLogin);
    await this.postsRepository.savePost(post);
  }

  async deletePostById(blogId: string, postId: string, currentUserId: string) {
    const blog = await this.blogsRepository.findBlogById(blogId);
    const post = await this.postsRepository.findPostById(postId);
    if (!blog || !post) throw new NotFoundException();
    if (!blog.ownerInfo.userId.equals(currentUserId))
      throw new ForbiddenException();

    await this.postsRepository.deletePostById(post.id);
  }
}
