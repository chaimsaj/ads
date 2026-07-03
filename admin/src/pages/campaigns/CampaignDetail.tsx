import { useState, useEffect, useCallback } from 'react';
import { Calendar, DollarSign, Eye, MousePointer, BarChart3, Target, Activity, TrendingUp } from 'lucide-react';
import { Modal, ModalFooter, Button, StatusBadge, Badge, Tabs } from '../../components/ui';
import { TimeSeriesChart, type ChartSeries } from '../../components/charts';
import { campaignsApi } from '../../api/campaigns';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';
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
  const { hasPermission } = useAuth();
  const canApprove = hasPermission(PERMISSIONS.CAMPAIGNS_APPROVE);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

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
      await campaignsApi.reject(campaignId, rejectReason.trim() || undefined);
      toast.success('Campaign rejected');
      setShowRejectForm(false);
      setRejectReason('');
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
          const series: ChartSeries[] = [
            { name: 'Impressions', color: 'var(--color-primary-700)', values: days.map((d) => d.impressions), area: true },
            { name: 'Clicks', color: 'var(--color-info)', values: days.map((d) => d.clicks) },
          ];
          return (
            <div className={styles.dailySection}>
              <h4 className={styles.dailyTitle}>Daily Performance (last {days.length || 0} days)</h4>
              {days.length === 0 ? (
                <p className={styles.dailyEmpty}>No daily data yet for this campaign.</p>
              ) : (
                <TimeSeriesChart labels={days.map((d) => d.date.slice(5))} series={series} />
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
      {showRejectForm && campaign?.status === 'review' && (
        <div style={{ padding: '0 var(--spacing-lg) var(--spacing-md)' }}>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Rejection reason (optional)"
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '8px 10px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border-color, #d1d5db)', fontFamily: 'inherit' }}
          />
        </div>
      )}
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
        {campaign?.status === 'review' && canApprove && (
          <>
            {showRejectForm ? (
              <>
                <Button variant="outline" onClick={() => { setShowRejectForm(false); setRejectReason(''); }}>Cancel</Button>
                <Button variant="danger" onClick={handleReject}>Confirm Reject</Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setShowRejectForm(true)}>Reject</Button>
            )}
            <Button onClick={handleApprove}>Approve</Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
