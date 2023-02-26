import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './comment-schema';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.services';
import { CommentsQueryRepository } from './repositories/comments.query-repository';
import { CommentsRepository } from './repositories/comments.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Comment.name,
        schema: CommentSchema,
      },
    ]),
  ],
  exports: [CommentsRepository, CommentsQueryRepository, CommentsService],
  controllers: [CommentsController],
  providers: [CommentsRepository, CommentsQueryRepository, CommentsService],
})
export class CommentsModule {}
