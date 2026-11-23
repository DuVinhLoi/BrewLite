const formatter = new Intl.NumberFormat('vi-VN');

/** Định dạng số tiền theo cách viết Việt Nam và thêm ký hiệu đồng. */
export function formatVnd(price: number): string {
  return `${formatter.format(price)}đ`;
}
