import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { AppModule } from '../src/app.module';
import {
  Comment,
  CommentDocument,
  CommentSchema,
} from '../src/comments/comment-schema';
import {
  HttpExceptionFilter,
  validationPipeOptions,
} from '../src/utils/httpexception.filter';

const testUser1 = {
  login: 'artur',
  password: '123456',
  email: 'artur@rambler.ru',
};

const testUser2 = {
  login: 'maksim',
  password: '123456',
  email: 'maksim@mail.ru',
};
let accessTokenUser1: string;
let accessTokenUser2: string;
let user1Id: string;
let user2Id: string;

describe('COMMENTS ROUTES', () => {
  let app: INestApplication;
  let commentModel: Model<CommentDocument>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forFeature([
          {
            name: Comment.name,
            schema: CommentSchema,
          },
        ]),
        AppModule,
      ],
    }).compile();

    commentModel = moduleRef.get<Model<CommentDocument>>(
      getModelToken(Comment.name),
    );

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    await request(app.getHttpServer()).delete('/testing/all-data');
    await request(app.getHttpServer())
      .post('/sa/users')
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .send(testUser1);
    await request(app.getHttpServer())
      .post('/sa/users')
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .send(testUser2);

    const loginResultUser1 = await request(app.getHttpServer())
      .post('/auth/login')
      .set({ 'user-agent': 'Mozilla' })
      .send({
        loginOrEmail: 'artur',
        password: '123456',
      });
    accessTokenUser1 = loginResultUser1.body.accessToken;
    const jwtDataUser1: any = jwt.verify(accessTokenUser1, process.env.SECRET);
    user1Id = jwtDataUser1.userId;

    const loginResultUser2 = await request(app.getHttpServer())
      .post('/auth/login')
      .set({ 'user-agent': 'Mozilla' })
      .send({
        loginOrEmail: 'maksim',
        password: '123456',
      });
    accessTokenUser2 = loginResultUser2.body.accessToken;
    const jwtDataUser2: any = jwt.verify(accessTokenUser2, process.env.SECRET);
    user2Id = jwtDataUser2.userId;
  });

  afterAll(async () => {
    await request(app.getHttpServer()).delete('/testing/all-data');
    await app.close();
  });

  describe('GET /comments/{id} - return comment by Id', () => {
    let commentatorId: Types.ObjectId;
    let validCommentDto: Partial<Comment>;
    const ISODateRegex =
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)((-(\d{2}):(\d{2})|Z)?)$/;

    beforeAll(async () => {
      commentatorId = new Types.ObjectId(user1Id);
      validCommentDto = {
        postId: new Types.ObjectId(),
        content: 'correct comment to random post',
        commentatorInfo: {
          userId: commentatorId,
          userLogin: testUser1.login,
          isBanned: false,
        },
      };
    });

    it('should return status 200 and comment object if commentId is valid', async () => {
      const comment = await commentModel.create(validCommentDto);
      const foundComment = await request(app.getHttpServer())
        .get(`/comments/${comment.id}`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .expect(200);

      expect(foundComment.body).toEqual({
        id: comment.id,
        content: validCommentDto.content,
        commentatorInfo: {
          userId: commentatorId.toString(),
          userLogin: testUser1.login,
        },
        createdAt: expect.stringMatching(ISODateRegex),
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
        },
      });
    });

    it('should return 404 status if comment with specified Id is not found', async () => {
      const invalidCommentId = new Types.ObjectId();
      const foundComment = await request(app.getHttpServer())
        .get(`/comments/${invalidCommentId}`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .expect(404);
    });
  });

  describe('DELETE /comments/{commentId} - delete comment specified by id', () => {
    let commentToDelete;
    let commentToDelete403;
    let commentId: string;
    let commentId403: string;
    let validCommentDto: Partial<Comment>;
    beforeAll(async () => {
      const commentatorId = new Types.ObjectId(user1Id);
      validCommentDto = {
        postId: new Types.ObjectId(),
        content: 'correct comment to delete',
        commentatorInfo: {
          userId: commentatorId,
          userLogin: testUser1.login,
          isBanned: false,
        },
      };
    });

    it('should return 204 status when valid commentId is passed and delete comment', async () => {
      commentToDelete = await commentModel.create(validCommentDto);
      commentId = commentToDelete.id;

      const deleteResult = await request(app.getHttpServer())
        .delete(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .expect(204);

      const foundDeletedComment = await commentModel.findById(commentId);
      expect(foundDeletedComment).toBeNull();
    });

    it('should return 401 status if user is unauthorized', async () => {
      await request(app.getHttpServer())
        .delete(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${new Types.ObjectId()}`)
        .expect(401);
    });

    it('should return 403 status if user tries to delete comment that does not belong to him', async () => {
      commentToDelete403 = await commentModel.create({
        ...validCommentDto,
        commentatorInfo: {
          userId: new Types.ObjectId(user2Id),
          userLogin: testUser2.login,
          isBanned: false,
        },
      });
      commentId403 = commentToDelete403.id;

      const deleteResult = await request(app.getHttpServer())
        .delete(`/comments/${commentId403}`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .expect(403);

      const foundComment = await commentModel.findById(commentId403);
      expect(foundComment).not.toBeNull();
    });

    it('should return 404 status if comment with passed id does not exist', async () => {
      const notExistingCommentId = new Types.ObjectId();
      await request(app.getHttpServer())
        .delete(`/comments/${notExistingCommentId}`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .expect(404);
    });
  });

  describe('PUT /comments/{commentId} - update existing comment by id with imputModel', () => {
    let commentToUpdate;
    let commentToUpdateId: string;
    let validCommentDto: Partial<Comment>;
    let validUpdateCommentDto: { content: string };
    let invalidUpdateCommentDto: { content: string };

    beforeAll(async () => {
      const commentatorId = new Types.ObjectId(user1Id);
      validCommentDto = {
        postId: new Types.ObjectId(),
        content: 'correct comment to delete',
        commentatorInfo: {
          userId: commentatorId,
          userLogin: testUser1.login,
          isBanned: false,
        },
      };

      validUpdateCommentDto = { content: 'updated content for comment' };

      invalidUpdateCommentDto = { content: '' };

      commentToUpdate = await commentModel.create(validCommentDto);
      commentToUpdateId = commentToUpdate.id;
    });

    it('should return 204 status if passed update input model is valid and update comment', async () => {
      await request(app.getHttpServer())
        .put(`/comments/${commentToUpdateId}`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .send(validUpdateCommentDto)
        .expect(204);

      const updatedComment = await commentModel.findById(commentToUpdateId);
      expect(updatedComment.content).toBe('updated content for comment');
    });

    it('should return 400 status if update input model is incorrect', async () => {
      await request(app.getHttpServer())
        .put(`/comments/${commentToUpdateId}`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .send(invalidUpdateCommentDto)
        .expect(400);
    });

    it('should return 403 status it try edit comment that does not belong to editor', async () => {
      await request(app.getHttpServer())
        .put(`/comments/${commentToUpdateId}`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .send(validUpdateCommentDto)
        .expect(403);
    });

    it('should return 404 status if comment with this id is not found', async () => {
      const notExistingCommentId = new Types.ObjectId();

      await request(app.getHttpServer())
        .put(`/comments/${notExistingCommentId}`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .send(validUpdateCommentDto)
        .expect(404);
    });

    it('should return 401 status if user is unauthorized', async () => {
      const unauthorizedUserToken = new Types.ObjectId();

      await request(app.getHttpServer())
        .put(`/comments/${commentToUpdateId}`)
        .set('Authorization', `Bearer ${unauthorizedUserToken}`)
        .send(validUpdateCommentDto)
        .expect(401);
    });
  });

  describe('PUT /comments/{commentId}/like-status - Make like/unlike/dislike/undislike operation with comment', () => {
    let commentToReact;
    let commentToReactId: string;

    beforeAll(async () => {
      const createCommentDto = {
        postId: new Types.ObjectId(),
        content: 'correct comment to delete',
        commentatorInfo: {
          userId: new Types.ObjectId(),
          userLogin: 'testUser',
          isBanned: false,
        },
      };
      commentToReact = await commentModel.create(createCommentDto);
      commentToReactId = commentToReact.id;
    });

    it('should return 204 status if inputModel is valid and like the comment by user1 and dislike by user2', async () => {
      await request(app.getHttpServer())
        .put(`/comments/${commentToReactId}/like-status`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .send({ likeStatus: 'Like' })
        .expect(204);

      const likedComment = await commentModel.findById(commentToReactId);
      expect(likedComment.likesInfo.userLikes).toHaveLength(1);
      expect(likedComment.likesInfo.userLikes[0].userId.toString()).toBe(
        user1Id,
      );
      expect(likedComment.likesInfo.userLikes[0].reaction).toBe('Like');

      await request(app.getHttpServer())
        .put(`/comments/${commentToReactId}/like-status`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .send({ likeStatus: 'Dislike' })
        .expect(204);

      const dislikedComment = await commentModel.findById(commentToReactId);
      expect(dislikedComment.likesInfo.userLikes).toHaveLength(2);
      expect(dislikedComment.likesInfo.userLikes[1].userId.toString()).toBe(
        user2Id,
      );
      expect(dislikedComment.likesInfo.userLikes[1].reaction).toBe('Dislike');
    });

    it('should not has any effect if same reaction is sent more than once repeatedly (like or dislike)', async () => {
      await request(app.getHttpServer())
        .put(`/comments/${commentToReactId}/like-status`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .send({ likeStatus: 'Like' })
        .expect(204);

      await request(app.getHttpServer())
        .put(`/comments/${commentToReactId}/like-status`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .send({ likeStatus: 'Dislike' })
        .expect(204);

      const twiceLikedDislikedComment = await commentModel.findById(
        commentToReactId,
      );
      expect(twiceLikedDislikedComment.likesInfo.userLikes).toHaveLength(2);
      expect(twiceLikedDislikedComment.likesInfo.userLikes[0].reaction).toBe(
        'Like',
      );
      expect(twiceLikedDislikedComment.likesInfo.userLikes[1].reaction).toBe(
        'Dislike',
      );
    });

    it('should return 400 status if inputModel is innvalid (has anything else except Like | Dislike | None', async () => {
      await request(app.getHttpServer())
        .put(`/comments/${commentToReactId}/like-status`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .send({ likeStatus: 'InvalidInput' })
        .expect(400);
    });

    it('should return 401 status if user is unauthorized', async () => {
      const unauthorizedUserToken = new Types.ObjectId();
      await request(app.getHttpServer())
        .put(`/comments/${commentToReactId}/like-status`)
        .set('Authorization', `Bearer ${unauthorizedUserToken}`)
        .send({ likeStatus: 'Like' })
        .expect(401);
    });

    it('should return 404 status if specified comment does not exist', async () => {
      const nonExistingCommentId = new Types.ObjectId();

      await request(app.getHttpServer())
        .put(`/comments/${nonExistingCommentId}/like-status`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .send({ likeStatus: 'Like' })
        .expect(404);
    });
  });
});
