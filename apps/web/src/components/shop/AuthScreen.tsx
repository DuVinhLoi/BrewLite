'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { shopApi } from '@/lib/shop';
import { useShop } from './ShopProvider';
export function AuthScreen({ register = false }: { register?: boolean }) {
  const shop = useShop();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  useEffect(() => { if (new URLSearchParams(window.location.search).has('expired')) Promise.resolve().then(() => setError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? ''); const password = String(form.get('password') ?? '');
    const errors: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email không hợp lệ';
    if (!password || new TextEncoder().encode(password).length > 72 || (register && (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)))) errors.password = 'Mật Khẩu cần ít nhất 8 ký tự gồm chữ và số';
    setFields(errors); if (Object.keys(errors).length) return;
    setBusy(true); setError('');
    try {
      if (register) await shopApi('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
      const result = await shopApi<{ accessToken: string; user: { email: string; role: string } }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      shop.login({ token: result.accessToken, ...result.user });
      const next = new URLSearchParams(window.location.search).get('next');
      router.push(next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/');
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  return <main className="shop-page"><h1>{register ? 'Đăng ký' : 'Đăng nhập'}</h1><form onSubmit={submit} noValidate><label>Email<input name="email" type="email" autoComplete="email" required aria-invalid={!!fields.email} /></label>{fields.email && <p role="alert">{fields.email}</p>}<label>Mật khẩu<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required aria-invalid={!!fields.password} /></label>{fields.password && <p role="alert">{fields.password}</p>}{error && <p role="alert">{error}</p>}<button disabled={busy}>{busy ? 'Đang xử lý…' : register ? 'Tạo tài khoản' : 'Đăng nhập'}</button></form><Link href={register ? '/login' : '/register'}>{register ? 'Đã có tài khoản? Đăng nhập' : 'Tạo tài khoản mới'}</Link></main>;
}
