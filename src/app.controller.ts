import { Controller, Delete, HttpCode } from '@nestjs/common';
import { BlogsRepository } from './blogs/public/repositories/blogs.repository';
import { CommentsRepository } from './comments/repositories/comments.repository';
import { PostsRepository } from './posts/repositories/posts.repository';
import { UsersRepository } from './users/repositories/users.repository';

@Controller()
export class AppController {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly commentsRepository: CommentsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  @HttpCode(204)
  @Delete('testing/all-data')
  async deleteAllData() {
    await this.blogsRepository.deleteAllBlogs();
    await this.postsRepository.deleteAllPosts();
    await this.commentsRepository.deleteAllComments();
    await this.usersRepository.deleteAllUsers();
    await this.usersRepository.deleteAllSessions();
  }
}
