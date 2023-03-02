import {
  Controller,
  Get,
  HttpCode,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BasicAuthGuard } from '../../auth/guards/basic.auth.guard';
import {
  BindToBlogDto,
  BlogPaginatorOptions,
  BlogsPagination,
} from '../blog-schema';
import { BlogsQueryRepository } from '../repositories/blogs.query-repository';
import { BlogsService } from '../services/blogs.service';

@UseGuards(BasicAuthGuard)
@Controller('sa/blogs')
export class SuperUserBlogsController {
  constructor(
    private blogsService: BlogsService,
    private blogsQueryRepo: BlogsQueryRepository,
  ) {}

  @HttpCode(204)
  @Put(':blogId/bind-with-user/:userId')
  async bindBlogWithUser(@Param() bindData: BindToBlogDto) {
    await this.blogsService.bindBlogToUser(bindData.blogId, bindData.userId);
  }

  @Get()
  async findAllBlogsWithOwnerInfo(
    @Query() blogsPaginatorQuery: BlogPaginatorOptions,
  ): Promise<BlogsPagination> {
    const blogsPaginatorOptions = new BlogPaginatorOptions(blogsPaginatorQuery);
    const blogs = await this.blogsQueryRepo.findAllBlogsWithOwnerInfo(
      blogsPaginatorOptions,
    );
    return blogs;
  }
}
