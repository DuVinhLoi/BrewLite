import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Product } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Products API', () => {
  let app: INestApplication;

  const prismaMock = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const cappuccino: Product = {
    id: 'cappuccino',
    name: 'Cappuccino',
    description: 'Espresso kết hợp sữa nóng và lớp bọt mịn đặc trưng nước Ý.',
    price: 45000,
    imageUrl: '/images/cappuccino.svg',
    stock: 30,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('API-T01: GET /products trả 200 kèm danh sách sản phẩm cho người chưa đăng nhập', async () => {
    prismaMock.product.findMany.mockResolvedValue([cappuccino]);

    const response = await request(app.getHttpServer()).get('/products').expect(200);

    expect(response.body).toEqual([cappuccino]);
    expect(typeof response.body[0].price).toBe('number');
    expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1);
  });

  it('API-T02: GET /products/:id trả 200 kèm chi tiết sản phẩm', async () => {
    prismaMock.product.findUnique.mockResolvedValue(cappuccino);

    const response = await request(app.getHttpServer()).get('/products/cappuccino').expect(200);

    expect(response.body).toEqual(cappuccino);
    expect(response.body.description).toBe(cappuccino.description);
    expect(prismaMock.product.findUnique).toHaveBeenCalledWith({ where: { id: 'cappuccino' } });
  });

  it('API-T03: GET /products/:id với id không tồn tại trả 404 PRODUCT_NOT_FOUND', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);

    const response = await request(app.getHttpServer()).get('/products/khong-ton-tai').expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      error: 'PRODUCT_NOT_FOUND',
      message: 'Không tìm thấy sản phẩm',
    });
  });

  it('API-T04: GET /products trả 200 và mảng rỗng khi chưa có sản phẩm', async () => {
    prismaMock.product.findMany.mockResolvedValue([]);

    const response = await request(app.getHttpServer()).get('/products').expect(200);

    expect(response.body).toEqual([]);
  });

  it('API-T05: lỗi database trả 500 và không lộ thông tin nội bộ trong response', async () => {
    const logger = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    prismaMock.product.findMany.mockRejectedValue(new Error('Internal database connection failed'));

    try {
      const response = await request(app.getHttpServer()).get('/products').expect(500);

      expect(response.body).toEqual({
        statusCode: 500,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Lỗi hệ thống, vui lòng thử lại sau',
      });
    } finally {
      logger.mockRestore();
    }
  });
});
