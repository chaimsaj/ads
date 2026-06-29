import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', dot = false, className = '', children, ...props }, ref) => {
    const classNames = [styles.badge, styles[variant], styles[size], className]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={classNames} {...props}>
        {dot && <span className={styles.dot} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status badge helper
export const StatusBadge = ({ status }: { status: string }) => {
  const variantMap: Record<string, BadgeVariant> = {
    active: 'success',
    inactive: 'default',
    suspended: 'error',
    paused: 'warning',
    scheduled: 'info',
    completed: 'default',
    review: 'warning',
    rejected: 'error',
    draft: 'default',
    super_admin: 'primary',
    admin: 'primary',
    moderator: 'info',
    viewer: 'default',
    user: 'default',
    advertiser: 'info',
  };

  // Accept wire values (e.g. "super_admin") and render a human-readable, title-cased label.
  const label = status
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <Badge variant={variantMap[status] || 'default'} dot>
      {label}
    </Badge>
  );
};
