import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { OrderStatus } from '../src/contracts/order.contract';

// Dựng AppModule với kho in-memory (không DATABASE_URL), không listen: chỉ cần tài liệu OpenAPI.
describe('Swagger /docs', () => {
  let app: INestApplication;
  let doc: any;

  beforeAll(async () => {
    delete process.env.DATABASE_URL;
    process.env.JWT_SECRET = 'swagger-spec-secret';
    // require sau khi đặt env: các module đọc DATABASE_URL lúc nạp
    const { AppModule } = require('../src/app.module');
    const { setupSwagger } = require('../src/swagger');
    app = await NestFactory.create(AppModule, { logger: false });
    doc = setupSwagger(app);
  });

  afterAll(async () => {
    await app?.close();
  });

  test('PATCH /orders/{id} có trong tài liệu, kèm bearer auth', () => {
    const op = doc.paths['/orders/{id}']?.patch;
    expect(op).toBeDefined();
    expect(op.security).toEqual([{ bearer: [] }]);
  });

  test('body của PATCH tham chiếu schema có enum OrderStatus', () => {
    const op = doc.paths['/orders/{id}'].patch;
    const ref: string = op.requestBody.content['application/json'].schema.$ref;
    const schema = doc.components.schemas[ref.split('/').pop()!];
    // enumName gom enum thành schema riêng; thuộc tính status chỉ tham chiếu tới nó
    expect(schema.properties.status.$ref).toBe('#/components/schemas/OrderStatus');
    expect(doc.components.schemas.OrderStatus.enum).toEqual(Object.values(OrderStatus));
  });

  test('POST /payments và POST /orders có header Idempotency-Key', () => {
    for (const path of ['/payments', '/orders']) {
      const names = doc.paths[path].post.parameters.map((p: any) => p.name);
      expect(names).toContain('Idempotency-Key');
    }
  });

  test('/docs-json phục vụ cùng tài liệu', async () => {
    await app.init();
    const server = app.getHttpServer();
    const res = await fetchJson(server, '/docs-json');
    expect(res.paths['/orders/{id}'].patch).toBeDefined();
  });
});

async function fetchJson(server: any, path: string): Promise<any> {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  try {
    const { port } = server.address();
    const r = await fetch(`http://127.0.0.1:${port}${path}`);
    return await r.json();
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}
