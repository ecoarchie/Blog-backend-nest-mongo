import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BlogsModule } from '../blogs/blogs.module';
import { CommentsModule } from '../comments/comments.module';
import { AccessTokenValidationMiddleware } from '../middlewares/accessTokenCkeck.middleware';
import { UserModule } from '../users/users.module';
import { BlogPost, PostSchema } from './post-schema';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PostsQueryRepository } from './repositories/posts.query-repository';
import { PostsRepository } from './repositories/posts.repository';

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
  exports: [PostsRepository, PostsQueryRepository, PostsService],
  controllers: [PostsController],
  providers: [
    PostsRepository,
    PostsQueryRepository,
    PostsService,
    // IsBlogExistsConstraint,
  ],
})
export class PostsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AccessTokenValidationMiddleware)
      .exclude(
        { path: 'posts', method: RequestMethod.POST },
        { path: 'posts/:id', method: RequestMethod.DELETE },
        { path: 'posts/:postId/comments', method: RequestMethod.POST },
        { path: 'posts/:postId/like-status', method: RequestMethod.PUT },
      )
      .forRoutes(PostsController);
  }
}
