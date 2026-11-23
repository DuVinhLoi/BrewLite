// Reads the VNPay settings from the environment (plan 1.8). Nothing here prints a value.
const DEFAULT_VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const DEFAULT_VNP_API_URL = 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';

export type VnpayConfig = {
  tmnCode: string | null;
  hashSecret: string | null;
  webUrl: string | null;
  vnpUrl: string;
  apiUrl: string;
};

// A blank value counts as missing.
/** Loại bỏ khoảng trắng cấu hình và trả null nếu biến môi trường rỗng hoặc chưa được đặt. */
const read = (value: string | undefined) => value?.trim() || null;

/** Đọc và chuẩn hóa các biến môi trường dùng để kết nối VNPay. */
export function readVnpayConfig(env: NodeJS.ProcessEnv = process.env): VnpayConfig {
  return {
    tmnCode: read(env.VNP_TMN_CODE),
    hashSecret: read(env.VNP_HASH_SECRET),
    webUrl: read(env.WEB_URL),
    vnpUrl: read(env.VNP_URL) ?? DEFAULT_VNP_URL,
    apiUrl: read(env.VNP_API_URL) ?? DEFAULT_VNP_API_URL,
  };
}

// Verifying (IPN, return, QueryDR) needs only the two merchant variables.
/** Kiểm tra cấu hình có mã đơn vị và khóa bí mật cần thiết để xác minh chữ ký VNPay. */
export const canVerify = (config: VnpayConfig): config is VnpayConfig & { tmnCode: string; hashSecret: string } =>
  config.tmnCode !== null && config.hashSecret !== null;

// Creating a new payment URL also needs WEB_URL for vnp_ReturnUrl.
/** Kiểm tra cấu hình đủ thông tin xác minh và địa chỉ web để tạo URL thanh toán. */
export const canCreateUrl = (config: VnpayConfig): config is VnpayConfig & { tmnCode: string; hashSecret: string; webUrl: string } =>
  canVerify(config) && config.webUrl !== null;

// Names only, for the one-line startup warning.
/** Liệt kê tên các biến cấu hình VNPay còn thiếu để hỗ trợ kiểm tra lúc khởi động. */
export function missingVnpayVars(config: VnpayConfig) {
  const missing: string[] = [];
  if (config.tmnCode === null) missing.push('VNP_TMN_CODE');
  if (config.hashSecret === null) missing.push('VNP_HASH_SECRET');
  if (config.webUrl === null) missing.push('WEB_URL');
  return missing;
}

// Throws so that the caller (startup) stops. The error text never contains the configured value.
/** Báo lỗi nếu nhà cung cấp thanh toán được cấu hình không được ứng dụng hỗ trợ. */
export function assertPaymentProvider(env: NodeJS.ProcessEnv = process.env) {
  const provider = read(env.PAYMENT_PROVIDER)?.toLowerCase() ?? 'vnpay';
  if (provider === 'vnpay') return;
  if (provider === 'fake') throw new Error('PAYMENT_PROVIDER=fake is not supported: the fake gateway is not implemented');
  throw new Error('PAYMENT_PROVIDER is not supported (use vnpay)');
}
