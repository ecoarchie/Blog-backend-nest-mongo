import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CommentDocument } from '../src/comments/comment-schema';
import {
  CreateUserDto,
  User,
  UserSchema,
  UserDocument,
} from '../src/users/user-schema';
import {
  HttpExceptionFilter,
  validationPipeOptions,
} from '../src/utils/httpexception.filter';

describe('USERS ROUTES', () => {
  let app: INestApplication;
  let userModel: Model<CommentDocument>;
  const ISODateRegex =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)((-(\d{2}):(\d{2})|Z)?)$/;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forFeature([
          {
            name: User.name,
            schema: UserSchema,
          },
        ]),
        AppModule,
      ],
    }).compile();

    userModel = moduleRef.get<Model<CommentDocument>>(getModelToken(User.name));

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    await request(app.getHttpServer()).delete('/testing/all-data');
  });

  afterAll(async () => {
    await request(app.getHttpServer()).delete('/testing/all-data');
    await app.close();
  });

  describe('Routes for SUPER ADMIN', () => {
    describe('POST /sa/users - add new user to the system', () => {
      const createUserDto: CreateUserDto = {
        login: 'user',
        email: 'user@mail.com',
        password: '123456',
      };
      const invalidCreateUserDto: CreateUserDto = {
        login: '',
        email: '',
        password: '',
      };
      it('should add new user to db if input model is valid. Status 201', async () => {
        const addedUserResult = await request(app.getHttpServer())
          .post('/sa/users')
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .send(createUserDto)
          .expect(201);

        expect(addedUserResult.body).toEqual({
          id: expect.any(String),
          login: createUserDto.login,
          email: createUserDto.email,
          createdAt: expect.stringMatching(ISODateRegex),
          banInfo: {
            isBanned: false,
            banDate: null,
            banReason: null,
          },
        });
      });

      it('should not add new user if inputModel is invalid. Status 400', async () => {
        await request(app.getHttpServer())
          .post('/sa/users')
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .send(invalidCreateUserDto)
          .expect(400);
      });

      it('should not add new user if admin is unauthorized. Status 401', async () => {
        const invalidAdminHash = 'YWRtaW46';
        await request(app.getHttpServer())
          .post('/sa/users')
          .set('Authorization', `Basic ${invalidAdminHash}`)
          .send(invalidCreateUserDto)
          .expect(401);
      });
    });

    describe('GET /sa/users - return all users with pagination', () => {
      let users: any;
      beforeAll(async () => {
        await userModel.deleteMany({});
        users = await userModel.find();
        expect(users).toEqual([]);

        // Create 5 users for test
        const userDtos = [];
        for (let i = 1; i <= 5; i++) {
          userDtos.push({
            login: `user ${i}`,
            email: `user${i}@mail.com`,
            password: '123456',
          });
        }
        await userModel.insertMany(userDtos);
        users = await userModel.find().lean();
        expect(users.length).toBe(5);
      });

      it('should return all users given default pagination options. Status 200', async () => {
        const result = await request(app.getHttpServer())
          .get(`/sa/users`)
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .expect(200);

        expect(result.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ login: 'user 1' }),
            expect.objectContaining({ login: 'user 2' }),
            expect.objectContaining({ login: 'user 3' }),
            expect.objectContaining({ login: 'user 4' }),
            expect.objectContaining({ login: 'user 5' }),
          ]),
        );

        expect(result.body.items.length).toBe(5);
        expect(result.body.pagesCount).toBe(1);
        expect(result.body.page).toBe(1);
        expect(result.body.pageSize).toBe(10);
        expect(result.body.totalCount).toBe(5);
      });

      it('should return users 4 and 5, sortBy=login, in asc order, pageSize=3, page=2, pageCount=2, totalCount=5. Status 200', async () => {
        const result = await request(app.getHttpServer())
          .get(
            `/sa/users?sortBy=login&sortDirection=asc&pageNumber=2&pageSize=3`,
          )
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .expect(200);

        expect(result.body.items[0].login).toBe('user 4');
        expect(result.body.items[1].login).toBe('user 5');

        expect(result.body.items.length).toBe(2);
        expect(result.body.pagesCount).toBe(2);
        expect(result.body.page).toBe(2);
        expect(result.body.pageSize).toBe(3);
        expect(result.body.totalCount).toBe(5);
      });

      it('should return 401 status if admin is unauthorized. Status 401', async () => {
        const unauthorizedUserIdHash = 'invalidhash';

        await request(app.getHttpServer())
          .get(`/sa/users`)
          .set('Authorization', `Basic ${unauthorizedUserIdHash}`)
          .expect(401);
      });
    });

    describe('PUT /sa/users/{id}/ban - Ban/unban user', () => {
      let userToBanUnban: UserDocument;
      const banReason = 'ban reason with 20 characters long MIN';

      beforeAll(async () => {
        userToBanUnban = await userModel.findOne();
      });
      const validBanReasonDto = {
        isBanned: true,
        banReason,
      };
      const validUnbanReasonDto = {
        isBanned: false,
        banReason,
      };

      it('should ban user if valid id specified. Status 204', async () => {
        await request(app.getHttpServer())
          .put(`/sa/users/${userToBanUnban.id}/ban`)
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .send(validBanReasonDto)
          .expect(204);

        const bannedUser: UserDocument = await userModel.findById(
          userToBanUnban.id,
        );
        expect(bannedUser.banInfo.isBanned).toBe(true);
        expect(bannedUser.banInfo.banReason).toBe(banReason);
        expect(bannedUser.banInfo.banDate.toISOString()).toMatch(ISODateRegex);
      });

      it('should unban user if valid id specified. Ban reason should be set to null, same as banDate. Status 204', async () => {
        await request(app.getHttpServer())
          .put(`/sa/users/${userToBanUnban.id}/ban`)
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .send(validUnbanReasonDto)
          .expect(204);

        const bannedUser: UserDocument = await userModel.findById(
          userToBanUnban.id,
        );
        expect(bannedUser.banInfo.isBanned).toBe(false);
        expect(bannedUser.banInfo.banReason).toBeNull();
        expect(bannedUser.banInfo.banDate).toBeNull();
      });
    });

    describe('DELETE /sa/users/{id} - delete user by id', () => {
      let userToDelete: UserDocument;

      beforeAll(async () => {
        userToDelete = await userModel.findOne();
      });

      it('should delete user with specified id. Status 204', async () => {
        await request(app.getHttpServer())
          .delete(`/sa/users/${userToDelete.id}`)
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .expect(204);

        const deletedUser = await userModel.findById(userToDelete.id);
        expect(deletedUser).toBeNull();
      });

      it('should not delete user if admin is unauthorized. Status 401', async () => {
        const unauthorizedAdminHash = 'invalidhash';

        await request(app.getHttpServer())
          .delete(`/sa/users/${userToDelete.id}`)
          .set('Authorization', `Basic ${unauthorizedAdminHash}`)
          .expect(401);
      });

      it('should not delete user if specified user does not exist. Status 404', async () => {
        const nonExistingUserId = new Types.ObjectId();

        await request(app.getHttpServer())
          .delete(`/sa/users/${nonExistingUserId}`)
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .expect(404);
      });
    });
  });

  describe('Routes for BLOGGERS', () => {});
});
