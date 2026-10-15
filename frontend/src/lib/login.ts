// ============================================================
// FEATURE: Trang /login (US-07). Câu lỗi tiếng Việt cho phản hồi của POST /auth/register và POST /auth/login,
// và các bước chuyển trạng thái form. Hàm thuần: app/login/page.tsx gọi, LoginView chỉ vẽ.
// Backend giữ câu tiếng Anh ("Email already registered", "Invalid credentials"); giao diện không hiện chúng.
// ============================================================

import type { Role } from './auth';
import { formatVND } from './pricing';
import { VND_FOR_ONE_POINT } from './promo';

export type AuthMode = 'login' | 'register';

export const EMAIL_TAKEN = 'Email đã được đăng ký.';
export const BAD_CREDENTIALS = 'Sai email hoặc mật khẩu.';
export const NETWORK_ERROR = 'Không kết nối được máy chủ.';
export const REGISTER_OK_NOTICE = 'Đăng ký thành công. Đăng nhập bằng email vừa tạo.';
export const SWAGGER_URL = 'http://localhost:3000/docs';
export const STAFF_LOGIN_MESSAGE = `Tài khoản nhân viên thao tác qua Swagger: ${SWAGGER_URL}`;

/** Web chỉ phục vụ khách: BARISTA / ADMIN không được lưu phiên, trả câu chỉ sang Swagger; CUSTOMER (hoặc không rõ) → null. */
export function staffLoginMessage(role: Role | null): string | null {
  return role === 'BARISTA' || role === 'ADMIN' ? STAFF_LOGIN_MESSAGE : null;
}

/** Câu về điểm ở panel trái, tính từ hằng số tích điểm (1 điểm cho mỗi VND_FOR_ONE_POINT). */
export const POINTS_SENTENCE = `Mỗi ${formatVND(VND_FOR_ONE_POINT)} thanh toán được cộng 1 điểm tích lũy vào hồ sơ của bạn.`;

const INVALID_INPUT: Record<AuthMode, string> = {
  register: 'Email không hợp lệ hoặc mật khẩu chưa đủ 6 ký tự.',
  login: 'Email hoặc mật khẩu không hợp lệ.',
};

// Câu có chữ ngoài ASCII (dấu tiếng Việt) thì coi là tiếng Việt; câu mặc định của Nest / class-validator toàn ASCII.
const isVietnamese = (s: string) => /[^\x00-\x7F]/.test(s);

/**
 * Câu lỗi hiện cho người dùng. status null = không có phản hồi (mất kết nối).
 * backendMessage: trường `message` của body lỗi (chuỗi, hoặc mảng chuỗi của ValidationPipe).
 */
export function authErrorMessage(status: number | null, backendMessage: unknown, mode: AuthMode): string {
  if (status === null) return NETWORK_ERROR;
  if (mode === 'register' && status === 409) return EMAIL_TAKEN;
  if (mode === 'login' && status === 401) return BAD_CREDENTIALS;
  const raw = Array.isArray(backendMessage) ? backendMessage : [backendMessage];
  const messages = raw.filter((m): m is string => typeof m === 'string' && m.trim() !== '');
  if (messages.length > 0 && messages.every(isVietnamese)) return messages.join(', ');
  if (status === 400) return INVALID_INPUT[mode];
  return `Không xử lý được yêu cầu (lỗi ${status}). Thử lại sau.`;
}

export interface LoginFormState {
  mode: AuthMode;
  email: string;
  password: string;
  error: string | null;
  /** Thông báo role="status" (đăng ký thành công). */
  notice: string | null;
}

export const INITIAL_LOGIN_FORM: LoginFormState = { mode: 'login', email: '', password: '', error: null, notice: null };

/** Đổi tab: xóa lỗi và thông báo của tab cũ; bấm lại tab đang chọn thì giữ nguyên. */
export function switchMode(form: LoginFormState, mode: AuthMode): LoginFormState {
  return form.mode === mode ? form : { ...form, mode, error: null, notice: null };
}

/** Đăng ký xong (201, không cấp token): về tab Đăng nhập, giữ email vừa gõ, xóa mật khẩu, báo thành công. */
export function afterRegister(form: LoginFormState): LoginFormState {
  return { ...form, mode: 'login', password: '', error: null, notice: REGISTER_OK_NOTICE };
}
