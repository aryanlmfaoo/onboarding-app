import { Test, TestingModule } from '@nestjs/testing';
import { PaswordService } from './password.service.js';

describe('PaswordService', () => {
  let service: PaswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaswordService],
    }).compile();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    service = module.get<PaswordService>(PaswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
