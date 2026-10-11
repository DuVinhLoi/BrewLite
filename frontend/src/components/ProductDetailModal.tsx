'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { Product, Size } from '@/lib/types';
import { calcLineTotal, calcUnitPrice, formatVND, SIZE_UPCHARGE, TOPPING_PRICES, DEFAULT_SIZE } from '@/lib/pricing';
import { useCart } from '@/store/cart';
import { addItemMessage, MAX_QTY, maxModalQty } from '@/lib/cart-limits';
import { FOCUSABLE_SELECTOR, isCloseEscape, isTrapTab, nextFocusIndex } from '@/lib/focus-trap';
import Button from './ui/Button';
import LiveNotice from './ui/LiveNotice';
import styles from './ProductDetailModal.module.css';

const SIZES: Size[] = ['S', 'M', 'L'];
const TOPPINGS = Object.keys(TOPPING_PRICES);

// UC01 steps 111-114: size/topping/qty picked here, price recomputed on client, no server call.
// Giao diện nét mực: ui-visual-plan.md §6 mục 4, artboard DetailDoodle. Hộp thoại theo R24: aria-modal, Esc, bẫy focus.
export default function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const addItem = useCart((s) => s.addItem);
  const [size, setSize] = useState<Size>(DEFAULT_SIZE);
  const [toppings, setToppings] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Mở: đưa focus vào khung hộp thoại (trình đọc màn hình đọc tên món). Đóng: trả focus về nút đã mở nó.
  useEffect(() => {
    const opener = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  // Nghe ở document, không ở khung: khi nút + vừa bị vô hiệu thì focus rơi về body, Esc và Tab vẫn phải còn tác dụng.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (isCloseEscape(e)) {
        e.preventDefault();
        onClose();
        return;
      }
      if (!isTrapTab(e)) return;
      e.preventDefault();
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const next = nextFocusIndex(items.length, items.indexOf(document.activeElement as HTMLElement), e.shiftKey);
      (items[next] ?? dialog).focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const unit = calcUnitPrice(product.price, size, toppings);
  const lineTotal = formatVND(calcLineTotal(unit, qty));
  // Trần theo tồn kho và MAX_QTY: addItem từ chối (không cắt) khi xin quá 99, nên bộ chọn không được đi quá đó.
  const maxQty = maxModalQty(product.stock);
  const atMax = qty >= maxQty;
  const plusTitle = !atMax ? 'Tăng' : product.stock < MAX_QTY ? 'Đã chọn hết số lượng còn lại' : `Tối đa ${MAX_QTY} ly mỗi dòng`;

  // Đổi số lượng / size / topping thì thông báo từ lần thêm trước không còn đúng: xóa.
  const toggleTopping = (t: string) => {
    setNotice(null);
    setToppings((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };
  const pickSize = (s: Size) => {
    setNotice(null);
    setSize(s);
  };
  const changeQty = (delta: number) => {
    setNotice(null);
    setQty((q) => Math.min(maxQty, Math.max(1, q + delta)));
  };

  const handleAdd = () => {
    const result = addItem(product, { size, toppings, quantity: Math.min(Math.max(1, qty), maxQty) });
    // Bị từ chối thì giữ modal mở và báo lý do, không đóng như đã thêm.
    if (result.ok) onClose();
    else setNotice(addItemMessage(result.reason));
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ô ảnh: SVG món đã có nền màu theo món; không có ảnh thì ô trống nền mist */}
        <div className={styles.media}>
          {product.imageUrl ? (
            <>
              <img src={product.imageUrl} alt={product.name} width={240} height={180} className={styles.img} />
              <img src="/doodles/sparkle.svg" alt="" aria-hidden="true" width={30} height={30} className={styles.sparkle} />
              <img src="/doodles/burst.svg" alt="" aria-hidden="true" width={24} height={24} className={styles.burst} />
            </>
          ) : null}
        </div>

        <div className={styles.body}>
          <div className={styles.head}>
            <h2 id={titleId} className={`display ${styles.title}`}>
              {product.name}
            </h2>
            <p className={styles.base}>
              Giá gốc: {formatVND(product.price)} • Còn {product.stock}
            </p>
          </div>

          <div className={styles.group}>
            <p id={`${titleId}-size`} className={styles.label}>
              Size
            </p>
            <div role="group" aria-labelledby={`${titleId}-size`} className={styles.chips}>
              {SIZES.map((s) => (
                <button key={s} type="button" className={styles.chip} aria-pressed={size === s} onClick={() => pickSize(s)}>
                  {s} <small className={styles.fee}>+{formatVND(SIZE_UPCHARGE[s])}</small>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <p id={`${titleId}-topping`} className={styles.label}>
              Topping
            </p>
            <div role="group" aria-labelledby={`${titleId}-topping`} className={styles.chips}>
              {TOPPINGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={styles.chip}
                  aria-pressed={toppings.includes(t)}
                  onClick={() => toggleTopping(t)}
                >
                  {t} <small className={styles.fee}>+{formatVND(TOPPING_PRICES[t] ?? 0)}</small>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.qtyRow}>
            <div className={styles.group}>
              <p id={`${titleId}-qty`} className={styles.label}>
                Số lượng
              </p>
              <div role="group" aria-labelledby={`${titleId}-qty`} className={styles.stepper}>
                <button type="button" className={styles.step} onClick={() => changeQty(-1)} aria-label="Giảm">
                  −
                </button>
                <span className={styles.qty}>{qty}</span>
                <button
                  type="button"
                  className={styles.step}
                  onClick={() => changeQty(1)}
                  disabled={atMax}
                  aria-label="Tăng"
                  title={plusTitle}
                >
                  +
                </button>
              </div>
            </div>
            <p className={styles.total}>
              Tạm tính: <strong className={`display ${styles.totalValue}`}>{lineTotal}</strong>
            </p>
          </div>

          <LiveNotice message={notice} className={styles.notice} />

          <div className={styles.actions}>
            <Button variant="ghost" onClick={onClose} className={styles.close}>
              Đóng
            </Button>
            <Button variant="primary" onClick={handleAdd} className={styles.add}>
              Thêm vào giỏ • {lineTotal}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
