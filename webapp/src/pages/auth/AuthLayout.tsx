import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Header, Footer } from '../../components/layout';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      <Header variant="landing" />

      <main className={styles.main}>
        <div className={styles.background}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Reach the Right People — Right Where Connections Happen. On Myngly.
            </h1>
            <p className={styles.heroSubtext}>
              Connect with professionals, entrepreneurs, and local communities — and drive real results for your business.
            </p>
            <Link to="/campaign/new" className={styles.heroCta}>
              Create your First Campaign
            </Link>
            <p className={styles.heroDisclaimer}>
              Whether you're a startup founder, student ambassador, or local brand — Myngly Ads helps you get discovered.
            </p>
          </div>
        </div>

        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <Link to="/" className={styles.closeBtn}>
              <X size={24} />
            </Link>
            <div className={styles.modalTitleBar}>
              <span className={styles.modalTitle}>{title}</span>
            </div>
          </div>

          <div className={styles.modalContent}>
            {subtitle && <h2 className={styles.contentTitle}>{subtitle}</h2>}
            {children}
          </div>
        </div>
      </main>

      <Footer variant="landing" />
    </div>
  );
}
