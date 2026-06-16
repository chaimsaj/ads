import { useState, useEffect } from 'react';
import { Button } from '../../components/ui';
import { userApi } from '../../api/user';
import styles from './Settings.module.css';

interface NotificationsModalProps {
  onClose: () => void;
}

interface NotificationSetting {
  id: string;
  backendKey: string;
  title: string;
  description: string;
  enabled: boolean;
  category: 'email' | 'push';
}

export function NotificationsModal({ onClose }: NotificationsModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'campaignUpdates',
      backendKey: 'emailCampaignUpdates',
      title: 'Campaign Updates',
      description: 'Get notified when your campaigns start, pause, or complete',
      enabled: true,
      category: 'email',
    },
    {
      id: 'billing',
      backendKey: 'emailBillingAlerts',
      title: 'Payment & Billing',
      description: 'Receive payment confirmations and billing notifications',
      enabled: true,
      category: 'email',
    },
    {
      id: 'weeklyReports',
      backendKey: 'emailWeeklyReports',
      title: 'Weekly Reports',
      description: 'Receive weekly campaign performance summaries',
      enabled: true,
      category: 'email',
    },
    {
      id: 'productNews',
      backendKey: 'emailProductNews',
      title: 'Tips & Recommendations',
      description: 'Receive tips to improve your campaigns and product news',
      enabled: false,
      category: 'email',
    },
    {
      id: 'pushCampaigns',
      backendKey: 'pushCampaignUpdates',
      title: 'Campaign Push Notifications',
      description: 'Receive push notifications for campaign updates',
      enabled: true,
      category: 'push',
    },
    {
      id: 'pushBilling',
      backendKey: 'pushBillingAlerts',
      title: 'Billing Push Notifications',
      description: 'Receive push notifications for billing alerts',
      enabled: true,
      category: 'push',
    },
  ]);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await userApi.getNotificationSettings();
      setSettings(prev => prev.map(setting => {
        if (setting.backendKey in data) {
          return { ...setting, enabled: data[setting.backendKey] };
        }
        return setting;
      }));
    } catch {
      // Use default settings if API call fails
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = (settingId: string) => {
    setSettings(settings.map(s =>
      s.id === settingId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload: Record<string, boolean> = {};
      settings.forEach(s => {
        payload[s.backendKey] = s.enabled;
      });

      await userApi.updateNotificationSettings(payload);
      onClose();
    } catch {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const emailSettings = settings.filter(s => s.category === 'email');
  const pushSettings = settings.filter(s => s.category === 'push');

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <h2 className={styles.modalTitle}>Notifications</h2>
        <p className={styles.modalDesc}>
          Manage how you receive notifications.
        </p>

        {error && (
          <div className={styles.errorAlert}>
            {error}
          </div>
        )}

        <div className={styles.modalForm}>
          {loading ? (
            <div className={styles.loadingState}>Loading preferences...</div>
          ) : (
            <>
              {/* Email Notifications Section */}
              <div className={styles.sectionTitle}>Email Notifications</div>
              {emailSettings.map((setting) => (
                <div key={setting.id} className={styles.toggleItem}>
                  <div className={styles.toggleLabel}>
                    <span className={styles.toggleTitle}>{setting.title}</span>
                    <span className={styles.toggleDesc}>{setting.description}</span>
                  </div>
                  <button
                    className={`${styles.toggle} ${setting.enabled ? styles.active : ''}`}
                    onClick={() => toggleSetting(setting.id)}
                    aria-label={`Toggle ${setting.title}`}
                    disabled={saving}
                  />
                </div>
              ))}

              {/* Push Notifications Section */}
              <div className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>
                Push Notifications
              </div>
              {pushSettings.map((setting) => (
                <div key={setting.id} className={styles.toggleItem}>
                  <div className={styles.toggleLabel}>
                    <span className={styles.toggleTitle}>{setting.title}</span>
                    <span className={styles.toggleDesc}>{setting.description}</span>
                  </div>
                  <button
                    className={`${styles.toggle} ${setting.enabled ? styles.active : ''}`}
                    onClick={() => toggleSetting(setting.id)}
                    aria-label={`Toggle ${setting.title}`}
                    disabled={saving}
                  />
                </div>
              ))}

              <div className={styles.modalActions}>
                <Button variant="outline" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
