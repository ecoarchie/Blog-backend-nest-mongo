import { Controller, HttpCode, Param, Put, UseGuards } from '@nestjs/common';
import { BasicAuthGuard } from '../../auth/guards/basic.auth.guard';
import { BlogsService } from '../services/blogs.service';

@Controller('sa/blogs')
@UseGuards(BasicAuthGuard)
export class SuperUserBlogsController {
  constructor(private blogsService: BlogsService) {}

  @HttpCode(204)
  @Put(':id/bind-with-user/:userId')
  async bindBlogWithUser(
    @Param('id') blogId: string,
    @Param('userId') userId: string,
  ) {
    await this.blogsService.bindBlogToUser(blogId, userId);
  }
}
