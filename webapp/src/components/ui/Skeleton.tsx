import styles from './Skeleton.module.css';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton components for common use cases
export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <Skeleton variant="rectangular" height={200} />
      <div className={styles.cardContent}>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr className={styles.tableRow}>
      <td><Skeleton variant="rectangular" width={16} height={16} /></td>
      <td><Skeleton variant="text" width={40} /></td>
      <td><Skeleton variant="text" width="80%" /></td>
      <td><Skeleton variant="rectangular" width={80} height={48} /></td>
      <td><Skeleton variant="text" width={120} /></td>
      <td><Skeleton variant="rectangular" width={40} height={22} /></td>
      <td><Skeleton variant="rectangular" width={80} height={24} /></td>
      <td><Skeleton variant="text" width={60} /></td>
      <td><Skeleton variant="text" width={60} /></td>
      <td>
        <div className={styles.actions}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </div>
      </td>
    </tr>
  );
}

export function SkeletonStatCard() {
  return (
    <div className={styles.statCard}>
      <div className={styles.statContent}>
        <Skeleton variant="text" width="60%" height={14} />
        <Skeleton variant="text" width="40%" height={20} />
        <Skeleton variant="text" width="80%" height={12} />
      </div>
      <Skeleton variant="circular" width={56} height={56} />
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className={styles.form}>
      <Skeleton variant="text" width={100} height={14} />
      <Skeleton variant="rectangular" width="100%" height={44} />
      <Skeleton variant="text" width={100} height={14} />
      <Skeleton variant="rectangular" width="100%" height={44} />
      <Skeleton variant="text" width={100} height={14} />
      <Skeleton variant="rectangular" width="100%" height={100} />
      <Skeleton variant="rectangular" width={120} height={44} />
    </div>
  );
}
