export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
};

export class ApiError extends Error {
  readonly status: number;

  /** Tạo lỗi API có thông báo và mã HTTP để giao diện phân biệt nguyên nhân thất bại. */
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Lấy địa chỉ API từ cấu hình web; mặc định dùng API local ở cổng 4000. */
export function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
}

/** Gọi API lấy thực đơn mới nhất và ném ApiError nếu máy chủ trả lỗi. */
export async function fetchProducts(signal?: AbortSignal): Promise<Product[]> {
  const response = await fetch(`${apiBaseUrl()}/products`, {
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new ApiError(`Không tải được thực đơn (mã ${response.status}).`, response.status);
  }

  return (await response.json()) as Product[];
}
