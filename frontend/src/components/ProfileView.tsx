import Link from 'next/link';
import type { Profile } from '@/lib/api';
import { ROLE_LABEL } from '@/lib/auth';

// Phần hiển thị của /profile, tách khỏi page.tsx vì Next 14 không cho file trang export thêm tên khác.
// token: undefined = chưa đọc localStorage, null = đã đọc và chưa đăng nhập, chuỗi = đã đăng nhập.
interface Props {
  token: string | null | undefined;
  profile: Profile | null;
  error: string | null;
}

export default function ProfileView({ token, profile, error }: Props) {
  if (token === undefined) return null;
  if (!token)
    return (
      <section style={{ maxWidth: 480, margin: '40px auto' }}>
        <h1>Hồ sơ</h1>
        <p>
          Bạn chưa đăng nhập. <Link href="/login">Đăng nhập</Link>
        </p>
      </section>
    );
  if (error)
    return (
      <p role="alert" style={{ color: 'red' }}>
        {error} <Link href="/login">Đăng nhập</Link>
      </p>
    );
  if (!profile) return <p>Đang tải…</p>;

  return (
    <section style={{ maxWidth: 480, margin: '24px auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h1>Hồ sơ</h1>
      <dl style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
        <dt style={{ color: '#6b7280' }}>Email</dt>
        <dd style={{ margin: 0, fontWeight: 600 }}>{profile.email}</dd>
        <dt style={{ color: '#6b7280' }}>Vai trò</dt>
        <dd style={{ margin: 0, fontWeight: 600 }}>{ROLE_LABEL[profile.role]}</dd>
        <dt style={{ color: '#6b7280' }}>Điểm tích lũy</dt>
        <dd style={{ margin: 0, fontWeight: 700, color: '#065f46' }}>{profile.loyaltyPoints.toLocaleString('vi-VN')} điểm</dd>
      </dl>
      <Link href="/history">Xem lịch sử đơn hàng</Link>
    </section>
  );
}
