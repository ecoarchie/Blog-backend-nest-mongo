import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { BlogsModule } from 'src/blogs/blogs.module';
import { CommentsModule } from 'src/comments/comments.module';
import { AccessTokenValidationMiddleware } from 'src/middlewares/accessTokenCkeck.middleware';
import { UserModule } from 'src/users/users.module';
import { BlogPost, PostSchema } from './post-schema';
import { PostsController } from './posts.controller';
import { PostsQueryRepository } from './repositories/posts.query-repository';
import { PostsRepository } from './repositories/posts.repository';
import { PostsService } from './services/posts.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: BlogPost.name,
        schema: PostSchema,
      },
    ]),
    forwardRef(() => BlogsModule),
    AuthModule,
    CommentsModule,
    UserModule,
  ],
  exports: [PostsRepository, PostsQueryRepository],
  controllers: [PostsController],
  providers: [PostsRepository, PostsQueryRepository, PostsService],
})
export class PostsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AccessTokenValidationMiddleware)
      .exclude(
        { path: 'posts', method: RequestMethod.POST },
        { path: 'posts/:id', method: RequestMethod.DELETE },
        { path: 'posts/:postId/comments', method: RequestMethod.POST },
      )
      .forRoutes(PostsController);
  }
}
