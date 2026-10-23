import { describe, expect, it } from 'vitest';
import { formatVnd } from './format';

describe('UNIT-T01: formatVnd', () => {
  it('định dạng giá 45000 thành 45.000đ', () => {
    expect(formatVnd(45000)).toBe('45.000đ');
  });

  it('định dạng số lớn có đầy đủ dấu phân cách', () => {
    expect(formatVnd(1250000)).toBe('1.250.000đ');
  });

  it('định dạng 0 thành 0đ', () => {
    expect(formatVnd(0)).toBe('0đ');
  });
});
