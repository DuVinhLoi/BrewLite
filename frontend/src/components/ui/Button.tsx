import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'cta' | 'ghost' | 'link' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: Variant;
  size?: 'md' | 'lg';
  fullWidth?: boolean;
}

// cta = CTA lớn bo 14px kèm mũi tên ↗ cam (ui-visual-plan.md §3.3). Mũi tên là ký tự chữ, không phải icon.
export default function Button({ variant, size = 'md', fullWidth, className, type = 'button', children, ...rest }: ButtonProps) {
  const cls = [styles.btn, styles[variant], styles[size], fullWidth ? styles.full : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <button {...rest} type={type} className={cls}>
      {children}
      {variant === 'cta' && (
        <span className={styles.arrow} aria-hidden="true">
          ↗
        </span>
      )}
    </button>
  );
}
