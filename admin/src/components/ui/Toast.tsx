import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast, type Toast as ToastType } from '../../context/ToastContext';
import styles from './Toast.module.css';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

function ToastItem({ toast }: { toast: ToastType }) {
  const { removeToast } = useToast();
  const Icon = icons[toast.type];

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      <Icon size={20} className={styles.icon} />
      <span className={styles.message}>{toast.message}</span>
      <button
        className={styles.closeBtn}
        onClick={() => removeToast(toast.id)}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
