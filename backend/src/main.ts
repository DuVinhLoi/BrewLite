import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // Kho in-memory chỉ để jest; chạy thật thiếu DB thì mỗi module giữ kho RAM riêng (POST /orders rồi POST /payments ra 404)
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required: run `docker compose up -d db`, then set DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite');
  }
  const app = await NestFactory.create(AppModule);
  // FE chạy origin khác (:3001) → thiếu CORS thì trình duyệt chặn mọi fetch, menu rơi về mock
  app.enableCors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3001').split(',') });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(3000);
}
bootstrap();
