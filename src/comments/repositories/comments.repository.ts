import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from '../comment-schema';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private postModel: Model<CommentDocument>,
  ) {}
}
