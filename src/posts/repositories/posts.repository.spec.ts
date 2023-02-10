import { Test, TestingModule } from '@nestjs/testing';
import { PostsRepository } from './posts.repository';

describe('PostsService', () => {
  let service: PostsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostsRepository],
    }).compile();

    service = module.get<PostsRepository>(PostsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
