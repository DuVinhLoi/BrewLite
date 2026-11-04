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
const read = (value: string | undefined) => value?.trim() || null;

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
export const canVerify = (config: VnpayConfig): config is VnpayConfig & { tmnCode: string; hashSecret: string } =>
  config.tmnCode !== null && config.hashSecret !== null;

// Creating a new payment URL also needs WEB_URL for vnp_ReturnUrl.
export const canCreateUrl = (config: VnpayConfig): config is VnpayConfig & { tmnCode: string; hashSecret: string; webUrl: string } =>
  canVerify(config) && config.webUrl !== null;

// Names only, for the one-line startup warning.
export function missingVnpayVars(config: VnpayConfig) {
  const missing: string[] = [];
  if (config.tmnCode === null) missing.push('VNP_TMN_CODE');
  if (config.hashSecret === null) missing.push('VNP_HASH_SECRET');
  if (config.webUrl === null) missing.push('WEB_URL');
  return missing;
}

// Throws so that the caller (startup) stops. The error text never contains the configured value.
export function assertPaymentProvider(env: NodeJS.ProcessEnv = process.env) {
  const provider = read(env.PAYMENT_PROVIDER)?.toLowerCase() ?? 'vnpay';
  if (provider === 'vnpay') return;
  if (provider === 'fake') throw new Error('PAYMENT_PROVIDER=fake is not supported: the fake gateway is not implemented');
  throw new Error('PAYMENT_PROVIDER is not supported (use vnpay)');
}
