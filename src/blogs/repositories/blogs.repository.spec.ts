import { Test, TestingModule } from '@nestjs/testing';
import { BlogsRepository } from './blogs.repository';

describe('BlogsRepository', () => {
  let service: BlogsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlogsRepository],
    }).compile();

    service = module.get<BlogsRepository>(BlogsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
