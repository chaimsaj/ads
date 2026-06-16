import { useState } from 'react';
import { Button, Input } from '../../components/ui';
import { userApi } from '../../api/user';
import styles from './Settings.module.css';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.currentPassword) {
      setError('Current password is required.');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setIsSaving(true);
      await userApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <h2 className={styles.modalTitle}>Change Password</h2>
        <p className={styles.modalDesc}>
          Enter your current password and choose a new one.
        </p>

        {error && (
          <div className={styles.errorAlert}>{error}</div>
        )}

        {success ? (
          <div className={styles.successAlert}>Password updated successfully.</div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter current password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              disabled={isSaving}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              disabled={isSaving}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={isSaving}
            />

            <div className={styles.modalActions}>
              <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSaving}>
                {isSaving ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
