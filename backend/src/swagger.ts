import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Swagger UI tại /docs, JSON tại /docs-json. Nhân viên (BARISTA/ADMIN) thao tác tiến đơn qua đây vì web không có màn quầy.
export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('BrewLite API')
    .setDescription('Đăng nhập (POST /auth/login), bấm Authorize với token, rồi gọi PATCH /orders/{id} để tiến đơn.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  return document;
}
