import { formatVND } from '@/lib/pricing';
import { VND_FOR_ONE_POINT, VOUCHER_CODE, VOUCHER_PERCENT } from '@/lib/promo';
import type { MenuSummary } from '@/lib/menu-summary';
import styles from './MenuHero.module.css';

// Nét mực của bộ minh họa (§4): dày 3, đầu tròn; màu lấy từ CSS (color: var(--ink)).
const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round' } as const;

interface Props {
  /** "N món / giá từ X". null khi menu đang tải, lỗi hoặc rỗng: dòng này ẩn đi. */
  summary: MenuSummary | null;
}

// Hero trang Menu (ui-visual-plan.md §6 mục 2, artboard MenuDoodle).
// Số ở cột trái chỉ lấy từ lib/promo.ts; số ở cột phải chỉ lấy từ menu đã tải. Mọi hình là trang trí (alt="", aria-hidden).
export default function MenuHero({ summary }: Props) {
  return (
    <section className={styles.hero} aria-labelledby="menu-hero-title">
      <h1 id="menu-hero-title" className={`display ${styles.title}`}>
        {/* Khoảng trắng giữa hai dòng: tên đọc được "ngày pha", không dính "ngàypha" khi đọc màn hình hoặc chép chữ. */}
        <span className={styles.line}>Cà phê mỗi ngày</span>{' '}
        <span className={`${styles.line} ${styles.accentLine}`}>pha đúng vị</span>
      </h1>

      <div className={styles.grid}>
        <div className={styles.side}>
          <img src="/doodles/bag.svg" alt="" width={112} height={119} className={`${styles.bag} ${styles.hideSm}`} />
          <ul className={styles.stats}>
            <li>
              <p className={`display ${styles.stat}`}>
                {VOUCHER_PERCENT}
                <span className={styles.statMark}>%</span>
              </p>
              <p className={styles.statLabel}>{`giảm với mã ${VOUCHER_CODE}`}</p>
            </li>
            <li>
              <p className={`display ${styles.stat}`}>
                <span className={styles.statMark}>+</span>1
              </p>
              <p className={styles.statLabel}>{`điểm cho mỗi ${formatVND(VND_FOR_ONE_POINT)}`}</p>
            </li>
          </ul>
        </div>

        <div className={styles.stage} aria-hidden="true">
          <div className={styles.scene}>
            {/* Hơi nước và mũi tên: path inline pathLength=1 để vẽ nét bằng stroke-dashoffset (CSS, chỉ khi không giảm chuyển động) */}
            <svg className={styles.steam} viewBox="0 0 160 150" {...STROKE} aria-hidden="true" focusable="false">
              <path
                pathLength={1}
                d="M8 146 C40 140 30 104 60 98 C92 92 102 124 82 128 C62 132 56 98 86 72 C112 50 142 72 126 88 C110 104 94 72 120 46 C140 26 168 40 158 8"
              />
            </svg>
            <svg className={`${styles.arrow} ${styles.hideSm}`} viewBox="0 0 170 150" {...STROKE} aria-hidden="true" focusable="false">
              <path pathLength={1} d="M30 6 C-4 52 22 112 70 104 C104 98 100 56 76 66 C52 76 70 132 150 128" />
              <path pathLength={1} d="M150 128 L130 114 M150 128 L132 144" />
            </svg>
            <img src="/doodles/moka.svg" alt="" width={290} height={387} className={styles.moka} />
            <img src="/doodles/mug.svg" alt="" width={150} height={141} className={styles.mug} />
            <div className={`${styles.leafLeft} ${styles.hideSm}`}>
              <img src="/doodles/leaf.svg" alt="" width={220} height={121} className={styles.sway} />
            </div>
            <div className={styles.leafRight}>
              <img src="/doodles/leaf.svg" alt="" width={210} height={116} className={styles.sway} />
            </div>
            <img src="/doodles/bean.svg" alt="" width={64} height={46} className={styles.beanLeft} />
            <img src="/doodles/bean.svg" alt="" width={58} height={41} className={styles.beanRight} />
            <img src="/doodles/burst.svg" alt="" width={40} height={40} className={`${styles.spark} ${styles.spark1}`} />
            <img src="/doodles/sparkle.svg" alt="" width={44} height={44} className={`${styles.spark} ${styles.spark2}`} />
            <img src="/doodles/sparkle.svg" alt="" width={30} height={30} className={`${styles.spark} ${styles.spark3}`} />
            <img src="/doodles/burst.svg" alt="" width={28} height={28} className={`${styles.spark} ${styles.spark4}`} />
            <svg className={styles.dots} viewBox="0 0 120 40" fill="currentColor" aria-hidden="true" focusable="false">
              <circle cx="8" cy="10" r="2.4" />
              <circle cx="22" cy="24" r="2" />
              <circle cx="40" cy="14" r="1.8" />
              <circle cx="96" cy="20" r="2.2" />
              <circle cx="112" cy="8" r="1.8" />
            </svg>
          </div>
        </div>

        <div className={`${styles.side} ${styles.right}`}>
          <div className={styles.pitch}>
            <p className={styles.lede}>Chọn món, thanh toán không tiền mặt, nhận ly khi quầy báo sẵn sàng.</p>
            <a href="#menu" className={styles.cta}>
              Đặt cà phê{' '}
              <span className={styles.ctaArrow} aria-hidden="true">
                ↗
              </span>
            </a>
          </div>
          <div className={styles.proof}>
            <div className={styles.dishes} aria-hidden="true">
              <span className={`${styles.dish} ${styles.dishLatte}`}>
                <img src="/images/latte.svg" alt="" width={54} height={41} />
              </span>
              <span className={`${styles.dish} ${styles.dishAmericano}`}>
                <img src="/images/americano.svg" alt="" width={54} height={41} />
              </span>
              <span className={`${styles.dish} ${styles.dishTraDao}`}>
                <img src="/images/tra-dao.svg" alt="" width={54} height={41} />
              </span>
            </div>
            {summary && (
              <>
                <p className={`display ${styles.count}`}>{`${summary.count} món`}</p>
                <p className={styles.from}>{`giá từ ${formatVND(summary.minPrice)}`}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
