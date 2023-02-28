import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { BearerAuthGuard } from '../auth/guards/bearer.auth.guard';
import { UsersQueryRepository } from '../users/repositories/users.query-repository';
import { CurrentUserId } from '../utils/current-user-id.param.decorator';
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
    @CurrentUserId() currentUserId: string,
    @Res() res: Response,
  ) {
    const commentFound = await this.commentsQueryRepository.findCommentById(
      commentId,
      currentUserId,
    );
    if (!commentFound) return res.sendStatus(404);
    return res.send(commentFound);
  }

  @HttpCode(204)
  @UseGuards(BearerAuthGuard)
  @Delete(':commentId')
  async deleteCommentById(
    @Param('commentId') commentId: string,
    @CurrentUserId() currentUserId: string,
  ) {
    await this.commentsService.deleteCommentById(commentId, currentUserId);
  }

  @HttpCode(204)
  @UseGuards(BearerAuthGuard)
  @Put(':commentId')
  async updateCommentById(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUserId() currentUserId: string,
  ) {
    await this.commentsService.updateCommentById(
      commentId,
      updateCommentDto.content,
      currentUserId,
    );
  }

  @HttpCode(204)
  @UseGuards(BearerAuthGuard)
  @Put(':commentId/like-status')
  async reactToComment(
    @Param('commentId') commentId: string,
    @Body() likeStatusDto: LikeInputDto,
    @CurrentUserId() currentUserId: string,
  ) {
    const userLogin = await this.usersQueryRepo.getUserLoginById(currentUserId);
    await this.commentsService.reactToComment(
      currentUserId,
      userLogin,
      commentId,
      likeStatusDto.likeStatus,
    );
  }
}
