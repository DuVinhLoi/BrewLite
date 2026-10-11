import { describe, expect, test } from 'vitest';
import {
  BAD_CREDENTIALS,
  EMAIL_TAKEN,
  INITIAL_LOGIN_FORM,
  NETWORK_ERROR,
  POINTS_SENTENCE,
  REGISTER_OK_NOTICE,
  afterRegister,
  authErrorMessage,
  switchMode,
  type LoginFormState,
} from './login';
import { formatVND } from './pricing';
import { VND_FOR_ONE_POINT } from './promo';

// Trang /login (UC03): câu lỗi tiếng Việt thay cho câu tiếng Anh của backend, và chuyển trạng thái form sau đăng ký.
describe('authErrorMessage', () => {
  test('các câu cố định đúng chữ đã chốt', () => {
    expect(EMAIL_TAKEN).toBe('Email đã được đăng ký.');
    expect(BAD_CREDENTIALS).toBe('Sai email hoặc mật khẩu.');
    expect(NETWORK_ERROR).toBe('Không kết nối được máy chủ.');
  });

  test('409 khi đăng ký: "Email đã được đăng ký." (không hiện "Email already registered")', () => {
    expect(authErrorMessage(409, 'Email already registered', 'register')).toBe(EMAIL_TAKEN);
  });

  test('401 khi đăng nhập: "Sai email hoặc mật khẩu." (không hiện "Invalid credentials")', () => {
    expect(authErrorMessage(401, 'Invalid credentials', 'login')).toBe(BAD_CREDENTIALS);
  });

  test('không có phản hồi (mất kết nối): "Không kết nối được máy chủ." ở cả hai chế độ', () => {
    expect(authErrorMessage(null, undefined, 'login')).toBe(NETWORK_ERROR);
    expect(authErrorMessage(null, undefined, 'register')).toBe(NETWORK_ERROR);
  });

  test('400 của ValidationPipe toàn tiếng Anh: câu tiếng Việt ngắn theo chế độ', () => {
    const en = ['email must be an email', 'password must be longer than or equal to 6 characters'];
    expect(authErrorMessage(400, en, 'register')).toBe('Email không hợp lệ hoặc mật khẩu chưa đủ 6 ký tự.');
    expect(authErrorMessage(400, ['email must be an email'], 'login')).toBe('Email hoặc mật khẩu không hợp lệ.');
  });

  test('backend trả câu tiếng Việt thì nối lại như cũ (mảng nối bằng ", ")', () => {
    expect(authErrorMessage(400, ['Email không hợp lệ', 'Mật khẩu quá ngắn'], 'register')).toBe('Email không hợp lệ, Mật khẩu quá ngắn');
    expect(authErrorMessage(503, 'Máy chủ đang bảo trì', 'login')).toBe('Máy chủ đang bảo trì');
  });

  test('mảng lẫn tiếng Anh và tiếng Việt: không hiện câu tiếng Anh, dùng câu dự phòng', () => {
    expect(authErrorMessage(400, ['email must be an email', 'Mật khẩu quá ngắn'], 'register')).toBe(
      'Email không hợp lệ hoặc mật khẩu chưa đủ 6 ký tự.',
    );
  });

  test('mã khác (5xx, 409 khi đăng nhập...) với câu tiếng Anh hoặc không có câu: câu tiếng Việt kèm mã HTTP', () => {
    expect(authErrorMessage(500, 'Internal server error', 'login')).toBe('Không xử lý được yêu cầu (lỗi 500). Thử lại sau.');
    expect(authErrorMessage(502, undefined, 'register')).toBe('Không xử lý được yêu cầu (lỗi 502). Thử lại sau.');
    expect(authErrorMessage(409, 'Email already registered', 'login')).toBe('Không xử lý được yêu cầu (lỗi 409). Thử lại sau.');
  });

  test('không bao giờ trả câu tiếng Anh của backend', () => {
    for (const [status, msg] of [
      [409, 'Email already registered'],
      [401, 'Invalid credentials'],
      [400, 'email must be an email'],
      [500, 'Internal server error'],
    ] as const) {
      for (const mode of ['login', 'register'] as const) expect(authErrorMessage(status, msg, mode)).not.toContain(msg);
    }
  });
});

describe('chuyển trạng thái form', () => {
  const filled: LoginFormState = { mode: 'register', email: 'moi@brewlite.test', password: 'secret1', error: 'cũ', notice: null };

  test('form ban đầu: tab Đăng nhập, ô trống, chưa có lỗi hay thông báo', () => {
    expect(INITIAL_LOGIN_FORM).toEqual({ mode: 'login', email: '', password: '', error: null, notice: null });
  });

  test('đăng ký xong: về tab Đăng nhập, giữ email, xóa mật khẩu, báo "Đăng ký thành công. Đăng nhập bằng email vừa tạo."', () => {
    expect(REGISTER_OK_NOTICE).toBe('Đăng ký thành công. Đăng nhập bằng email vừa tạo.');
    expect(afterRegister(filled)).toEqual({ mode: 'login', email: 'moi@brewlite.test', password: '', error: null, notice: REGISTER_OK_NOTICE });
  });

  test('đổi tab: xóa lỗi và thông báo, giữ email và mật khẩu; bấm lại tab đang chọn thì không đổi gì', () => {
    const notified = afterRegister(filled);
    expect(switchMode(notified, 'register')).toEqual({ mode: 'register', email: 'moi@brewlite.test', password: '', error: null, notice: null });
    expect(switchMode(notified, 'login')).toBe(notified);
    expect(switchMode(filled, 'login')).toEqual({ ...filled, mode: 'login', error: null });
  });
});

describe('POINTS_SENTENCE', () => {
  test('tính từ VND_FOR_ONE_POINT và formatVND, không viết cứng số tiền', () => {
    expect(POINTS_SENTENCE).toBe(`Mỗi ${formatVND(VND_FOR_ONE_POINT)} thanh toán được cộng 1 điểm tích lũy vào hồ sơ của bạn.`);
    expect(POINTS_SENTENCE).toContain('Mỗi 10.000đ thanh toán được cộng 1 điểm');
  });
});
