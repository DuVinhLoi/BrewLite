'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/store/cart';
import styles from './Header.module.css';

// FEATURE: App header — menu navigation and live cart count.
export default function Header() {
  const count = useCart((s) => s.count);
  const pathname = usePathname();

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <img src="/doodles/bean.svg" alt="" width={38} height={27} className={styles.bean} />
          <span className={`display ${styles.wordmark}`}>BrewLite</span>
        </Link>
        <nav aria-label="Chính" className={styles.nav}>
          <Link
            href="/"
            className={pathname === '/' ? `${styles.navLink} ${styles.navActive}` : styles.navLink}
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            Menu
          </Link>
        </nav>
        <Link href="/cart" className={styles.pill} aria-current={pathname === '/cart' ? 'page' : undefined}>
          Xem giỏ hàng
          <span className={`tabular ${styles.count}`} aria-label={`${count} món trong giỏ`}>
            {count}
          </span>
        </Link>
      </div>
    </header>
  );
}
