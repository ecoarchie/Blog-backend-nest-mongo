import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { BlogPost, PostSchema } from 'src/posts/post-schema';
import { PostsModule } from 'src/posts/posts.module';
import { Blog, BlogSchema } from './blog-schema';
import { BlogsController } from './controllers/blogs.controller';
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
export class BlogsModule {}
