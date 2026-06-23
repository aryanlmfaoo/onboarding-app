import { Test, TestingModule } from '@nestjs/testing';
import { ObjectstoreService } from './objectstore.service';

describe('ObjectstoreService', () => {
  let service: ObjectstoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObjectstoreService],
    }).compile();

    service = module.get<ObjectstoreService>(ObjectstoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
