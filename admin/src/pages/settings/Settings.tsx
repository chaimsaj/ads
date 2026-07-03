import { useState, useEffect, useCallback } from 'react';
import { Save, AlertTriangle, Globe, DollarSign, Shield, Bell, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, ConfirmDialog } from '../../components/ui';
import { settingsApi } from '../../api/settings';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';
import { isApiError } from '../../api/client';
import type { AdminSettings } from '../../types';
import styles from './Settings.module.css';

export function Settings() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.SETTINGS_WRITE);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [dangerConfirm, setDangerConfirm] = useState<{
    isOpen: boolean;
    action: string;
    label: string;
  }>({ isOpen: false, action: '', label: '' });

  const fetchSettings = useCallback(async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data);
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Failed to load settings';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: keyof AdminSettings, value: string | number | boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await settingsApi.update(settings);
      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Failed to save settings';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDangerAction = async () => {
    const { action } = dangerConfirm;
    try {
      if (action === 'purge-data') {
        toast.warning('Data purge is not available in this environment');
      }
    } catch (err) {
      const message = isApiError(err) ? err.message : `Failed to ${action}`;
      toast.error(message);
    } finally {
      setDangerConfirm({ isOpen: false, action: '', label: '' });
    }
  };

  const sections = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'billing', label: 'Billing', icon: DollarSign },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'maintenance', label: 'Maintenance', icon: Database },
  ];

  if (isLoading || !settings) {
    return (
      <div className={styles.settings}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Settings</h1>
            <p className={styles.subtitle}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.settings}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Manage your admin panel configuration</p>
        </div>
        {hasChanges && canWrite && (
          <Button leftIcon={<Save size={16} />} onClick={handleSave} loading={isSaving}>
            Save Changes
          </Button>
        )}
      </div>

      <div className={styles.content}>
        <nav className={styles.sidebar}>
          {sections.map((section) => (
            <button
              key={section.id}
              className={`${styles.navItem} ${activeSection === section.id ? styles.active : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <section.icon size={18} />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.main}>
          {activeSection === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={styles.form}>
                  <Input
                    label="Site Name"
                    value={settings.siteName}
                    onChange={(e) => handleChange('siteName', e.target.value)}
                  />
                  <Input
                    label="Support Email"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleChange('supportEmail', e.target.value)}
                  />
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Default Currency</label>
                    <select
                      value={settings.defaultCurrency}
                      onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                      className={styles.select}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'billing' && (
            <Card>
              <CardHeader>
                <CardTitle>Billing Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={styles.form}>
                  <Input
                    label="Minimum Budget ($)"
                    type="number"
                    value={settings.minBudget}
                    onChange={(e) => handleChange('minBudget', parseInt(e.target.value) || 0)}
                    hint="Minimum campaign budget allowed"
                  />
                  <Input
                    label="Maximum Budget ($)"
                    type="number"
                    value={settings.maxBudget}
                    onChange={(e) => handleChange('maxBudget', parseInt(e.target.value) || 0)}
                    hint="Maximum campaign budget allowed"
                  />
                  <Input
                    label="Commission Rate (%)"
                    type="number"
                    value={settings.commissionRate}
                    onChange={(e) => handleChange('commissionRate', parseInt(e.target.value) || 0)}
                    hint="Platform commission on each campaign"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={styles.form}>
                  <div className={styles.toggle}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Auto-approve campaigns</span>
                      <span className={styles.toggleHint}>
                        Automatically approve campaigns that pass moderation checks
                      </span>
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={settings.autoApprove}
                        onChange={(e) => handleChange('autoApprove', e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.securityNote}>
                    <Shield size={20} />
                    <div>
                      <strong>Two-Factor Authentication</strong>
                      <p>All admin accounts require 2FA for enhanced security.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={styles.form}>
                  <div className={styles.toggle}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Email notifications</span>
                      <span className={styles.toggleHint}>Receive email for new campaigns pending review</span>
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.toggle}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Push notifications</span>
                      <span className={styles.toggleHint}>Browser push notifications for urgent alerts</span>
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={settings.pushNotifications}
                        onChange={(e) => handleChange('pushNotifications', e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.toggle}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Weekly reports</span>
                      <span className={styles.toggleHint}>Receive weekly summary of platform activity</span>
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={settings.weeklyReports}
                        onChange={(e) => handleChange('weeklyReports', e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'maintenance' && (
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={styles.form}>
                  <div className={`${styles.toggle} ${settings.maintenanceMode ? styles.danger : ''}`}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>Enable maintenance mode</span>
                      <span className={styles.toggleHint}>
                        Users will see a maintenance page and cannot access the platform
                      </span>
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={settings.maintenanceMode}
                        onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  {settings.maintenanceMode && (
                    <div className={styles.maintenanceWarning}>
                      <AlertTriangle size={20} />
                      <div>
                        <strong>Maintenance mode is active</strong>
                        <p>
                          The platform is currently inaccessible to regular users. Only admins can
                          access the dashboard.
                        </p>
                      </div>
                    </div>
                  )}

                  {canWrite && (
                    <div className={styles.dangerZone}>
                      <h4>Danger Zone</h4>
                      <p>These actions are irreversible. Please proceed with caution.</p>
                      <div className={styles.dangerActions}>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDangerConfirm({ isOpen: true, action: 'purge-data', label: 'Purge All Data' })}
                        >
                          Purge All Data
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={dangerConfirm.isOpen}
        onClose={() => setDangerConfirm({ isOpen: false, action: '', label: '' })}
        onConfirm={handleDangerAction}
        title={dangerConfirm.label}
        message={`Are you sure you want to ${dangerConfirm.label.toLowerCase()}? This action cannot be undone.`}
        confirmText={dangerConfirm.label}
        variant="danger"
      />
    </div>
  );
}
