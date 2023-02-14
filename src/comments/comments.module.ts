import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './comment-schema';
import { CommentsController } from './controllers/comments.controller';
import { CommentsQueryRepository } from './repositories/comments.query-repository';
import { CommentsRepository } from './repositories/comments.repository';
import { CommentsService } from './services/comments.services';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Comment.name,
        schema: CommentSchema,
      },
    ]),
  ],
  exports: [CommentsRepository],
  controllers: [CommentsController],
  providers: [CommentsRepository, CommentsQueryRepository, CommentsService],
})
export class CommentsModule {}
