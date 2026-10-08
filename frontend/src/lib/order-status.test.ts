import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  HAPPY_PATH,
  ORDER_STATUSES,
  STATUS_LABEL,
  TRANSITIONS,
  canCancel,
  demoCounterEnabled,
  nextStatus,
  statusTrack,
} from './order-status';

// Đề §9.1: sơ đồ Order State Machine có đúng 9 mũi tên. Danh sách này chép từ ảnh sơ đồ (nguồn độc lập),
// không suy ra từ TRANSITIONS, để bảng FE đổi sai thì test đỏ.
const DIAGRAM_ARROWS = [
  'PENDING->PAID',
  'PENDING->PAYMENT_FAILED',
  'PAYMENT_FAILED->PENDING',
  'PENDING->CANCELLED',
  'PAID->CANCELLED',
  'PAYMENT_FAILED->CANCELLED',
  'PAID->PREPARING',
  'PREPARING->READY',
  'READY->COMPLETED',
];

const arrowsOf = (table: Record<string, string[]>) =>
  Object.entries(table)
    .flatMap(([from, tos]) => tos.map((to) => `${from}->${to}`))
    .sort();

describe('TRANSITIONS (bảng chuyển trạng thái phía FE)', () => {
  test('đủ 7 trạng thái', () => {
    expect([...ORDER_STATUSES].sort()).toEqual(
      ['CANCELLED', 'COMPLETED', 'PAID', 'PAYMENT_FAILED', 'PENDING', 'PREPARING', 'READY'],
    );
    expect(Object.keys(TRANSITIONS).sort()).toEqual([...ORDER_STATUSES].sort());
  });

  test('đúng 9 mũi tên của sơ đồ §9.1, không thừa không thiếu', () => {
    expect(arrowsOf(TRANSITIONS)).toEqual([...DIAGRAM_ARROWS].sort());
    expect(arrowsOf(TRANSITIONS)).toHaveLength(9);
  });

  test('COMPLETED và CANCELLED là trạng thái cuối', () => {
    expect(TRANSITIONS.COMPLETED).toEqual([]);
    expect(TRANSITIONS.CANCELLED).toEqual([]);
  });

  // Bảng thật ở backend/src/state-machine/order-state.machine.ts (ALLOWED): đọc thẳng từ mã nguồn để 2 bên không lệch nhau.
  const backendFile = fileURLToPath(new URL('../../../backend/src/state-machine/order-state.machine.ts', import.meta.url));
  test.skipIf(!existsSync(backendFile))('khớp ALLOWED trong backend/src/state-machine/order-state.machine.ts', () => {
    const src = readFileSync(backendFile, 'utf8');
    const backend: Record<string, string[]> = {};
    Array.from(src.matchAll(/\[OrderStatus\.(\w+)\]:\s*\[([^\]]*)\]/g)).forEach((m) => {
      backend[m[1]] = m[2].split(',').map((s) => s.trim().replace('OrderStatus.', '')).filter(Boolean);
    });
    expect(Object.keys(backend)).toHaveLength(7); // đọc được đủ 7 dòng, không phải khớp rỗng
    expect(arrowsOf(TRANSITIONS)).toEqual(arrowsOf(backend));
  });
});

describe('STATUS_LABEL', () => {
  test('nhãn tiếng Việt của 7 trạng thái', () => {
    expect(STATUS_LABEL).toEqual({
      PENDING: 'Chờ thanh toán',
      PAID: 'Đã thanh toán',
      PREPARING: 'Đang pha',
      READY: 'Sẵn sàng',
      COMPLETED: 'Hoàn tất',
      PAYMENT_FAILED: 'Thanh toán lỗi',
      CANCELLED: 'Đã hủy',
    });
  });
});

describe('canCancel', () => {
  test('hủy được: PENDING, PAYMENT_FAILED, PAID', () => {
    for (const s of ['PENDING', 'PAYMENT_FAILED', 'PAID']) expect(canCancel(s)).toBe(true);
  });
  test('không hủy được: từ PREPARING trở đi, đơn đã hủy, trạng thái lạ', () => {
    for (const s of ['PREPARING', 'READY', 'COMPLETED', 'CANCELLED', 'XYZ', '']) expect(canCancel(s)).toBe(false);
  });
});

describe('nextStatus (bước "quầy": PAID → PREPARING → READY → COMPLETED)', () => {
  test('3 bước của quầy', () => {
    expect(nextStatus('PAID')).toBe('PREPARING');
    expect(nextStatus('PREPARING')).toBe('READY');
    expect(nextStatus('READY')).toBe('COMPLETED');
  });
  test('không có bước kế: PENDING/PAYMENT_FAILED (bước kế là thanh toán), trạng thái cuối, trạng thái lạ', () => {
    for (const s of ['PENDING', 'PAYMENT_FAILED', 'COMPLETED', 'CANCELLED', 'XYZ']) expect(nextStatus(s)).toBeNull();
  });
  test('mọi bước kế đều là mũi tên hợp lệ trong TRANSITIONS', () => {
    for (const s of ORDER_STATUSES) {
      const next = nextStatus(s);
      if (next) expect(TRANSITIONS[s]).toContain(next);
    }
  });
});

describe('statusTrack (thanh tiến trình 5 bước)', () => {
  test('luồng chính gồm 5 bước theo đúng thứ tự', () => {
    expect(HAPPY_PATH).toEqual(['PENDING', 'PAID', 'PREPARING', 'READY', 'COMPLETED']);
  });

  test('PAID: bước đã qua = done, hiện tại = current, còn lại = todo', () => {
    const t = statusTrack('PAID');
    expect(t.kind).toBe('steps');
    if (t.kind !== 'steps') return;
    expect(t.steps.map((s) => [s.status, s.state])).toEqual([
      ['PENDING', 'done'],
      ['PAID', 'current'],
      ['PREPARING', 'todo'],
      ['READY', 'todo'],
      ['COMPLETED', 'todo'],
    ]);
    expect(t.steps.map((s) => s.label)).toEqual(['Chờ thanh toán', 'Đã thanh toán', 'Đang pha', 'Sẵn sàng', 'Hoàn tất']);
  });

  test('COMPLETED: 4 bước đầu done, bước cuối current', () => {
    const t = statusTrack('COMPLETED');
    if (t.kind !== 'steps') throw new Error('phải là steps');
    expect(t.steps.map((s) => s.state)).toEqual(['done', 'done', 'done', 'done', 'current']);
  });

  test('PENDING: chỉ bước đầu current', () => {
    const t = statusTrack('PENDING');
    if (t.kind !== 'steps') throw new Error('phải là steps');
    expect(t.steps.map((s) => s.state)).toEqual(['current', 'todo', 'todo', 'todo', 'todo']);
  });

  test('PAYMENT_FAILED (đỏ) và CANCELLED (xám) hiện nhãn riêng thay vì thanh tiến trình', () => {
    expect(statusTrack('PAYMENT_FAILED')).toEqual({ kind: 'failed', label: 'Thanh toán lỗi' });
    expect(statusTrack('CANCELLED')).toEqual({ kind: 'cancelled', label: 'Đã hủy' });
  });

  test('trạng thái lạ: giữ nguyên chữ, không vỡ', () => {
    expect(statusTrack('XYZ')).toEqual({ kind: 'unknown', label: 'XYZ' });
  });
});

describe('demoCounterEnabled (NEXT_PUBLIC_DEMO_COUNTER)', () => {
  afterEach(() => vi.unstubAllEnvs());

  test('mặc định bật (chưa đặt biến), bật khi "true"', () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_COUNTER', '');
    expect(demoCounterEnabled()).toBe(true);
    vi.stubEnv('NEXT_PUBLIC_DEMO_COUNTER', 'true');
    expect(demoCounterEnabled()).toBe(true);
  });

  test('chỉ tắt khi đặt đúng "false"', () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_COUNTER', 'false');
    expect(demoCounterEnabled()).toBe(false);
  });
});
