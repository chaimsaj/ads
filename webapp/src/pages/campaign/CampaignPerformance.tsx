import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader, Calendar, MapPin, Image, ChevronRight, Radio } from 'lucide-react';
import { Header, Footer } from '../../components/layout';
import { Button, Badge } from '../../components/ui';
import {
  campaignsApi,
  type PerformanceSummary,
  type DailyPerformance,
} from '../../api/campaigns';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './CampaignPerformance.module.css';

type DayRange = 7 | 14 | 30;

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return iso.slice(0, 10);
}

export function CampaignPerformance() {
  const { id } = useParams();
  const { user } = useCurrentUser();
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayRange, setDayRange] = useState<DayRange>(30);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadDailyData();
  }, [id, dayRange]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [summaryData, daily] = await Promise.all([
        campaignsApi.getPerformance(id!),
        campaignsApi.getDailyPerformance(id!, dayRange),
      ]);
      setSummary(summaryData);
      setDailyData(daily);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDailyData = async () => {
    if (isLoading) return;
    try {
      const daily = await campaignsApi.getDailyPerformance(id!, dayRange);
      setDailyData(daily);
    } catch {
      // Keep existing data on range change failure
    }
  };

  const maxImpressions = useMemo(() => {
    if (dailyData.length === 0) return 1;
    return Math.max(...dailyData.map((d) => d.impressions), 1);
  }, [dailyData]);

  const maxClicks = useMemo(() => {
    if (dailyData.length === 0) return 1;
    return Math.max(...dailyData.map((d) => d.clicks), 1);
  }, [dailyData]);

  const chartMax = useMemo(() => Math.max(maxImpressions, maxClicks, 1), [maxImpressions, maxClicks]);

  const funnelSteps = useMemo(() => {
    if (!summary) return [];
    const maxVal = Math.max(summary.impressions, 1);
    return [
      {
        label: 'Impressions',
        value: summary.impressions,
        percentage: 100,
        color: 'var(--color-primary-800)',
      },
      {
        label: 'Clicks',
        value: summary.clicks,
        percentage: (summary.clicks / maxVal) * 100,
        color: 'var(--color-secondary-400)',
      },
      {
        label: 'Applications',
        value: summary.applications,
        percentage: (summary.applications / maxVal) * 100,
        color: '#f0d994',
      },
      {
        label: 'Deposits',
        value: summary.deposits,
        percentage: (summary.deposits / maxVal) * 100,
        color: '#aad9be',
      },
    ];
  }, [summary]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Header variant="dashboard" title="Campaign Performance" user={user || { name: '' }} />
        <main className={styles.main}>
          <div className={styles.loadingState}>
            <Loader size={32} className={styles.spinner} />
            <p>Loading performance data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className={styles.page}>
        <Header variant="dashboard" title="Campaign Performance" user={user || { name: '' }} />
        <main className={styles.main}>
          <div className={styles.errorState}>
            <p>{error || 'Campaign not found'}</p>
            <Link to="/dashboard">
              <Button variant="outline" size="sm">Back to Dashboard</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header variant="dashboard" title="Campaign Performance" user={user || { name: '' }} />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb}>
            <Link to="/dashboard">Dashboard</Link>
            <ChevronRight size={14} className={styles.breadcrumbSeparator} />
            <Link to="/dashboard">Campaigns</Link>
            <ChevronRight size={14} className={styles.breadcrumbSeparator} />
            <span>{summary.campaignName}</span>
          </nav>

          {/* Campaign Header */}
          <div className={styles.campaignHeader}>
            <h1 className={styles.campaignTitle}>{summary.campaignName}</h1>
            <div className={styles.campaignMeta}>
              <span className={styles.metaItem}>
                <Badge variant={summary.status.toLowerCase() as 'active' | 'paused' | 'completed'}>
                  {summary.status.charAt(0).toUpperCase() + summary.status.slice(1).toLowerCase()}
                </Badge>
              </span>
              <span className={styles.metaItem}>
                <Calendar size={14} />
                {formatDate(summary.startDate)} - {formatDate(summary.endDate)}
              </span>
              <span className={styles.metaItem}>
                <Image size={14} />
                {summary.adFormat}
              </span>
              {summary.locationName && (
                <span className={styles.metaItem}>
                  <MapPin size={14} />
                  {summary.locationName}
                </span>
              )}
            </div>
          </div>

          {/* KPI Cards */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Total Spend</span>
              <span className={styles.kpiValue}>{formatCurrency(summary.spend)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Impressions</span>
              <span className={styles.kpiValue}>{formatNumber(summary.impressions)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Clicks</span>
              <span className={styles.kpiValue}>{formatNumber(summary.clicks)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>CTR</span>
              <span className={styles.kpiValue}>{formatPercent(summary.ctr)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Applications</span>
              <span className={styles.kpiValue}>{formatNumber(summary.applications)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Deposits</span>
              <span className={styles.kpiValue}>{formatNumber(summary.deposits)}</span>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiCardHighlight}`}>
              <span className={styles.kpiLabel}>ROI</span>
              <span className={styles.kpiValue}>{formatPercent(summary.roi)}</span>
            </div>
          </div>

          {/* ROI Statement */}
          <div className={styles.roiStatement}>
            You spent <strong>{formatCurrency(summary.spend)}</strong>, received{' '}
            <strong>{formatNumber(summary.clicks)}</strong> clicks,{' '}
            <strong>{formatNumber(summary.applications)}</strong> applications, and{' '}
            <strong>{formatNumber(summary.deposits)}</strong> deposits, resulting in an ROI of{' '}
            <strong>{formatPercent(summary.roi)}</strong>.
          </div>

          {/* Conversion Funnel */}
          <div className={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className={styles.sectionTitle}>Conversion Funnel</h2>
              {(summary.status === 'DRAFT' || summary.status === 'ACTIVE') && (
                <Link
                  to={`/campaign/${id}/tracking`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-primary-800)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <Radio size={14} />
                  Setup Conversion Tracking
                </Link>
              )}
            </div>
            <div className={styles.funnel}>
              {funnelSteps.map((step) => (
                <div key={step.label} className={styles.funnelStep}>
                  <span className={styles.funnelLabel}>{step.label}</span>
                  <div className={styles.funnelBarContainer}>
                    <div
                      className={styles.funnelBar}
                      style={{
                        width: `${Math.max(step.percentage, 0.5)}%`,
                        backgroundColor: step.color,
                      }}
                    />
                  </div>
                  <span className={styles.funnelValue}>
                    {formatNumber(step.value)} ({step.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Performance Chart */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Daily Performance</h2>
            <div className={styles.chartControls}>
              {([7, 14, 30] as DayRange[]).map((range) => (
                <button
                  key={range}
                  className={`${styles.chartTab} ${dayRange === range ? styles.chartTabActive : ''}`}
                  onClick={() => setDayRange(range)}
                >
                  {range} Days
                </button>
              ))}
            </div>

            {dailyData.length === 0 ? (
              <div className={styles.emptyChart}>
                No daily performance data available for this period.
              </div>
            ) : (
              <>
                <div className={styles.chartContainer}>
                  <div className={styles.chart}>
                    {dailyData.map((day) => (
                      <div key={day.date} className={styles.chartDay}>
                        <div className={styles.chartBars}>
                          <div
                            className={`${styles.chartBar} ${styles.chartBarImpressions}`}
                            style={{ height: `${(day.impressions / chartMax) * 160}px` }}
                            title={`Impressions: ${formatNumber(day.impressions)}`}
                          />
                          <div
                            className={`${styles.chartBar} ${styles.chartBarClicks}`}
                            style={{ height: `${(day.clicks / chartMax) * 160}px` }}
                            title={`Clicks: ${formatNumber(day.clicks)}`}
                          />
                        </div>
                        <span className={styles.chartDate}>{day.date.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.chartLegend}>
                  <span className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.legendImpressions}`} />
                    Impressions
                  </span>
                  <span className={styles.legendItem}>
                    <span className={`${styles.legendDot} ${styles.legendClicks}`} />
                    Clicks
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer variant="dashboard" />
    </div>
  );
}
