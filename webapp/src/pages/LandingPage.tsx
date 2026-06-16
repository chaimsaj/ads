import { Link } from 'react-router-dom';
import { Header, Footer } from '../components/layout';
import { Button } from '../components/ui';
import styles from './LandingPage.module.css';

export function LandingPage() {
  return (
    <div className={styles.page}>
      <Header variant="landing" />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.content}>
            <h1 className={styles.headline}>
              Reach the Right People — Right Where Connections Happen. On Myngly.
            </h1>
            <p className={styles.subtext}>
              Connect with professionals, entrepreneurs, and local communities — and drive real results for your business.
            </p>
            <Link to="/campaign/new">
              <Button variant="primary" size="lg">
                Create your First Campaign
              </Button>
            </Link>
            <p className={styles.disclaimer}>
              Whether you're a startup founder, student ambassador, or local brand — Myngly Ads helps you get discovered.
            </p>
          </div>

          <div className={styles.imageContainer}>
            <div className={styles.imagePlaceholder}>
              <div className={styles.placeholderLines}>
                <div className={styles.line} />
                <div className={styles.line} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer variant="landing" />
    </div>
  );
}
