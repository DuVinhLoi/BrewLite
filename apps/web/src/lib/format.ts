const formatter = new Intl.NumberFormat('vi-VN');

export function formatVnd(price: number): string {
  return `${formatter.format(price)}đ`;
}
