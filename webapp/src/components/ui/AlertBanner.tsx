import styles from './AlertBanner.module.css';

interface AlertBannerProps {
  message: string;
}

export function AlertBanner({ message }: AlertBannerProps) {
  return <div className={styles.banner} role="alert">{message}</div>;
}
