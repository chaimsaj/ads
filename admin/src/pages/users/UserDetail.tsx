import { useState, useEffect, useCallback } from 'react';
import { Mail, Calendar, CreditCard, Megaphone, User as UserIcon } from 'lucide-react';
import { Modal, ModalFooter, Button, Input, StatusBadge, Tabs } from '../../components/ui';
import { usersApi } from '../../api/users';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../api/client';
import type { User } from '../../types';
import styles from './UserDetail.module.css';

interface UserDetailProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function UserDetail({ userId, isOpen, onClose, onUpdate }: UserDetailProps) {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await usersApi.getById(userId);
      setUser(data);
      setFormData({ name: data.name, email: data.email });
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Failed to load user';
      toast.error(message);
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast, onClose]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUser();
    }
  }, [isOpen, userId, fetchUser]);

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await usersApi.update(userId, formData);
      toast.success('User updated successfully');
      setEditMode(false);
      onUpdate();
      fetchUser();
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Failed to update user';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: user ? (
        <div className={styles.overview}>
          <div className={styles.userHeader}>
            <div className={styles.avatar}>{user.name.charAt(0)}</div>
            <div className={styles.userInfo}>
              {editMode ? (
                <div className={styles.editForm}>
                  <Input
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              ) : (
                <>
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  <StatusBadge status={user.status} />
                </>
              )}
            </div>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statIcon}><Megaphone size={20} /></div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{user.totalCampaigns}</span>
                <span className={styles.statLabel}>Campaigns</span>
              </div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statIcon}><CreditCard size={20} /></div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>${user.totalSpend.toLocaleString()}</span>
                <span className={styles.statLabel}>Total Spend</span>
              </div>
            </div>
          </div>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <UserIcon size={16} />
              <span>Role: <strong>{user.role}</strong></span>
            </div>
            <div className={styles.detailItem}>
              <Calendar size={16} />
              <span>Joined: <strong>{new Date(user.createdAt).toLocaleDateString()}</strong></span>
            </div>
            {user.lastLogin && (
              <div className={styles.detailItem}>
                <Mail size={16} />
                <span>Last login: <strong>{new Date(user.lastLogin).toLocaleString()}</strong></span>
              </div>
            )}
          </div>
        </div>
      ) : null,
    },
    {
      id: 'activity',
      label: 'Activity',
      content: (
        <div className={styles.activity}>
          <p className={styles.placeholder}>User activity history coming soon...</p>
        </div>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Details"
      size="lg"
    >
      {isLoading ? (
        <div className={styles.loading}>Loading...</div>
      ) : user ? (
        <Tabs tabs={tabs} defaultTab="overview" />
      ) : null}
      <ModalFooter>
        {editMode ? (
          <>
            <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={isSaving}>Save Changes</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={() => setEditMode(true)}>Edit User</Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
