// ============================================================
// FEATURE: Giới hạn giỏ hàng ở phía UI — hằng số, lý do từ chối của addItem và câu báo cho khách.
// Giới hạn 20 dòng / 99 ly khớp CreateOrderDto của POST /orders (@ArrayMaxSize(20), @Max(99); backend vẫn kiểm lại,
// vượt thì trả 400 lúc trả tiền). Không phụ thuộc store để component trình bày (QtyStepper) import được.
// ============================================================

export const MAX_LINES = 20;
export const MAX_QTY = 99;

export type AddItemFailure = 'MAX_LINES' | 'MAX_QTY' | 'OUT_OF_STOCK' | 'AT_STOCK_LIMIT';
export type AddItemResult = { ok: true } | { ok: false; reason: AddItemFailure };

const MESSAGES: Record<AddItemFailure, string> = {
  MAX_LINES: `Giỏ đã đủ ${MAX_LINES} dòng.`,
  MAX_QTY: `Mỗi dòng tối đa ${MAX_QTY} ly.`,
  OUT_OF_STOCK: 'Món đã hết hàng.',
  AT_STOCK_LIMIT: 'Bạn đã thêm hết số lượng còn lại.',
};

/** Một nơi duy nhất ánh xạ lý do từ chối thành câu hiển thị (ProductCard, ProductDetailModal). */
export function addItemMessage(reason: AddItemFailure): string {
  return MESSAGES[reason];
}

/** Trần của bộ chọn số lượng trong modal: không quá tồn kho, không quá MAX_QTY (addItem từ chối > MAX_QTY); tối thiểu 1. */
export function maxModalQty(stock: number): number {
  return Math.max(1, Math.min(stock, MAX_QTY));
}
