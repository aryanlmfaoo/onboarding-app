import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { UnknownExceptionFilter } from './httpexception.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new UnknownExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
