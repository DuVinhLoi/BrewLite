import Link from 'next/link';
import { Handbag, User } from '@phosphor-icons/react/dist/ssr';
import { ROLE_LABEL, type SessionInfo } from '@/lib/auth';
import { isActive, navLinks } from '@/lib/nav';
import styles from './Header.module.css';

export interface HeaderViewProps {
  session: SessionInfo | null;
  pathname: string | null;
  /** Tổng số ly trong giỏ. */
  count: number;
  onLogout: () => void;
}

// Phần hiển thị của header (ui-visual-plan.md §6 mục 1): không router, không store, không effect.
// Phiên, đường dẫn, số ly và hành động đăng xuất do Header.tsx truyền vào.
export default function HeaderView({ session, pathname, count, onLogout }: HeaderViewProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <img src="/doodles/bean.svg" alt="" width={38} height={27} className={styles.bean} />
          <span className={`display ${styles.wordmark}`}>BrewLite</span>
        </Link>

        <nav aria-label="Chính" className={styles.nav}>
          {navLinks().map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={active ? `${styles.navLink} ${styles.navActive}` : styles.navLink}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.side}>
          <Link href="/cart" className={styles.pill}>
            <Handbag size={18} weight="bold" aria-hidden="true" />
            Xem giỏ hàng
            <span className={`tabular ${styles.count}`} aria-label={`${count} món trong giỏ`}>
              {count}
            </span>
          </Link>
          {session ? (
            <>
              <Link href="/profile" className={styles.pill} title={session.email || 'Đã đăng nhập'}>
                <User size={18} weight="bold" aria-hidden="true" />
                {ROLE_LABEL[session.role]}
              </Link>
              <button type="button" onClick={onLogout} className={styles.logout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <Link href="/login" className={styles.pill}>
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
