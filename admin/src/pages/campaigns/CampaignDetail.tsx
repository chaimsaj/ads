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
        <div>
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

        {(() => {
          const days = campaign.dailyStats ?? [];
          const max = Math.max(1, ...days.map((d) => d.impressions));
          return (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#0f2a36' }}>
                Daily Performance (last {days.length || 0} days)
              </h4>
              {days.length === 0 ? (
                <p style={{ fontSize: 13, color: '#8895a1' }}>No daily data yet for this campaign.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, padding: '0 2px' }}>
                    {days.map((d) => (
                      <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
                          <div title={`Impressions: ${d.impressions}`} style={{ width: 7, height: `${(d.impressions / max) * 120}px`, backgroundColor: '#0f766e', borderRadius: 2 }} />
                          <div title={`Clicks: ${d.clicks}`} style={{ width: 7, height: `${(d.clicks / max) * 120}px`, backgroundColor: '#5e8fd6', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#8895a1' }}>{d.date.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: '#52606d' }}>
                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#0f766e', marginRight: 6 }} />Impressions</span>
                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#5e8fd6', marginRight: 6 }} />Clicks</span>
                  </div>
                </>
              )}
            </div>
          );
        })()}
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
