'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginView from '@/components/LoginView';
import { roleFromToken, saveToken, userIdFromToken } from '@/lib/auth';
import { INITIAL_LOGIN_FORM, afterRegister, authErrorMessage, switchMode, type LoginFormState } from '@/lib/login';
import { clearCheckoutIfOtherUser } from '@/lib/payment/checkout-session';
import { postLoginTarget } from '@/lib/session';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginFormState>(INITIAL_LOGIN_FORM);
  const [loading, setLoading] = useState(false);
  const { mode, email, password } = form;
  const showError = (error: string) => setForm((f) => ({ ...f, error }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setForm((f) => ({ ...f, error: null, notice: null }));
    setLoading(true);
    try {
      // fetch chỉ ném khi không có phản hồi (mất kết nối, máy chủ tắt)
      const res = await fetch(`${API}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).catch(() => null);
      if (!res) return showError(authErrorMessage(null, undefined, mode));
      const data = await res.json().catch(() => ({}));
      // câu tiếng Việt thay câu tiếng Anh của backend (409 trùng email, 401 sai thông tin, 400 ValidationPipe)
      if (!res.ok) return showError(authErrorMessage(res.status, data.message, mode));
      if (mode === 'register') {
        // 201 không cấp token: về tab Đăng nhập, giữ email, xóa mật khẩu, báo "Đăng ký thành công..."
        setForm(afterRegister);
      } else {
        saveToken(data.accessToken);
        // đơn đang trả dở: giữ khi đăng nhập lại đúng tài khoản đã tạo nó (hết phiên giữa lúc trả tiền), bỏ khi là tài khoản khác
        clearCheckoutIfOtherUser(userIdFromToken(data.accessToken));
        // ?next= (từ handleUnauthorized) đưa về trang đang xem lúc hết phiên; chỉ nhận đường dẫn tương đối trong site
        router.push(postLoginTarget(window.location.search, roleFromToken(data.accessToken) ?? 'CUSTOMER'));
      }
    } catch {
      showError('Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoginView
      mode={mode}
      email={email}
      password={password}
      error={form.error}
      notice={form.notice}
      loading={loading}
      onModeChange={(m) => setForm((f) => switchMode(f, m))}
      onEmailChange={(v) => setForm((f) => ({ ...f, email: v }))}
      onPasswordChange={(v) => setForm((f) => ({ ...f, password: v }))}
      onSubmit={submit}
    />
  );
}
