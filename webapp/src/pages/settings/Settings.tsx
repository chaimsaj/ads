import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, CreditCard, Bell, ChevronRight, LogOut } from 'lucide-react';
import { Header, Footer } from '../../components/layout';
import { Button } from '../../components/ui';
import { EditProfileModal } from './EditProfileModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { BillingMethodsModal } from './BillingMethodsModal';
import { NotificationsModal } from './NotificationsModal';
import { useAuth } from '../../context/AuthContext';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './Settings.module.css';

type ModalType = 'profile' | 'password' | 'billing' | 'notifications' | null;

export function Settings() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);
  const { user, isLoading, refetch } = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Detect return from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('payment_method_added') === 'true') {
      const sid = params.get('session_id');
      window.history.replaceState({}, '', '/settings');
      setStripeSessionId(sid);
      setActiveModal('billing');
    } else if (params.get('payment_method_cancelled') === 'true') {
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayUser = {
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar,
    company: user?.company || '',
    phone: user?.phone || '',
  };

  const settingsItems = [
    {
      id: 'profile',
      icon: User,
      title: 'Edit Profile',
      description: 'Update your personal information and profile picture',
    },
    {
      id: 'password',
      icon: Lock,
      title: 'Change Password',
      description: 'Update your password and security settings',
    },
    {
      id: 'billing',
      icon: CreditCard,
      title: 'Billing Methods',
      description: 'Manage your payment methods and billing information',
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notifications',
      description: 'Configure email and push notification preferences',
    },
  ];

  return (
    <div className={styles.page}>
      <Header variant="dashboard" user={displayUser} />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Settings</h1>
            <p className={styles.subtitle}>
              Manage your account settings and preferences.
            </p>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
          ) : (
            <div className={styles.content}>
              <section className={styles.profileCard}>
                <div className={styles.avatar}>
                  {displayUser.avatar ? (
                    <img src={displayUser.avatar} alt={displayUser.name} />
                  ) : (
                    <span className={styles.avatarInitials}>
                      {displayUser.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                <div className={styles.profileInfo}>
                  <h2 className={styles.profileName}>{displayUser.name}</h2>
                  <p className={styles.profileEmail}>{displayUser.email}</p>
                  <p className={styles.profileCompany}>{displayUser.company}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModal('profile')}
                >
                  Edit Profile
                </Button>
              </section>

              <section className={styles.settingsList}>
                {settingsItems.map((item) => (
                  <button
                    key={item.id}
                    className={styles.settingsItem}
                    onClick={() => setActiveModal(item.id as ModalType)}
                  >
                    <div className={styles.settingsIcon}>
                      <item.icon size={24} />
                    </div>
                    <div className={styles.settingsContent}>
                      <h3 className={styles.settingsTitle}>{item.title}</h3>
                      <p className={styles.settingsDesc}>{item.description}</p>
                    </div>
                    <ChevronRight size={20} className={styles.chevron} />
                  </button>
                ))}
              </section>

              <section className={styles.dangerZone}>
                <h3 className={styles.dangerTitle}>Danger Zone</h3>
                <div className={styles.dangerActions}>
                  <Button variant="outline" leftIcon={<LogOut size={18} />} onClick={handleLogout}>
                    Sign Out
                  </Button>
                  <Button variant="outline" className={styles.deleteBtn}>
                    Delete Account
                  </Button>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      <Footer variant="dashboard" />

      {activeModal === 'profile' && (
        <EditProfileModal
          user={displayUser}
          onClose={() => setActiveModal(null)}
          onSaved={refetch}
        />
      )}

      {activeModal === 'password' && (
        <ChangePasswordModal
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'billing' && (
        <BillingMethodsModal
          onClose={() => { setActiveModal(null); setStripeSessionId(null); }}
          sessionId={stripeSessionId}
        />
      )}

      {activeModal === 'notifications' && (
        <NotificationsModal
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
