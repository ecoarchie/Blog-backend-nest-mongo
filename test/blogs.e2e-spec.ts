import request from 'supertest';
import { Test } from '@nestjs/testing';
import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { BlogsModule } from '../src/blogs/blogs.module';
import { BlogsService } from '../src/blogs/services/blogs.service';
import { Types } from 'mongoose';
import { AppModule } from '../src/app.module';
import { UserModule } from '../src/users/users.module';
import { AuthModule } from '../src/auth/auth.module';
import { PostsModule } from '../src/posts/posts.module';
import { CommentsModule } from '../src/comments/comments.module';
import { HttpExceptionFilter } from '../src/utils/httpexception.filter';

const arturUser = {
  login: "artur",
  password: "123456",
  email: "artur@rambler.ru"
}

const maksimUser = {
  login: "maksim",
  password: "123456",
  email: "maksim@mail.ru"
}

let accessTokenArtur: string;
let accessTokenMaksim;

describe('blogs routes', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
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
    }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    await request(app.getHttpServer()).delete('/testing/all-data');
    await request(app.getHttpServer()).post('/sa/users').set('Authorization', 'Basic YWRtaW46cXdlcnR5').send(arturUser)
    const loginArtur = await request(app.getHttpServer()).post('/auth/login').set({ 'user-agent': 'Mozilla' }).send(
      {
        loginOrEmail: "artur",
        password: "123456"
      }
    )
    accessTokenArtur = loginArtur.body.accessToken;
  });

  // afterEach(async () => {
  //   await request(app.getHttpServer()).delete('/testing/all-data');
  // });

  afterAll(async () => {
    // await request(app.getHttpServer()).delete('/testing/all-data');
    await app.close()
  });

  describe('GET / - find all blogs', () => {
    it('should return object with default query params, pagesCount = 0, totalCount = 0, items = []', async () => {
      await request(app.getHttpServer())
        .get('/blogs')
        .expect(200, { pagesCount: 0, page: 1, pageSize: 10, totalCount: 0, items: [] });
    });

    it('given default search params should return 12 blogs, pagesCount = 2, total count = 12, items = 10 items', async () => {
      const blogs: any[] = [];


      for (let i = 1; i < 13; i++) {
        blogs.push({
          name: `new blog ${i}`,
          description: `desc ${i}`,
          websiteUrl: `https://google.com`,
        });
      }
      await Promise.all(
        blogs.map(async (blog) => {
          const res = await request(app.getHttpServer())
            .post('/blogger/blogs')
            .set('Authorization', `Bearer ${accessTokenArtur}`)
            .send(blog)
            .expect(201);

        })
      );

      const result = await request(app.getHttpServer()).get('/blogs').expect(200);

      expect(result.body.pagesCount).toEqual(2);
      expect(result.body.page).toEqual(1);
      expect(result.body.pageSize).toEqual(10);
      expect(result.body.totalCount).toEqual(12);
      expect(result.body.items.length).toEqual(10);
    });
  });

  describe('POST / - create blog', () => {
    it('given invalid blog params (all empty strings) should recieve error object with 3 errors', async () => {
      const invalidBlogToCreate = {
        name: '',
        description: '',
        websiteUrl: '',
      };

      const response = await request(app.getHttpServer())
        .post('/blogger/blogs')
        .set('Authorization', `Bearer ${accessTokenArtur}`)
        .send(invalidBlogToCreate)
        .expect(400);

      const errorBody = response.body;
      expect(errorBody).toEqual({
        errorsMessages: [
          {
            message: expect.any(String),
            field: 'name',
          },
          {
            message: expect.any(String),
            field: 'description',
          },
          {
            message: expect.any(String),
            field: 'websiteUrl',
          },
        ],
      });
    });

    it('given valid blog params should return blog object', async () => {
      const blogToCreate = {
        name: 'new blog',
        description: 'desc',
        websiteUrl: 'https://mail.com',
      };

      const response = await request(app.getHttpServer())
        .post('/blogger/blogs')
        .set('Authorization', `Bearer ${accessTokenArtur}`)
        .send(blogToCreate)
        .expect(201);
      const createdBlog = response.body;

      expect(createdBlog).toEqual({
        id: expect.any(String),
        name: 'new blog',
        description: 'desc',
        websiteUrl: 'https://mail.com',
        createdAt: expect.any(String),
        isMembership: false,
      });
    });
  });

  describe('GET "/blogs/{id}"  - find blog by ID', () => {
    const blogToCreate = {
      name: 'new blog2',
      description: 'desc2',
      websiteUrl: 'https://yandex.com',
    };
    it('should find blog if id is valid', async () => {
      const blog = await request(app.getHttpServer())
        .post('/blogger/blogs')
        .set('Authorization', `Bearer ${accessTokenArtur}`)
        .send(blogToCreate)
        .expect(201);

      const result = await request(app.getHttpServer()).get(`/blogs/${blog.body.id}`).expect(200);

      expect(result.body).toEqual({
        id: blog.body.id,
        name: 'new blog2',
        description: 'desc2',
        websiteUrl: 'https://yandex.com',
        createdAt: expect.any(String),
        isMembership: false
      });
    });

    it('should NOT find blog with invalid ID', async () => {
      const result = await request(app.getHttpServer()).get(`/blogs/ffjak`).expect(404);
    });
  });

  describe('POST "blogger/blogs/{blogId}/posts" - create post for specified blog', () => {
    const blogToCreate = {
      name: 'new blog',
      description: 'blog desc',
      websiteUrl: 'https://yandex.com',
    };

    const postToCreate = {
      title: 'post',
      shortDescription: 'post description',
      content: 'post content',
    };

    it('Should NOT create post if user is not authorized', async () => {
      const newBlog = await request(app.getHttpServer())
        .post('/blogger/blogs')
        .set('Authorization', `Bearer nnn`)
        .send(blogToCreate)
        .expect(401);

      await request(app.getHttpServer())
        .post(`/blogger/blogs/${newBlog.body.id}/posts`)
        .set('Authorization', `Bearer nnn`)
        .send(postToCreate)
        .expect(401);
    });

    it('Should NOT create post if blog ID is invalid', async () => {
      const fakeObjectId = new Types.ObjectId();

      await request(app.getHttpServer())
        .post(`/blogger/blogs/${fakeObjectId}/posts`)
        .set('Authorization', `Bearer ${accessTokenArtur}`)
        .send(postToCreate)
        .expect(404);
    });

    it('Should create post for blog', async () => {
      const newBlog = await request(app.getHttpServer())
        .post('/blogger/blogs')
        .set('Authorization', `Bearer ${accessTokenArtur}`)
        .send(blogToCreate)
        .expect(201);

      const result = await request(app.getHttpServer())
        .post(`/blogger/blogs/${newBlog.body.id}/posts`)
        .set('Authorization', `Bearer ${accessTokenArtur}`)
        .send(postToCreate)
        .expect(201);

      expect(result.body).toStrictEqual({
        id: expect.any(String),
        title: 'post',
        shortDescription: 'post description',
        content: 'post content',
        blogId: newBlog.body.id,
        blogName: 'new blog',
        createdAt: expect.stringMatching(
          /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/
        ),
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      });
    });
  });

  describe('GET blogger/blogs/{blogId}/posts - get all posts for specified blog', () => {

    beforeAll(async () => {
      await request(app.getHttpServer()).delete('/testing/all-blogs')
    })

    const blogToCreate = {
      name: 'blog with posts',
      description: 'some description',
      websiteUrl: 'https://yandex.com',
    };
    const postsArr: any[] = [];

    for (let i = 1; i <= 12; i++) {
      postsArr.push({
        title: `post ${i}`,
        shortDescription: `post ${i} description`,
        content: `post ${i} content`,
      });
    }

    it('Should create 12 posts and return 10 of them with default search params', async () => {
      const newBlog = await request(app.getHttpServer())
        .post('/blogger/blogs')
        .set('Authorization', `Bearer ${accessTokenArtur}`)
        .send(blogToCreate)
        .expect(201);

      await Promise.all(
        postsArr.map(async (post) => {
          await request(app.getHttpServer())
            .post(`/blogger/blogs/${newBlog.body.id}/posts`)
            .set('Authorization', `Bearer ${accessTokenArtur}`)
            .send(post)
            .expect(201);
        })
      )
      // .then(async () => {
      const result = await request(app.getHttpServer())
        .get(`/blogs/${newBlog.body.id}/posts`)
        // .set('Authorization', `Bearer ${accessTokenArtur}`)
        .expect(200)

      expect(result.body).toStrictEqual({
        pagesCount: 2,
        page: 1,
        pageSize: 10,
        totalCount: 12,
        items: expect.any(Array),
      });
      expect(result.body.items).toHaveLength(10);
      // });
    });

    it('should return 404 code if blog ID doesnt exist', async () => {
      const res = await request(app.getHttpServer()).get(`/blogs/989/posts`).expect(404);
    });
  });

  describe('PUT blogger/blogs/{id} - update existing blog by ID', () => {
    const blogToCreate = {
      name: 'new blog3',
      description: 'desc3',
      websiteUrl: 'https://yandex.com',
    };

    it('Should update blog if blog ID is valid', async () => {
      const result = await request(app.getHttpServer())
        .post('/blogger/blogs')
        .set('Authorization', `Bearer ${accessTokenArtur}`)
        .send(blogToCreate)
        .expect(201);

      await request(app.getHttpServer())
        .put(`/blogger/blogs/${result.body.id}`)
        .set('Authorization', `Bearer ${accessTokenArtur}`)
        .send({
          name: 'updated name',
          description: 'updated description',
          websiteUrl: 'https://vk.ru',
        })
        .expect(204);

      const updatedBlog = await request(app.getHttpServer()).get(`/blogs/${result.body.id}`).expect(200);

      expect(updatedBlog.body.name).toBe('updated name');
      expect(updatedBlog.body.description).toBe('updated description');
      expect(updatedBlog.body.websiteUrl).toBe('https://vk.ru');
    });
  });

  describe('PUT /blogger/blogs/{id} - update blog and update related posts', () => {
    const blogToCreate = {
      name: 'new blog4',
      description: 'desc4',
      websiteUrl: 'https://youtube.com',
    };

    const postToCreate = {
      title: 'new post',
      shortDescription: 'post ',
      content: 'https://email.com',
      blogId: null as any,
    };

    it('Should update posts related to updated blog if blog name was changed', async () => {
      const result = await request(app.getHttpServer())
        .post('/blogger/blogs')
        .set('Authorization', `Bearer ${accessTokenArtur}`)
        .send(blogToCreate)
        .expect(201);

      postToCreate.blogId = result.body.id;
      const postResult = await request(app.getHttpServer())
        .post(`/blogger/blogs/${result.body.id}/posts`)
        .set('Authorization', `Bearer ${accessTokenArtur}`)
        .send(postToCreate)
        .expect(201);

      expect(postResult.body.blogName).toBe('new blog4');

      await request(app.getHttpServer())
        .put(`/blogger/blogs/${result.body.id}`)
        .set('Authorization', `Bearer ${accessTokenArtur}`)
        .send({
          name: 'updated name',
          description: 'updated description',
          websiteUrl: 'https://vk.ru',
        })
        .expect(204);

      const updatedPost = await request(app.getHttpServer()).get(`/posts/${postResult.body.id}`)
        .set('Authorization', `Bearer ${accessTokenArtur}`)
        .expect(200);
      expect(updatedPost.body.blogName).toBe('updated name');
    });
  });

  // describe('DELETE /blogs/{id}  - delete blog by id', () => {
  //   const blogToCreate = {
  //     name: 'new blog3',
  //     description: 'desc3',
  //     websiteUrl: 'https://yandex.com',
  //   };

  //   it('Should delete blog by ID', async () => {
  //     const result = await request(app.getHttpServer())
  //       .post('/blogs')
  //       .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
  //       .send(blogToCreate)
  //       .expect(201);

  //     const delResult = await request(app.getHttpServer())
  //       .delete(`/blogs/${result.body.id}`)
  //       .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
  //       .expect(204);

  //     const response = await request(app.getHttpServer()).get(`/blogs/${result.body.id}`).expect(404);
  //   });

  //   it('Should not delete blog if ID is invalid', async () => {
  //     await request(app.getHttpServer())
  //       .delete('/blogs/1233')
  //       .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
  //       .expect(404);
  //   });
  // });
});