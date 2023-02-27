import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AccessTokenValidationMiddleware } from '../middlewares/accessTokenCkeck.middleware';
import { UserModule } from '../users/users.module';
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
    AuthModule,
    UserModule,
  ],
  exports: [CommentsRepository, CommentsQueryRepository, CommentsService],
  controllers: [CommentsController],
  providers: [CommentsRepository, CommentsQueryRepository, CommentsService],
})
export class CommentsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AccessTokenValidationMiddleware)
      .forRoutes(CommentsController);
  }
}
