import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

interface FooterProps {
  variant?: 'landing' | 'dashboard';
}

export function Footer({ variant = 'landing' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (variant === 'dashboard') {
    return (
      <footer className={styles.dashboardFooter}>
        <div className={styles.dashboardContainer}>
          <div className={styles.dashboardLogo}>
            <MynglyLogoSmall />
            <span className={styles.brandName}>myngly</span>
            <span className={styles.tagline}>where your connections are</span>
          </div>
          <div className={styles.dashboardLinks}>
            <Link to="/help" className={styles.link}>Help</Link>
            <Link to="/privacy" className={styles.link}>Privacy & Terms</Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <span className={styles.copyright}>© {currentYear} Myngly</span>
        <span className={styles.separator}>•</span>
        <Link to="/terms" className={styles.link}>Terms of Use</Link>
        <span className={styles.separator}>•</span>
        <Link to="/privacy" className={styles.link}>Privacy Policy</Link>
      </div>
    </footer>
  );
}

function MynglyLogoSmall() {
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#90DDF0" />
      <circle cx="20" cy="20" r="12" fill="#2C666E" />
      <circle cx="20" cy="20" r="6" fill="#90DDF0" />
    </svg>
  );
}
