import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogPost, CreatePostDto, PostDocument } from '../../posts/post-schema';
import { PostsRepository } from '../../posts/repositories/posts.repository';
import {
  Blog,
  BlogDocument,
  CreateBlogDto,
  UpdateBlogDto,
} from '../blog-schema';
import { BlogsRepository } from '../repositories/blogs.repository';

@Injectable()
export class BlogsService {
  constructor(
    private blogsRepository: BlogsRepository,
    private postsRepository: PostsRepository,
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(BlogPost.name) private postModel: Model<PostDocument>,
  ) {}

  async createNewBlog(dto: CreateBlogDto, currentUserId: string) {
    const newBlog = new this.blogModel({
      ...dto,
      ownerId: new Types.ObjectId(currentUserId),
    });
    const blogId = await this.blogsRepository.saveBlog(newBlog);
    return blogId;
  }

  async updateBlog(
    currentUserId: string,
    blogId: string,
    updateBlogDto: UpdateBlogDto,
  ): Promise<void> {
    const blog = await this.blogsRepository.findBlogById(blogId);
    if (!blog) throw new NotFoundException();
    if (!blog.ownerInfo.userId.equals(currentUserId))
      throw new ForbiddenException();

    blog.setName(updateBlogDto.name);
    blog.setDescription(updateBlogDto.description);
    blog.setWebsiteUrl(updateBlogDto.websiteUrl);
    await this.blogsRepository.saveBlog(blog);
  }

  async createBlogPost(
    blogId: string,
    createPostDto: CreatePostDto,
    currentUserId: string,
  ): Promise<PostDocument['id']> {
    if (!Types.ObjectId.isValid(blogId)) return null; //TODO make with class validator
    const blog = await this.blogsRepository.findBlogById(blogId);
    if (!blog) throw new NotFoundException();
    if (!blog.ownerInfo.userId.equals(currentUserId))
      throw new ForbiddenException();

    const newPost = new this.postModel({
      ...createPostDto,
      blogId: blog._id,
      blogName: blog.name,
    });
    const newPostId = await this.postsRepository.savePost(newPost);
    return newPostId.toString();
  }

  async deletePostsOfDeletedBlog(blogId: string): Promise<void> {
    await this.postModel.deleteMany({ blogId: new Types.ObjectId(blogId) });
  }
}
