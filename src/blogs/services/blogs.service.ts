import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BlogPost, CreatePostDto, PostDocument } from '../../posts/post-schema';
import { PostsRepository } from '../../posts/repositories/posts.repository';
import { UsersQueryRepository } from '../../users/repositories/users.query-repository';
import { BanUserByBloggerDto } from '../../users/user-schema';
import {
  BanBlogDto,
  Blog,
  BlogDocument,
  BlogOwnerInfo,
  CreateBlogDto,
  UpdateBlogDto,
} from '../blog-schema';
import { BlogsRepository } from '../repositories/blogs.repository';

@Injectable()
export class BlogsService {
  constructor(
    private blogsRepository: BlogsRepository,
    private postsRepository: PostsRepository,
    private usersQueryRepo: UsersQueryRepository,
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(BlogPost.name) private postModel: Model<PostDocument>,
  ) {}

  async createNewBlog(dto: CreateBlogDto, ownerInfo: BlogOwnerInfo) {
    const newBlog = new this.blogModel({
      ...dto,
      ownerInfo,
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
    await this.postModel.updateMany(
      { blogId: new Types.ObjectId(blogId) },
      { blogName: updateBlogDto.name },
    );
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

  async bindBlogToUser(blogId: string, userId: string): Promise<void> {
    const blog = await this.blogsRepository.findBlogById(blogId);
    if (!blog || blog?.ownerInfo?.userId)
      throw new BadRequestException({
        message: 'Blog does not exist or is already bound',
        field: 'blodId',
      });

    const userLogin = await this.usersQueryRepo.getUserLoginById(userId);
    if (!userLogin) {
      throw new BadRequestException({
        message: 'User with passed Id does not exist',
        field: 'userId',
      });
    }
    blog.bindToUser(userId, userLogin);
    await this.blogsRepository.saveBlog(blog);
  }

  async isUserBannedForCurrentBlog(
    blogId: string,
    userId: string,
  ): Promise<boolean> {
    const blog = await this.blogModel.findById(blogId);
    const bannedUser = blog.getBannedUsers().find((u) => {
      return u.id.toString() === userId && u.banInfo.isBanned;
    });
    return bannedUser ? true : false;
  }

  async isBlogBanned(blogId: string): Promise<boolean> {
    const blog = await this.blogModel.findById(blogId).lean();
    return blog.banInfo.isBanned;
  }

  async banUserByBlogger(
    ownerId: string,
    userId: string,
    banUserByBloggerDto: BanUserByBloggerDto,
  ) {
    const blog = await this.blogModel.findById(banUserByBloggerDto.blogId);
    if (!blog)
      throw new BadRequestException({
        field: 'blogId',
        message: 'blog with this ID not found',
      });

    if (blog.ownerInfo.userId.toString() !== ownerId)
      throw new ForbiddenException();

    const user = await this.usersQueryRepo.findUserById(userId);
    blog.addUserToBanList(userId, user.login, {
      isBanned: banUserByBloggerDto.isBanned,
      banReason: banUserByBloggerDto.banReason,
      banDate: new Date(),
    });
    await this.blogsRepository.saveBlog(blog);
  }

  async banBlog(blogId: string, banBlogDto: BanBlogDto) {
    const blog = await this.blogModel.findById(blogId);
    if (!blog)
      throw new BadRequestException({
        field: 'blogId',
        message: 'blog with such id does not exist',
      });
    blog.banOrUnban(banBlogDto);
    await this.blogsRepository.saveBlog(blog);
  }
  // async findAllBannedUsersForBlog(
  //   blogId: string,
  //   paginationOptions: BannedUserPaginatorOptions,
  // ) {
  //   const blog = await this.blogModel.findById(blogId);
  //   //TODO check 500 error than blog id is invalid
  //   if (!blog)
  //     throw new BadRequestException({
  //       field: 'blogId',
  //       message: 'blog with this ID not found',
  //     });

  //   return blog.getBannedUsers();
  // }
}
