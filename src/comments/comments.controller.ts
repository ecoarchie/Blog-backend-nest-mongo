import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { CommentsService } from './comments.services';
import { CommentsQueryRepository } from './repositories/comments.query-repository';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly commentsService: CommentsService,
  ) {}

  @Get(':commentId')
  async getCommentById(
    @Param('commentId') commentId: string,
    @Res() res: Response,
  ) {
    const commentFound = await this.commentsQueryRepository.findCommentById(
      commentId,
    );
    if (!commentFound) return res.sendStatus(404);
    return commentFound;
  }
}
