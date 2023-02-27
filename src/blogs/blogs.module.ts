import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AccessTokenValidationMiddleware } from '../middlewares/accessTokenCkeck.middleware';
import { BlogPost, PostSchema } from '../posts/post-schema';
import { PostsModule } from '../posts/posts.module';
import { Blog, BlogSchema } from './blog-schema';
import { BlogsController } from './blogs.controller';
import { BlogsQueryRepository } from './repositories/blogs.query-repository';
import { BlogsRepository } from './repositories/blogs.repository';
import { BlogsService } from './services/blogs.service';

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
  controllers: [BlogsController],
  providers: [BlogsService, BlogsRepository, BlogsQueryRepository],
})
export class BlogsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AccessTokenValidationMiddleware).forRoutes(BlogsController);
  }
}
