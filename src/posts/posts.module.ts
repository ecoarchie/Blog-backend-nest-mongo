import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { BlogsModule } from 'src/blogs/blogs.module';
import { CommentsModule } from 'src/comments/comments.module';
import { UserModule } from 'src/users/users.module';
import { PostsController } from './controllers/posts.controller';
import { BlogPost, PostSchema } from './post-schema';
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
export class PostsModule {}
