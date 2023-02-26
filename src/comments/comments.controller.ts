import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BearerAuthGuard } from 'src/auth/guards/bearer.auth.guard';
import { UsersQueryRepository } from 'src/users/repositories/users.query-repository';
import { UpdateCommentDto } from './comment-schema';
import { CommentsService } from './comments.services';
import { LikeInputDto } from './like.schema';
import { CommentsQueryRepository } from './repositories/comments.query-repository';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsQueryRepository: CommentsQueryRepository,
    private readonly commentsService: CommentsService,
    private readonly usersQueryRepo: UsersQueryRepository,
  ) {}

  @Get(':commentId')
  async getCommentById(
    @Param('commentId') commentId: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const commentFound = await this.commentsQueryRepository.findCommentById(
      commentId,
      req.userId,
    );
    if (!commentFound) return res.sendStatus(404);
    return res.send(commentFound);
  }

  @HttpCode(204)
  @UseGuards(BearerAuthGuard)
  @Delete(':commentId')
  async deleteCommentById(
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ) {
    await this.commentsService.deleteCommentById(commentId, req.userId);
  }

  @HttpCode(204)
  @UseGuards(BearerAuthGuard)
  @Put(':commentId')
  async updateCommentById(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: Request,
  ) {
    await this.commentsService.updateCommentById(
      commentId,
      updateCommentDto.content,
      req.userId,
    );
  }

  @UseGuards(BearerAuthGuard)
  @Put(':commentId/like-status')
  async reactToComment(
    @Param('commentId') commentId: string,
    @Body() likeStatusDto: LikeInputDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userLogin = await this.usersQueryRepo.getUserLoginById(req.userId);
    await this.commentsService.reactToComment(
      req.userId,
      userLogin,
      commentId,
      likeStatusDto.likeStatus,
    );
    res.sendStatus(204);
  }
}
