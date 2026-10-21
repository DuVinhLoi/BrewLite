import type { ReactNode } from 'react';
import styles from './MenuSection.module.css';

// Khối lưới món (ui-visual-plan.md §6 mục 3, artboard MenuDoodle): đích của CTA "Đặt cà phê" (#menu),
// Hand-drawn menu heading and the existing ProductGrid.
export default function MenuSection({ children }: { children: ReactNode }) {
  return (
    <section id="menu" aria-labelledby="menu-heading" className={styles.section}>
      <div className={styles.head}>
        <div className={styles.titleWrap}>
          <h2 id="menu-heading" className={`display ${styles.title}`}>
            Menu hôm nay
          </h2>
          <svg className={styles.underline} viewBox="0 0 260 20" aria-hidden="true" focusable="false">
            <path
              d="M4 12 C40 2 70 20 108 10 C146 0 176 18 214 8 C230 4 244 6 256 10"
              fill="none"
              stroke="currentColor"
              strokeWidth={5}
              strokeLinecap="round"
            />
          </svg>
          <img src="/doodles/sparkle.svg" alt="" width={30} height={30} className={styles.sparkle} />
        </div>
        <p className={styles.voucher}>
          Chọn món yêu thích, thêm vào giỏ và thanh toán bằng ví hoặc thẻ.
        </p>
      </div>
      {children}
    </section>
  );
}
