import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogsModule } from 'src/blogs/blogs.module';
import { PostsController } from './controllers/posts.controller';
import { PostSchema, BlogPost } from './post-schema';
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
  ],
  exports: [PostsRepository, PostsQueryRepository],
  controllers: [PostsController],
  providers: [PostsRepository, PostsQueryRepository, PostsService],
})
export class PostsModule {}
