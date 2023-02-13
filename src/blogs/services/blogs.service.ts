import { Injectable } from '@nestjs/common';
import {
  Blog,
  BlogDocument,
  CreateBlogDto,
  UpdateBlogDto,
} from '../blog-schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { BlogsRepository } from '../repositories/blogs.repository';
import { CreatePostDto, BlogPost, PostDocument } from 'src/posts/post-schema';
import { PostsRepository } from 'src/posts/repositories/posts.repository';

@Injectable()
export class BlogsService {
  constructor(
    private blogsRepository: BlogsRepository,
    private postsRepository: PostsRepository,
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(BlogPost.name) private postModel: Model<PostDocument>,
  ) {}

  async createNewBlog(dto: CreateBlogDto) {
    const newBlog = new this.blogModel(dto);
    const blogId = await this.blogsRepository.saveBlog(newBlog);
    return blogId;
  }

  async updateBlog(
    blogId: string,
    updateBlogDto: UpdateBlogDto,
  ): Promise<BlogDocument['_id']> {
    const blog = await this.blogsRepository.findBlogById(blogId);
    if (!blog) return null;

    blog.setName(updateBlogDto.name);
    blog.setDescription(updateBlogDto.description);
    blog.setWebsiteUrl(updateBlogDto.websiteUrl);
    return this.blogsRepository.saveBlog(blog);
  }

  async createBlogPost(
    blogId: string,
    createPostDto: CreatePostDto,
  ): Promise<PostDocument['id']> {
    if (!Types.ObjectId.isValid(blogId)) return null; //TODO make with class validator
    const blog = await this.blogsRepository.findBlogById(blogId);
    if (!blog) return null;

    const newPost = new this.postModel({
      ...createPostDto,
      blogId: blog._id,
      blogName: blog.name,
    });
    const newPostId = await this.postsRepository.savePost(newPost);
    return newPostId.toString();
  }
}
