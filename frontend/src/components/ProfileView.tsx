import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Profile } from '@/lib/api';
import { ROLE_LABEL } from '@/lib/auth';
import { formatVND } from '@/lib/pricing';
import { VND_FOR_ONE_POINT } from '@/lib/promo';
import GuestState from './GuestState';
import styles from './ProfileView.module.css';

// Phần hiển thị của /profile, tách khỏi page.tsx vì Next 14 không cho file trang export thêm tên khác.
// token: undefined = chưa đọc sessionStorage, null = đã đọc và chưa đăng nhập, chuỗi = đã đăng nhập.
// Giao diện nét mực: ui-visual-plan.md §6 mục 9 (artboard ProfileDoodle) và mục 11 (chưa đăng nhập: GuestState, dùng chung với /history).
interface Props {
  token: string | null | undefined;
  profile: Profile | null;
  error: string | null;
}

function Page({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <h1 className={`display ${styles.title}`}>Hồ sơ</h1>
      {children}
    </div>
  );
}

const decor = (src: string, w: number, h: number, cls: string) => (
  <img src={src} alt="" aria-hidden="true" width={w} height={h} className={`${styles.doodle} ${cls}`} />
);

export default function ProfileView({ token, profile, error }: Props) {
  if (token === undefined) return null;
  if (!token)
    return (
      <Page>
        <GuestState nextPath="/profile" />
      </Page>
    );
  if (error)
    return (
      <Page>
        <p role="alert" className={styles.error}>
          {error} <Link href="/login">Đăng nhập</Link>
        </p>
      </Page>
    );
  if (!profile)
    return (
      <Page>
        <p className={styles.loading}>Đang tải…</p>
      </Page>
    );

  return (
    <Page>
      <div className={styles.grid}>
        <section className={styles.pointsBlock} aria-labelledby="profile-points">
          <h2 id="profile-points" className={styles.pointsLabel}>
            Điểm tích lũy
          </h2>
          <p className={styles.pointsLine}>
            <span className={`display ${styles.points}`}>{profile.loyaltyPoints.toLocaleString('vi-VN')}</span>
            <span className={`display ${styles.pointsUnit}`}>điểm</span>
          </p>
          <p className={styles.pointsNote}>Mỗi {formatVND(VND_FOR_ONE_POINT)} thanh toán được 1 điểm.</p>
          {decor('/doodles/bean.svg', 70, 50, styles.bean1)}
          {decor('/doodles/bean.svg', 50, 36, styles.bean2)}
          {decor('/doodles/bean.svg', 58, 41, styles.bean3)}
          {decor('/doodles/sparkle.svg', 30, 30, styles.sparkle)}
        </section>

        <section className={styles.card} aria-label="Thông tin tài khoản">
          <dl className={styles.info}>
            <dt className={styles.term}>Email</dt>
            <dd className={styles.email}>{profile.email}</dd>
            <dt className={styles.term}>Vai trò</dt>
            <dd className={styles.value}>
              <span className={styles.role}>{ROLE_LABEL[profile.role]}</span>
            </dd>
          </dl>
          <img src="/doodles/mug.svg" alt="" aria-hidden="true" width={120} height={113} className={styles.mug} />
          <Link href="/history" className={styles.historyLink}>
            Xem lịch sử đơn hàng{' '}
            <span className={styles.arrow} aria-hidden="true">
              ↗
            </span>
          </Link>
        </section>
      </div>
    </Page>
  );
}
