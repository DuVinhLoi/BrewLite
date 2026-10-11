import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createTimeoutSlot } from './timeout-slot';

// ProductCard giữ đúng một timer "Đã thêm ✓" bằng khe này: đặt lại thì hủy cái cũ, rời màn thì hủy hẳn.
describe('createTimeoutSlot', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('chạy callback sau đúng thời gian đặt', () => {
    const slot = createTimeoutSlot();
    const fn = vi.fn();
    slot.set(fn, 1200);
    vi.advanceTimersByTime(1199);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('đặt lần hai thì hủy lần một: timer không chồng nhau', () => {
    const slot = createTimeoutSlot();
    const first = vi.fn();
    const second = vi.fn();
    slot.set(first, 1200);
    vi.advanceTimersByTime(1000);
    slot.set(second, 1200);
    vi.advanceTimersByTime(5000);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('clear() hủy timer đang chờ (dọn khi unmount hoặc khi lần bấm sau bị từ chối)', () => {
    const slot = createTimeoutSlot();
    const fn = vi.fn();
    slot.set(fn, 1200);
    slot.clear();
    vi.advanceTimersByTime(5000);
    expect(fn).not.toHaveBeenCalled();
  });

  test('clear() khi chưa có timer thì không lỗi', () => {
    expect(() => createTimeoutSlot().clear()).not.toThrow();
  });
});
