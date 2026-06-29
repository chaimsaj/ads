import { useState, useEffect, useCallback } from 'react';
import { Calendar, DollarSign, Eye, MousePointer, BarChart3, Target, Activity, TrendingUp } from 'lucide-react';
import { Modal, ModalFooter, Button, StatusBadge, Badge, Tabs } from '../../components/ui';
import { campaignsApi } from '../../api/campaigns';
import { useToast } from '../../context/ToastContext';
import { isApiError, mediaUrl } from '../../api/client';
import { formatCurrency, formatNumber, formatPercent, formatDate, titleCase } from '../../utils/formatters';
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

          {campaign.bannerImage && (
            <div className={styles.banner}>
              <img
                className={styles.bannerImage}
                src={mediaUrl(campaign.bannerImage)}
                alt={`${campaign.name} banner`}
                loading="lazy"
                onError={(e) => {
                  // If the image is missing/unreachable, hide it rather than show a broken thumbnail.
                  (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className={styles.badges}>
            <Badge variant="default">{titleCase(campaign.adType)}</Badge>
            <Badge variant="default">{titleCase(campaign.adFormat)}</Badge>
            <Badge variant={campaign.boostType === 'premium' ? 'warning' : 'default'}>
              {titleCase(campaign.boostType)}
            </Badge>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <DollarSign size={20} />
              <div className={styles.statContent}>
                <span className={styles.statValue}>{formatCurrency(campaign.budget)}</span>
                <span className={styles.statLabel}>Budget</span>
              </div>
            </div>
            <div className={styles.stat}>
              <DollarSign size={20} />
              <div className={styles.statContent}>
                <span className={styles.statValue}>{formatCurrency(campaign.spent)}</span>
                <span className={styles.statLabel}>Spent</span>
              </div>
            </div>
            <div className={styles.stat}>
              <Eye size={20} />
              <div className={styles.statContent}>
                <span className={styles.statValue}>{formatNumber(campaign.impressions)}</span>
                <span className={styles.statLabel}>Impressions</span>
              </div>
            </div>
            <div className={styles.stat}>
              <MousePointer size={20} />
              <div className={styles.statContent}>
                <span className={styles.statValue}>{formatNumber(campaign.clicks)}</span>
                <span className={styles.statLabel}>Clicks</span>
              </div>
            </div>
          </div>

          <div className={styles.dates}>
            <div className={styles.dateItem}>
              <Calendar size={16} />
              <span>Start: <strong>{formatDate(campaign.startDate)}</strong></span>
            </div>
            <div className={styles.dateItem}>
              <Calendar size={16} />
              <span>End: <strong>{formatDate(campaign.endDate)}</strong></span>
            </div>
          </div>

          <div className={styles.progress}>
            <div className={styles.progressHeader}>
              <span>Budget Usage</span>
              <span>{formatPercent((campaign.spent / campaign.budget) * 100, 1)}</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
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
              <span className={styles.metricValue}>{formatPercent(campaign.ctr)}</span>
              <span className={styles.metricLabel}>Click-through Rate</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <Target size={24} />
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{formatNumber(campaign.conversions)}</span>
              <span className={styles.metricLabel}>Conversions</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <Activity size={24} />
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>
                {formatPercent(campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0)}
              </span>
              <span className={styles.metricLabel}>Conversion Rate</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <DollarSign size={24} />
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>
                {formatCurrency(campaign.clicks > 0 ? campaign.spent / campaign.clicks : 0)}
              </span>
              <span className={styles.metricLabel}>Cost per Click</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <DollarSign size={24} />
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{formatCurrency(campaign.revenue)}</span>
              <span className={styles.metricLabel}>Revenue</span>
            </div>
          </div>
          <div className={styles.metricCard}>
            <TrendingUp size={24} />
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{formatPercent(campaign.roi)}</span>
              <span className={styles.metricLabel}>Return on Investment</span>
            </div>
          </div>
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
