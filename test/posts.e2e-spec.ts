import request from 'supertest';
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Model, Types } from 'mongoose';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/utils/httpexception.filter';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { BlogPost, PostDocument, PostSchema } from '../src/posts/post-schema';
import { Blog, BlogDocument, BlogSchema } from '../src/blogs/blog-schema';
import {
  Comment,
  CommentDocument,
  CommentSchema,
} from '../src/comments/comment-schema';

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

describe('posts routes', () => {
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
      new ValidationPipe({
        transform: true,
        stopAtFirstError: true,
        exceptionFactory: (errors) => {
          const errorsForResponse: any = [];

          errors.forEach((e) => {
            const constraintsKey = Object.keys(e.constraints);
            constraintsKey.forEach((ckey) => {
              errorsForResponse.push({
                message: e.constraints[ckey],
                field: e.property,
              });
            });
          });
          throw new BadRequestException(errorsForResponse);
        },
      }),
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

    const loginMaksim = await request(app.getHttpServer())
      .post('/auth/login')
      .set({ 'user-agent': 'Mozilla' })
      .send({
        loginOrEmail: 'maksim',
        password: '123456',
      });
    accessTokenUser2 = loginMaksim.body.accessToken;
    const jwtDataUser2: any = jwt.verify(accessTokenUser2, process.env.SECRET);
    user2Id = jwtDataUser2.userId;
  });

  afterAll(async () => {
    await request(app.getHttpServer()).delete('/testing/all-data');
    await app.close();
  });

  describe('GET "/" - find all posts', () => {
    it('should return object with default query params, pagesCount = 0, totalCount = 0, items = []', async () => {
      await request(app.getHttpServer())
        .get('/posts')
        .expect(200, {
          pagesCount: 0,
          page: 1,
          pageSize: 10,
          totalCount: 0,
          items: [],
        });
    });

    it('given default search params should return 12 posts, pagesCount = 2, total count = 12, items = 10 items', async () => {
      const blogToCreate = {
        name: 'new blog',
        description: 'desc',
        websiteUrl: 'https://google.com',
      };

      const createBlogResponse = await request(app.getHttpServer())
        .post('/blogger/blogs')
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .send(blogToCreate)
        .expect(201);
      const createdBlog = createBlogResponse.body;

      const posts: any[] = [];

      for (let i = 1; i < 13; i++) {
        posts.push({
          title: `new post ${i}`,
          shortDescription: `desc ${i}`,
          content: `https://google.com`,
          blogId: `${createdBlog.id}`,
        });
      }
      let result;
      await Promise.all(
        posts.map(async (post) => {
          await request(app.getHttpServer())
            .post(`/blogger/blogs/${createBlogResponse.body.id}/posts`)
            .set('Authorization', `Bearer ${accessTokenUser1}`)
            .send(post)
            .expect(201);
        }),
      ).then(async () => {
        result = await request(app.getHttpServer()).get('/posts').expect(200);
        expect(result.body.pagesCount).toEqual(2);
        expect(result.body.page).toEqual(1);
        expect(result.body.pageSize).toEqual(10);
        expect(result.body.totalCount).toEqual(12);
        expect(result.body.items.length).toEqual(10);
      });
    });
  });

  describe('GET "/posts/{id}"  - find post by ID', () => {
    it('should find post if id is valid', async () => {
      const blogToCreate = {
        name: 'new blog',
        description: 'desc',
        websiteUrl: 'https://google.com',
      };

      const createBlogResponse = await request(app.getHttpServer())
        .post('/blogger/blogs')
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .send(blogToCreate)
        .expect(201);
      const createdBlog = createBlogResponse.body;

      const postToCreate = {
        title: 'new post1',
        shortDescription: 'blog with created date field',
        content: 'https://email.com',
        blogId: `${createdBlog.id}`,
      };

      const response = await request(app.getHttpServer())
        .post(`/blogger/blogs/${createBlogResponse.body.id}/posts`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .send(postToCreate)
        .expect(201);
      const createdPost = response.body;

      const postToFind = await request(app.getHttpServer())
        .get(`/posts/${createdPost.id}`)
        .expect(200);
      expect(postToFind.body.id).toBe(createdPost.id);
      expect(postToFind.body.title).toBe('new post1');
      expect(postToFind.body.shortDescription).toBe(
        'blog with created date field',
      );
      expect(postToFind.body.content).toBe('https://email.com');
      expect(postToFind.body.extendedLikesInfo).toStrictEqual({
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      });
    });

    it('should NOT find post with invalid ID', async () => {
      const result = await request(app.getHttpServer())
        .get(`/posts/ffjak`)
        .expect(404);
    });
  });

  describe('POST posts/{postId}/comments - Create comment for post', () => {
    let createdPost: any;
    const validComment = {
      content: 'valid comment for post',
    };

    const invalidComment = {
      content: '',
    };

    beforeAll(async () => {
      const blogToCreate = {
        name: 'blog for posts',
        description: 'desc',
        websiteUrl: 'https://google.com',
      };

      const createBlogResponse = await request(app.getHttpServer())
        .post('/blogger/blogs')
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .send(blogToCreate)
        .expect(201);
      const createdBlog = createBlogResponse.body;

      const postToCreate = {
        title: 'new post1',
        shortDescription: 'blog with created date field',
        content: 'https://email.com',
        blogId: `${createdBlog.id}`,
      };

      const response = await request(app.getHttpServer())
        .post(`/blogger/blogs/${createBlogResponse.body.id}/posts`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .send(postToCreate)
        .expect(201);
      createdPost = response.body;
    });

    it('should return newly created comment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/posts/${createdPost.id}/comments`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .send(validComment)
        .expect(201);

      expect(response.body).toStrictEqual({
        id: expect.any(String),
        content: validComment.content,
        commentatorInfo: {
          userId: user2Id,
          userLogin: testUser2.login,
        },
        createdAt: expect.any(String),
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
        },
      });
    });

    it('should return 400 and errors array if inputModel has incorrect data', async () => {
      const response = await request(app.getHttpServer())
        .post(`/posts/${createdPost.id}/comments`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .send(invalidComment)
        .expect(400);

      expect(response.body).toStrictEqual({
        errorsMessages: [
          {
            message: expect.any(String),
            field: 'content',
          },
        ],
      });
    });

    it('should return 401 if user is unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .post(`/posts/${createdPost.id}/comments`)
        .set('Authorization', `Bearer ${new Types.ObjectId()}`)
        .send(validComment)
        .expect(401);
    });

    it('should return 404 if post with specified postId does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post(`/posts/${new Types.ObjectId()}/comments`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .send(validComment)
        .expect(404);
    });
  });

  describe('GET posts/{postId}/comments - Get comments for post', () => {
    let blog: BlogDocument;
    let post: PostDocument;

    beforeAll(async () => {
      const blogDto = {
        name: 'blog for posts',
        description: 'with comments',
        websiteUrl: 'https://google.com',
        ownerInfo: {
          userId: new Types.ObjectId(user1Id),
          userLogin: testUser1.login,
        },
      };
      blog = await blogModel.create(blogDto);

      const postDto = {
        title: 'new post1',
        shortDescription: 'blog with created date field',
        content: 'https://email.com',
        blogId: `${blog.id}`,
        blogName: `${blog.name}`,
      };
      post = await postModel.create(postDto);

      const comments = [];
      for (let i = 0; i < 12; i++) {
        comments.push({
          content: `content for comment ${i}`,
        });
      }

      await Promise.all(
        comments.map(async (comment) => {
          await request(app.getHttpServer())
            .post(`/posts/${post.id}/comments`)
            .set('Authorization', `Bearer ${accessTokenUser2}`)
            .send(comment)
            .expect(201);
        }),
      );
    });

    it('should return 10 comments with pagination for specified post', async () => {
      const result = await request(app.getHttpServer())
        .get(`/posts/${post.id}/comments`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .expect(200);

      expect(result.body.items).toHaveLength(10);
      expect(result.body.page).toBe(1);
      expect(result.body.pageSize).toBe(10);
      expect(result.body.pagesCount).toBe(2);
      expect(result.body.totalCount).toBe(12);
    });

    it('should return 5 comments with pagination with query params: pageNumber=2, pageSize=5, sortOrder=asc, sortBy=content', async () => {
      const result = await request(app.getHttpServer())
        .get(
          `/posts/${post.id}/comments?pageNumber=2&pageSize=5&sortBy=content&sortDirection=asc`,
        )
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .expect(200);

      expect(result.body.items).toHaveLength(5);
      expect(result.body.page).toBe(2);
      expect(result.body.pageSize).toBe(5);
      expect(result.body.pagesCount).toBe(3);
      expect(result.body.totalCount).toBe(12);

      expect(result.body.items[0].content).toBe('content for comment 3');
      expect(result.body.items[1].content).toBe('content for comment 4');
      expect(result.body.items[2].content).toBe('content for comment 5');
      expect(result.body.items[3].content).toBe('content for comment 6');
      expect(result.body.items[4].content).toBe('content for comment 7');
    });

    it('should return 404 if post with specified Id does not exist', async () => {
      await request(app.getHttpServer())
        .get(`/posts/${new Types.ObjectId()}/comments`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .expect(404);
    });
  });

  describe('PUT posts/{postId}/like-status - Make like/unlike/dislike/undislike post', () => {
    let blog: BlogDocument;
    let post: PostDocument;
    const likeStatusObj = { likeStatus: 'Like' };
    const dislikeStatusObj = { likeStatus: 'Dislike' };
    const noneStatusObj = { likeStatus: 'None' };
    const invalidLikeStatusObj = { likeStatus: 'invalid' };

    beforeAll(async () => {
      const blogDto = {
        name: 'blog for posts',
        description: 'with comments',
        websiteUrl: 'https://google.com',
        ownerInfo: {
          userId: new Types.ObjectId(user1Id),
          userLogin: testUser1.login,
        },
      };
      blog = await blogModel.create(blogDto);

      const postDto = {
        title: 'new post1',
        shortDescription: 'blog with created date field',
        content: 'https://email.com',
        blogId: `${blog.id}`,
        blogName: `${blog.name}`,
      };
      post = await postModel.create(postDto);
    });

    it('should return 204 when sent Like, Dislike or None status to existing post', async () => {
      await request(app.getHttpServer())
        .put(`/posts/${post.id}/like-status`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .send(likeStatusObj)
        .expect(204);

      await request(app.getHttpServer())
        .put(`/posts/${post.id}/like-status`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .send(dislikeStatusObj)
        .expect(204);

      await request(app.getHttpServer())
        .put(`/posts/${post.id}/like-status`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .send(noneStatusObj)
        .expect(204);
    });

    it('should add like object to posts extendedLikesInfo when sending Like ', async () => {
      await request(app.getHttpServer())
        .put(`/posts/${post.id}/like-status`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .send(likeStatusObj)
        .expect(204);

      await request(app.getHttpServer())
        .put(`/posts/${post.id}/like-status`)
        .set('Authorization', `Bearer ${accessTokenUser1}`)
        .send(dislikeStatusObj)
        .expect(204);

      const updatedPostLean = await postModel.findById(post.id).lean();
      const user = [...updatedPostLean.extendedLikesInfo.userLikes];

      expect(updatedPostLean.extendedLikesInfo.userLikes.length).toBe(2);
      expect(user).toStrictEqual([
        {
          userId: new Types.ObjectId(user2Id),
          login: testUser2.login,
          reaction: likeStatusObj.likeStatus,
          isBanned: false,
          addedAt: expect.any(Date),
        },
        {
          userId: new Types.ObjectId(user1Id),
          login: testUser1.login,
          reaction: dislikeStatusObj.likeStatus,
          isBanned: false,
          addedAt: expect.any(Date),
        },
      ]);
    });

    it('should return 400 exception if likeInput model is incorrect', async () => {
      const invalidFiledResult = await request(app.getHttpServer())
        .put(`/posts/${post.id}/like-status`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .send(invalidLikeStatusObj)
        .expect(400);

      const missingInputResult = await request(app.getHttpServer())
        .put(`/posts/${post.id}/like-status`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .send(null)
        .expect(400);

      expect(invalidFiledResult.body).toEqual({
        errorsMessages: [
          {
            message: expect.any(String),
            field: 'likeStatus',
          },
        ],
      });
    });

    it('should return 401 if unauthorized', async () => {
      const result = await request(app.getHttpServer())
        .put(`/posts/${post.id}/like-status`)
        .set('Authorization', `Bearer ${new Types.ObjectId()}`)
        .send(likeStatusObj)
        .expect(401);
    });

    it('should return 404 if post with specified postId does not exist', async () => {
      const result = await request(app.getHttpServer())
        .put(`/posts/${new Types.ObjectId()}/like-status`)
        .set('Authorization', `Bearer ${accessTokenUser2}`)
        .send(likeStatusObj)
        .expect(404);
    });
  });
});
