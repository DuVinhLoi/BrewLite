// ============================================================
// FEATURE: Bẫy focus và phím của hộp thoại (R24, ui-visual-plan.md §6 mục 4).
// Phần quyết định là hàm thuần (test được trong node); component chỉ tìm phần tử bằng FOCUSABLE_SELECTOR rồi gọi focus().
// ============================================================

/** Phần tử nhận được focus bằng Tab bên trong hộp thoại (bỏ phần tử vô hiệu và tabindex="-1"). */
export const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Chỉ số phần tử nhận focus sau một lần Tab (shift = Shift+Tab), quay vòng trong hộp thoại.
 * current = -1 khi focus đang ở khung hộp thoại hoặc ngoài danh sách: Tab vào phần tử đầu, Shift+Tab vào phần tử cuối.
 * Trả -1 khi không có phần tử nào: giữ focus ở khung hộp thoại.
 */
export function nextFocusIndex(count: number, current: number, shift: boolean): number {
  if (count <= 0) return -1;
  if (current < 0 || current >= count) return shift ? count - 1 : 0;
  return shift ? (current - 1 + count) % count : (current + 1) % count;
}

/** Phím đóng hộp thoại. "Esc" là giá trị KeyboardEvent.key của trình duyệt cũ. */
export function isEscapeKey(key: string): boolean {
  return key === 'Escape' || key === 'Esc';
}

/** Phần của KeyboardEvent mà các hàm phím đọc (đối tượng giả trong test cũng đủ). */
export interface TrapKeyEvent {
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
  isComposing: boolean;
}

/** Tab trần hoặc Shift+Tab mới bị bẫy; Ctrl/Meta/Alt+Tab (đổi tab, đổi cửa sổ) để trình duyệt xử lý. */
export function isTrapTab(e: TrapKeyEvent): boolean {
  return e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey;
}

/** Esc đóng hộp thoại, trừ khi widget lồng nhau đã dùng nó (defaultPrevented) hoặc đang soạn bằng IME (isComposing). */
export function isCloseEscape(e: TrapKeyEvent): boolean {
  return isEscapeKey(e.key) && !e.defaultPrevented && !e.isComposing;
}
