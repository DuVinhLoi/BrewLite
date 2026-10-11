import styles from './Skeleton.module.css';

export default function Skeleton({ height, width = '100%' }: { height: number; width?: number | string }) {
  return <div aria-hidden="true" className={styles.skeleton} style={{ height, width }} />;
}
