import type { FormEvent } from 'react';
import { POINTS_SENTENCE, type AuthMode } from '@/lib/login';
import Button from './ui/Button';
import styles from './LoginView.module.css';

// Phần vẽ thuần của /login, tách khỏi page.tsx để render HTML test được (page dùng useRouter và fetch).
// Giao diện nét mực: ui-visual-plan.md §6 mục 8, artboard LoginDoodle.
interface Props {
  mode: AuthMode;
  email: string;
  password: string;
  error: string | null;
  /** Thông báo đăng ký thành công; vùng role="status" luôn có sẵn để trình đọc màn hình báo khi chữ xuất hiện. */
  notice: string | null;
  loading: boolean;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const TABS: { mode: AuthMode; label: string }[] = [
  { mode: 'login', label: 'Đăng nhập' },
  { mode: 'register', label: 'Đăng ký' },
];

export default function LoginView({ mode, email, password, error, notice, loading, onModeChange, onEmailChange, onPasswordChange, onSubmit }: Props) {
  const title = mode === 'login' ? 'Đăng nhập' : 'Đăng ký';

  return (
    <div className={styles.page}>
      <section className={styles.art} aria-labelledby="login-heading">
        <h1 id="login-heading" className={`display ${styles.heading}`}>
          {`${title} để đặt món và theo dõi đơn`}
        </h1>
        <p className={styles.lead}>{POINTS_SENTENCE}</p>
        <img src="/doodles/leaf.svg" alt="" aria-hidden="true" width={240} height={132} className={`${styles.doodle} ${styles.leaf}`} />
        <img src="/doodles/mug.svg" alt="" aria-hidden="true" width={200} height={188} className={`${styles.doodle} ${styles.mug} ${styles.float}`} />
        <img src="/doodles/bean.svg" alt="" aria-hidden="true" width={58} height={41} className={`${styles.doodle} ${styles.bean}`} />
        <img src="/doodles/sparkle.svg" alt="" aria-hidden="true" width={40} height={40} className={`${styles.doodle} ${styles.sparkle}`} />
        <img src="/doodles/burst.svg" alt="" aria-hidden="true" width={30} height={30} className={`${styles.doodle} ${styles.burst}`} />
      </section>

      <section className={styles.card} aria-labelledby="login-form-title">
        <h2 id="login-form-title" className={`display ${styles.formTitle}`}>
          {title}
        </h2>
        <div role="group" aria-label="Chọn thao tác" className={styles.tabs}>
          {TABS.map((t) => (
            <button key={t.mode} type="button" className={styles.tab} aria-pressed={mode === t.mode} onClick={() => onModeChange(t.mode)}>
              {t.label}
            </button>
          ))}
        </div>
        <div role="status" className={styles.status}>
          {notice && (
            <p className={styles.notice}>
              <img src="/doodles/sparkle.svg" alt="" aria-hidden="true" width={18} height={18} className={styles.noticeIcon} />
              <span>{notice}</span>
            </p>
          )}
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="login-email" className={styles.label}>
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="login-password" className={styles.label}>
              Mật khẩu
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              aria-describedby="login-password-hint"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className={styles.input}
            />
            <span id="login-password-hint" className={styles.hint}>
              Ít nhất 6 ký tự.
            </span>
          </div>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <Button variant="cta" type="submit" fullWidth disabled={loading} className={styles.submit}>
            {loading ? 'Đang xử lý…' : title}
          </Button>
        </form>
      </section>
    </div>
  );
}
