import { describe, expect, test } from 'vitest';
import { FOCUSABLE_SELECTOR, isCloseEscape, isEscapeKey, isTrapTab, nextFocusIndex } from './focus-trap';

// Bẫy focus của modal (R24): phần quyết định là hàm thuần, phần DOM chỉ tìm phần tử và gọi focus().
describe('nextFocusIndex(count, current, shift)', () => {
  test('Tab đi tới phần tử kế tiếp', () => {
    expect(nextFocusIndex(4, 0, false)).toBe(1);
    expect(nextFocusIndex(4, 2, false)).toBe(3);
  });

  test('Shift+Tab lùi về phần tử trước', () => {
    expect(nextFocusIndex(4, 3, true)).toBe(2);
    expect(nextFocusIndex(4, 1, true)).toBe(0);
  });

  test('Tab ở phần tử cuối quay vòng về đầu', () => {
    expect(nextFocusIndex(4, 3, false)).toBe(0);
  });

  test('Shift+Tab ở phần tử đầu quay vòng về cuối', () => {
    expect(nextFocusIndex(4, 0, true)).toBe(3);
  });

  test('focus đang ở khung modal hoặc ngoài danh sách (-1): Tab vào đầu, Shift+Tab vào cuối', () => {
    expect(nextFocusIndex(4, -1, false)).toBe(0);
    expect(nextFocusIndex(4, -1, true)).toBe(3);
  });

  test('chỉ số cũ vượt danh sách (nút vừa bị vô hiệu): coi như ngoài danh sách', () => {
    expect(nextFocusIndex(3, 5, false)).toBe(0);
    expect(nextFocusIndex(3, 5, true)).toBe(2);
  });

  test('một phần tử: Tab và Shift+Tab đều ở lại phần tử đó', () => {
    expect(nextFocusIndex(1, 0, false)).toBe(0);
    expect(nextFocusIndex(1, 0, true)).toBe(0);
  });

  test('không có phần tử nào: -1 (giữ focus ở khung modal)', () => {
    expect(nextFocusIndex(0, -1, false)).toBe(-1);
    expect(nextFocusIndex(0, -1, true)).toBe(-1);
  });
});

describe('isEscapeKey', () => {
  test('Escape (và "Esc" của trình duyệt cũ) là phím đóng', () => {
    expect(isEscapeKey('Escape')).toBe(true);
    expect(isEscapeKey('Esc')).toBe(true);
  });

  test('phím khác không đóng', () => {
    for (const key of ['Enter', 'Tab', ' ', 'e', 'Backspace']) expect(isEscapeKey(key)).toBe(false);
  });
});

describe('FOCUSABLE_SELECTOR', () => {
  test('gồm nút, liên kết, ô nhập; bỏ phần tử bị vô hiệu và tabindex="-1"', () => {
    expect(FOCUSABLE_SELECTOR).toContain('button:not([disabled])');
    expect(FOCUSABLE_SELECTOR).toContain('a[href]');
    expect(FOCUSABLE_SELECTOR).toContain('input:not([disabled])');
    expect(FOCUSABLE_SELECTOR).toContain('[tabindex]:not([tabindex="-1"])');
  });
});

// Phím giả đủ các trường mà bẫy focus đọc.
const key = (over: Partial<Parameters<typeof isTrapTab>[0]>) => ({
  key: 'Tab',
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  defaultPrevented: false,
  isComposing: false,
  ...over,
});

describe('isTrapTab(e): chỉ Tab trần hoặc Shift+Tab mới bị bẫy', () => {
  test('Tab và Shift+Tab bị bẫy', () => {
    expect(isTrapTab(key({}))).toBe(true);
    expect(isTrapTab(key({ shiftKey: true }))).toBe(true);
  });

  test('Ctrl/Meta/Alt+Tab (chuyển tab, chuyển cửa sổ) để trình duyệt xử lý', () => {
    expect(isTrapTab(key({ ctrlKey: true }))).toBe(false);
    expect(isTrapTab(key({ metaKey: true }))).toBe(false);
    expect(isTrapTab(key({ altKey: true }))).toBe(false);
    expect(isTrapTab(key({ ctrlKey: true, shiftKey: true }))).toBe(false);
  });

  test('phím khác Tab không bị bẫy', () => {
    expect(isTrapTab(key({ key: 'Enter' }))).toBe(false);
  });
});

describe('isCloseEscape(e): Esc đóng hộp thoại, trừ khi đã có widget khác dùng Esc', () => {
  test('Esc thường (và "Esc" của trình duyệt cũ) đóng', () => {
    expect(isCloseEscape(key({ key: 'Escape' }))).toBe(true);
    expect(isCloseEscape(key({ key: 'Esc' }))).toBe(true);
  });

  test('Esc đã bị widget lồng nhau xử lý (defaultPrevented) thì không đóng', () => {
    expect(isCloseEscape(key({ key: 'Escape', defaultPrevented: true }))).toBe(false);
  });

  test('Esc đang soạn bằng IME (isComposing) thì không đóng', () => {
    expect(isCloseEscape(key({ key: 'Escape', isComposing: true }))).toBe(false);
  });

  test('phím khác Esc không đóng', () => {
    expect(isCloseEscape(key({ key: 'Tab' }))).toBe(false);
  });
});
