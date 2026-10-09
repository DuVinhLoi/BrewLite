import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { IOrderRepository, OrderDto, OrderStatus } from '../contracts/order.contract';
import { TxContext } from '../contracts/transaction.contract';
import { PrismaService } from './prisma.service';

type OrderRow = Prisma.OrderGetPayload<{ include: { items: true } }>;

// §12.2 OrderItem không có cột unitPrice → suy ra từ lineTotal/qty (lineTotal = unitPrice*qty, số nguyên)
function toOrderDto(o: OrderRow): OrderDto {
  return {
    id: o.id,
    userId: o.userId,
    status: o.status as OrderStatus,
    total: o.total,
    items: o.items.map((i) => ({
      productId: i.productId,
      quantity: i.qty,
      unitPrice: i.qty > 0 ? Math.floor(i.lineTotal / i.qty) : i.lineTotal,
      size: i.size,
      toppings: parseToppings(i.toppings),
    })),
    createdAt: o.createdAt,
  };
}

@Injectable()
export class PrismaOrderRepo implements IOrderRepository {
  constructor(private db: PrismaService) {}

  private cx(tx?: TxContext): PrismaService {
    return (tx as PrismaService) ?? this.db;
  }

  async findById(id: string, tx?: TxContext): Promise<OrderDto | null> {
    const o = await this.cx(tx).order.findUnique({ where: { id }, include: { items: true } });
    return o ? toOrderDto(o) : null;
  }

  async updateStatus(id: string, status: OrderStatus, tx?: TxContext): Promise<OrderDto> {
    await this.cx(tx).order.update({ where: { id }, data: { status } });
    return (await this.findById(id, tx))!;
  }

  async findByUserId(userId: string, tx?: TxContext): Promise<OrderDto[]> {
    const list = await this.cx(tx).order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { items: true } });
    return list.map(toOrderDto);
  }

  async findByStatuses(statuses: OrderStatus[], tx?: TxContext): Promise<OrderDto[]> {
    const list = await this.cx(tx).order.findMany({ where: { status: { in: statuses } }, orderBy: { createdAt: 'asc' }, include: { items: true } });
    return list.map(toOrderDto);
  }

  async save(order: OrderDto, tx?: TxContext): Promise<OrderDto> {
    await this.cx(tx).order.create({
      data: {
        id: order.id,
        userId: order.userId,
        status: order.status,
        total: order.total,
        items: {
          create: order.items.map((i) => ({
            productId: i.productId,
            size: i.size ?? 'M',
            toppings: JSON.stringify(i.toppings ?? []),
            qty: i.quantity,
            lineTotal: i.unitPrice * i.quantity,
          })),
        },
      },
    });
    return (await this.findById(order.id, tx))!;
  }

  runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T> {
    return this.db.$transaction((tx) => fn(tx));
  }
}

// UC02: toppings lưu chuỗi JSON, đọc lỗi thì coi như rỗng thay vì nổ
function parseToppings(raw: string): string[] {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
