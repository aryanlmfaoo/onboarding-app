import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService - LoginUser', () => {
  let service: AuthService;

  const prismaMock = { getDataForLogin: jest.fn() };
  const passwordMock = { comparePassword: jest.fn() };
  const tokenMock = { getDataForLogin: jest.fn(), createAndSaveTokens : jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'PrismaService', useValue: prismaMock },
        { provide: 'PasswordService', useValue: passwordMock },
        { provide: 'TokenService', useValue: tokenMock },
        { provide: 'Logger', useValue: { log: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should login successfully', async () => {
    prismaMock.getDataForLogin.mockResolvedValue({
      id: '1',
      email: 'test@mail.com',
      passwordHash: 'hashed-password',
      firstName: 'Test',
      lastName: 'User',
      level: 'USER',
      profilePictureUrl: '',
    });

    passwordMock.comparePassword.mockResolvedValue(true);

    tokenMock.createAndSaveTokens.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    const result = await service.loginUser({
      email: 'test@mail.com',
      password: '1234',
    });

    expect(result.accessToken).toBe('access');
    expect(result.refreshToken).toBe('refresh');
  });
});