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
import { CurrentUserReq } from '../users/user-schema';
import { CurrentUser } from '../utils/current-user.param.decorator';
import { UpdateCommentDto } from './comment-schema';
import { CommentsService } from './comments.services';
import { LikeInputDto } from './like.schema';
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
    @CurrentUser('id') currentUserId: string,
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
    @CurrentUser('id') currentUserId: string,
  ) {
    await this.commentsService.deleteCommentById(commentId, currentUserId);
  }

  @HttpCode(204)
  @UseGuards(BearerAuthGuard)
  @Put(':commentId')
  async updateCommentById(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser('id') currentUserId: string,
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
    @CurrentUser() currentUser: CurrentUserReq,
  ) {
    // const userLogin = await this.usersQueryRepo.getUserLoginById(currentUserId);
    await this.commentsService.reactToComment(
      currentUser.id,
      currentUser.login,
      commentId,
      likeStatusDto.likeStatus,
    );
  }
}
