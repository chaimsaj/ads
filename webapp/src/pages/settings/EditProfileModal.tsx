import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { userApi } from '../../api/user';
import styles from './Settings.module.css';

interface EditProfileModalProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    company: string;
    phone: string;
  };
  onClose: () => void;
  onSaved?: () => void;
}

export function EditProfileModal({ user, onClose, onSaved }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    firstName: user.name.split(' ')[0] || '',
    lastName: user.name.split(' ').slice(1).join(' ') || '',
    email: user.email,
    company: user.company,
    phone: user.phone,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim();
    if (!fullName) {
      setError('Name is required.');
      return;
    }

    try {
      setIsSaving(true);
      await userApi.updateProfile({
        name: fullName,
        companyName: formData.company || undefined,
        phone: formData.phone || undefined,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <h2 className={styles.modalTitle}>Edit Profile</h2>
        <p className={styles.modalDesc}>Update your personal information.</p>

        {error && (
          <div className={styles.errorAlert}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.avatarUpload}>
            <div className={styles.avatarPreview}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span>
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" leftIcon={<Upload size={16} />} type="button">
              Upload Photo
            </Button>
          </div>

          <div className={styles.row}>
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              disabled={isSaving}
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              disabled={isSaving}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled
          />

          <Input
            label="Company / Organization"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            disabled={isSaving}
          />

          <Input
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={isSaving}
          />

          <div className={styles.modalActions}>
            <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
