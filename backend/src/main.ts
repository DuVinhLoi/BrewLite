import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // FE chạy origin khác (:3001) → thiếu CORS thì trình duyệt chặn mọi fetch, menu rơi về mock
  app.enableCors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3001').split(',') });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(3000);
}
bootstrap();
