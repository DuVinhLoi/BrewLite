'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { homeFor, roleFromToken, saveToken } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'Request failed');
      if (mode === 'register') {
        setMode('login');
        setError(null);
      } else {
        saveToken(data.accessToken);
        router.push(homeFor(roleFromToken(data.accessToken) ?? 'CUSTOMER'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ maxWidth: 400, margin: '40px auto' }}>
      <h1>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={() => setMode('login')} disabled={mode === 'login'}>
          Đăng nhập
        </button>
        <button type="button" onClick={() => setMode('register')} disabled={mode === 'register'}>
          Đăng ký
        </button>
      </div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Mật khẩu (≥6 ký tự)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? '...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </button>
      </form>
    </section>
  );
}
