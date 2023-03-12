import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { Model, Types } from "mongoose";
import { AppModule } from "../src/app.module";
import { Blog, BlogDocument, BlogSchema } from "../src/blogs/blog-schema";
import { Comment, CommentDocument, CommentSchema } from "../src/comments/comment-schema";
import { BlogPost, PostDocument, PostSchema } from "../src/posts/post-schema";
import { HttpExceptionFilter, validationPipeOptions } from "../src/utils/httpexception.filter";

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
  let postModel: Model<PostDocument>;
  let blogModel: Model<BlogDocument>;
  let commentModel: Model<CommentDocument>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forFeature([
          {
            name: BlogPost.name,
            schema: PostSchema,
          },
          {
            name: Blog.name,
            schema: BlogSchema,
          },
          {
            name: Comment.name,
            schema: CommentSchema,
          },
        ]),
        AppModule,
      ],
    }).compile();

    postModel = moduleRef.get<Model<PostDocument>>(
      getModelToken(BlogPost.name),
    );
    blogModel = moduleRef.get<Model<BlogDocument>>(getModelToken(Blog.name));
    commentModel = moduleRef.get<Model<CommentDocument>>(
      getModelToken(Comment.name),
    );

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe(validationPipeOptions),
    );
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
    const ISODateRegex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)((-(\d{2}):(\d{2})|Z)?)$/;
    const commentatorId = new Types.ObjectId(user1Id);
    let validCommentDto: Partial<Comment> = {
      postId: new Types.ObjectId(),
      content: 'correct comment to random post',
      commentatorInfo: {
        userId: commentatorId,
        userLogin: testUser1.login,
        isBanned: false
      }
    }
    it('should return status 200 and comment object if commentId is valid', async () => {
      const comment = await commentModel.create(validCommentDto)
      const foundComment = await request(app.getHttpServer())
        .get(`/comments/${comment.id}`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .expect(200)

      expect(foundComment.body).toEqual({
        id: comment.id,
        content: validCommentDto.content,
        commentatorInfo: {
          userId: commentatorId.toString(),
          userLogin: testUser1.login
        },
        createdAt: expect.stringMatching(ISODateRegex),
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: "None"
        }
      })
    })

    it('should return 404 status if comment with specified Id is not found', async () => {
      const invalidCommentId = new Types.ObjectId();
      const foundComment = await request(app.getHttpServer())
        .get(`/comments/${invalidCommentId}`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .expect(404)
    })
  });

  describe('DELETE /comments/{commentId} - delete comment specified by id', () => {

  });

  describe('PUT /comments/{commentId} - update existing comment by id with imputModel', () => {

  });

  describe('PUT /comments/{commentId}/like-status - Make like/unlike/dislike/undislike operation with comment', () => {

  });
});