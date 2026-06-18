import { Injectable, Logger } from '@nestjs/common';
import { hash, genSalt, compare } from 'bcrypt';

const SALT_ROUNDS = 10;

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  /**
   * @param password
   * Hashes a password
   */
  async hashPassword(password: string) {
    const salt = await genSalt(SALT_ROUNDS);
    return await hash(password, salt);
  }

  /**
   * @param password
   * @param hashedPassword
   * Compares password string with passwordHash
   */
  async comparePassword(password: string, hashedPassword: string) {
    return await compare(password, hashedPassword);
  }
}
