import { INestApplication } from '@nestjs/common';
import { ApiExceptionFilter } from './common/api-exception.filter';

/** Cấu hình bộ xử lý lỗi chung và các địa chỉ web được phép gọi API (CORS). */
export function configureApp(app: INestApplication): void {
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(','),
  });
}
