import styles from './FieldError.module.css';

interface FieldErrorProps {
  message: string;
}

export function FieldError({ message }: FieldErrorProps) {
  return <span className={styles.error} role="alert">{message}</span>;
}
