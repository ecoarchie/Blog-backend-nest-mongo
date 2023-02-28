import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AccessTokenValidationMiddleware } from '../middlewares/accessTokenCkeck.middleware';
import { BlogPost, PostSchema } from '../posts/post-schema';
import { PostsModule } from '../posts/posts.module';
import { IsBlogExistsConstraint } from '../utils/blog-id.validator';
import { Blog, BlogSchema } from './blog-schema';
import { BloggerBlogsController } from './blogger/blogs-blogger.controller';
import { BlogsController } from './public/blogs.controller';
import { BlogsQueryRepository } from './public/repositories/blogs.query-repository';
import { BlogsRepository } from './public/repositories/blogs.repository';
import { BlogsService } from './public/services/blogs.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Blog.name,
        schema: BlogSchema,
      },
      {
        name: BlogPost.name,
        schema: PostSchema,
      },
    ]),
    PostsModule,
    AuthModule,
  ],
  exports: [BlogsRepository],
  controllers: [BlogsController, BloggerBlogsController],
  providers: [
    BlogsService,
    BlogsRepository,
    BlogsQueryRepository,
    IsBlogExistsConstraint,
  ],
})
export class BlogsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AccessTokenValidationMiddleware).forRoutes(BlogsController);
  }
}
