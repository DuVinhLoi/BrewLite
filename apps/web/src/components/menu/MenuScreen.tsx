'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchProducts, type Product } from '@/lib/api';
import { ProductCard } from './ProductCard';
import styles from './MenuScreen.module.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; products: Product[] };

const SKELETON_COUNT = 4;

export function MenuScreen() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetchProducts(controller.signal)
      .then((products) => {
        setState({ status: 'ready', products });
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }
        setState({ status: 'error' });
      });

    return () => {
      controller.abort();
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.brand}>BrewLite</p>
        <h1 className={styles.title}>Thực đơn</h1>
        <p className={styles.subtitle}>Đồ uống pha chế mỗi ngày</p>
      </header>

      <main className={styles.content}>
        {state.status === 'loading' && (
          <section className={styles.skeletonSection} role="status" aria-busy="true">
            <span className={styles.srOnly}>Đang tải thực đơn…</span>
            <ul className={styles.grid} aria-hidden="true">
              {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <li key={index} className={styles.skeletonCard}>
                  <div className={styles.skeletonImage} />
                  <div className={styles.skeletonLine} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {state.status === 'error' && (
          <section className={styles.errorBlock} role="alert">
            <p className={styles.errorTitle}>Không tải được thực đơn</p>
            <p className={styles.errorDetail}>Vui lòng kiểm tra kết nối và thử lại.</p>
            <button type="button" className={styles.retryButton} onClick={retry}>
              Thử lại
            </button>
          </section>
        )}

        {state.status === 'ready' && state.products.length === 0 && (
          <section className={styles.emptyBlock}>
            <p className={styles.emptyTitle}>Hiện chưa có món nào</p>
            <p className={styles.emptyDetail}>Quay lại sau nhé!</p>
          </section>
        )}

        {state.status === 'ready' && state.products.length > 0 && (
          <ul className={styles.grid} aria-label="Danh sách đồ uống">
            {state.products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
