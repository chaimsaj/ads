import { useState, useEffect, useCallback } from 'react';
import { Mail, Calendar, CreditCard, Megaphone, User as UserIcon } from 'lucide-react';
import { Modal, ModalFooter, Button, Input, StatusBadge, Tabs } from '../../components/ui';
import { usersApi } from '../../api/users';
import { campaignsApi } from '../../api/campaigns';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../api/client';
import { formatCurrency, formatDate, formatDateTime, formatNumber, formatPercent, titleCase } from '../../utils/formatters';
import type { User, Campaign } from '../../types';
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
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', role: '' as User['role'] });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await usersApi.getById(userId);
      setUser(data);
      setFormData({ name: data.name, email: data.email, phone: '', company: '', role: data.role });
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Failed to load user';
      toast.error(message);
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast, onClose]);

  const fetchCampaigns = useCallback(async () => {
    if (!userId) return;
    setCampaignsLoading(true);
    try {
      const result = await campaignsApi.getAll({ userId, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' });
      setCampaigns(result.data);
    } catch {
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUser();
      fetchCampaigns();
    }
  }, [isOpen, userId, fetchUser, fetchCampaigns]);

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
                  <Input
                    label="Phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <Input
                    label="Company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                  <div>
                    <label className={styles.roleLabel}>Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                      className={styles.roleSelect}
                    >
                      <option value="advertiser">Advertiser</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
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
                <span className={styles.statValue}>{formatCurrency(user.totalSpend)}</span>
                <span className={styles.statLabel}>Total Spend</span>
              </div>
            </div>
          </div>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <UserIcon size={16} />
              <span>Role: <strong>{titleCase(user.role)}</strong></span>
            </div>
            <div className={styles.detailItem}>
              <Calendar size={16} />
              <span>Joined: <strong>{formatDate(user.createdAt)}</strong></span>
            </div>
            {user.lastLogin && (
              <div className={styles.detailItem}>
                <Mail size={16} />
                <span>Last login: <strong>{formatDateTime(user.lastLogin)}</strong></span>
              </div>
            )}
          </div>
        </div>
      ) : null,
    },
    {
      id: 'campaigns',
      label: `Campaigns${campaigns.length ? ` (${campaigns.length})` : ''}`,
      content: (
        <div className={styles.activity}>
          {campaignsLoading ? (
            <p className={styles.placeholder}>Loading campaigns…</p>
          ) : campaigns.length === 0 ? (
            <p className={styles.placeholder}>This user has no campaigns yet.</p>
          ) : (
            <div className={styles.campaignsTableWrapper}>
              <table className={styles.campaignsTable}>
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th className={styles.num}>Budget</th>
                    <th className={styles.num}>Spent</th>
                    <th className={styles.num}>Impr.</th>
                    <th className={styles.num}>Clicks</th>
                    <th className={styles.num}>CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id}>
                      <td className={styles.campaignName}>{c.name}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className={styles.num}>{formatCurrency(c.budget)}</td>
                      <td className={styles.num}>{formatCurrency(c.spent)}</td>
                      <td className={styles.num}>{formatNumber(c.impressions)}</td>
                      <td className={styles.num}>{formatNumber(c.clicks)}</td>
                      <td className={styles.num}>{formatPercent(c.ctr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
