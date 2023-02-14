import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment } from '../comment-schema';
import { CommentsModule } from '../comments.module';
import { CommentsRepository } from '../repositories/comments.repository';

@Injectable()
export class CommentsService {
  constructor(
    private commentsRepository: CommentsRepository,
    @InjectModel(Comment.name) private commentModel: Model<CommentsModule>,
  ) {}
}
