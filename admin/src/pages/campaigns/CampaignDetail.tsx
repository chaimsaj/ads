import { useState, useEffect, useCallback } from 'react';
import { Calendar, DollarSign, Eye, MousePointer, BarChart3 } from 'lucide-react';
import { Modal, ModalFooter, Button, StatusBadge, Badge, Tabs } from '../../components/ui';
import { campaignsApi } from '../../api/campaigns';
import { useToast } from '../../context/ToastContext';
import { isApiError } from '../../api/client';
import type { Campaign } from '../../types';
import styles from './CampaignDetail.module.css';

interface CampaignDetailProps {
  campaignId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function CampaignDetail({ campaignId, isOpen, onClose, onUpdate }: CampaignDetailProps) {
  const toast = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaign = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    try {
      const data = await campaignsApi.getById(campaignId);
      setCampaign(data);
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Failed to load campaign';
      toast.error(message);
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, toast, onClose]);

  useEffect(() => {
    if (isOpen && campaignId) {
      fetchCampaign();
    }
  }, [isOpen, campaignId, fetchCampaign]);

  const handleApprove = async () => {
    if (!campaignId) return;
    try {
      await campaignsApi.approve(campaignId);
      toast.success('Campaign approved');
      onUpdate();
      fetchCampaign();
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Failed to approve campaign';
      toast.error(message);
    }
  };

  const handleReject = async () => {
    if (!campaignId) return;
    try {
      await campaignsApi.reject(campaignId);
      toast.success('Campaign rejected');
      onUpdate();
      fetchCampaign();
    } catch (err) {
      const message = isApiError(err) ? err.message : 'Failed to reject campaign';
      toast.error(message);
    }
  };

  if (!isOpen) return null;

  const tabs = campaign ? [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className={styles.overview}>
          <div className={styles.header}>
            <div>
              <h3 className={styles.campaignName}>{campaign.name}</h3>
              <p className={styles.owner}>by {campaign.userName}</p>
            </div>
            <StatusBadge status={campaign.status} />
          </div>

          <div className={styles.badges}>
            <Badge variant="default">{campaign.adType}</Badge>
            <Badge variant="default">{campaign.adFormat}</Badge>
            <Badge variant={campaign.boostType === 'premium' ? 'warning' : 'default'}>
              {campaign.boostType}
            </Badge>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <DollarSign size={20} />
              <div className={styles.statContent}>
                <span className={styles.statValue}>${campaign.budget.toLocaleString()}</span>
                <span className={styles.statLabel}>Budget</span>
              </div>
            </div>
            <div className={styles.stat}>
              <DollarSign size={20} />
              <div className={styles.statContent}>
                <span className={styles.statValue}>${campaign.spent.toLocaleString()}</span>
                <span className={styles.statLabel}>Spent</span>
              </div>
            </div>
            <div className={styles.stat}>
              <Eye size={20} />
              <div className={styles.statContent}>
                <span className={styles.statValue}>{campaign.impressions.toLocaleString()}</span>
                <span className={styles.statLabel}>Impressions</span>
              </div>
            </div>
            <div className={styles.stat}>
              <MousePointer size={20} />
              <div className={styles.statContent}>
                <span className={styles.statValue}>{campaign.clicks.toLocaleString()}</span>
                <span className={styles.statLabel}>Clicks</span>
              </div>
            </div>
          </div>

          <div className={styles.dates}>
            <div className={styles.dateItem}>
              <Calendar size={16} />
              <span>Start: <strong>{new Date(campaign.startDate).toLocaleDateString()}</strong></span>
            </div>
            <div className={styles.dateItem}>
              <Calendar size={16} />
              <span>End: <strong>{new Date(campaign.endDate).toLocaleDateString()}</strong></span>
            </div>
          </div>

          <div className={styles.progress}>
            <div className={styles.progressHeader}>
              <span>Budget Usage</span>
              <span>{((campaign.spent / campaign.budget) * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      content: (
        <div className={styles.analytics}>
          <div className={styles.metricCard}>
            <BarChart3 size={24} />
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{campaign.ctr.toFixed(2)}%</span>
              <span className={styles.metricLabel}>Click-through Rate</span>
            </div>
          </div>
          <p className={styles.placeholder}>Detailed analytics charts coming soon...</p>
        </div>
      ),
    },
  ] : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Campaign Details"
      size="lg"
    >
      {isLoading ? (
        <div className={styles.loading}>Loading...</div>
      ) : campaign ? (
        <Tabs tabs={tabs} defaultTab="overview" />
      ) : null}
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
        {campaign?.status === 'review' && (
          <>
            <Button variant="danger" onClick={handleReject}>Reject</Button>
            <Button onClick={handleApprove}>Approve</Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
