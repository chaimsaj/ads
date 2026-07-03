import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader, Calendar, MapPin, Image, ChevronRight, Radio, TrendingUp, TrendingDown } from 'lucide-react';
import { Header, Footer } from '../../components/layout';
import { Button, Badge } from '../../components/ui';
import { TimeSeriesChart, type ChartSeries } from '../../components/charts';
import {
  campaignsApi,
  type PerformanceSummary,
  type DailyPerformance,
  type PerformanceComparison,
} from '../../api/campaigns';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { formatCurrency, formatNumber, formatPercent, formatDate as formatDateValue, formatDateTime } from '../../utils/formatters';
import { activityApi, type AdEvent, type AdBreakdown, type BreakdownBucket } from '../../api/activity';
import styles from './CampaignPerformance.module.css';

type DayRange = 7 | 14 | 30;

function formatDate(iso: string | null): string {
  return iso ? formatDateValue(iso) : '-';
}

const CHART_COLORS = {
  impressions: 'var(--color-primary-700)',
  clicks: 'var(--color-secondary-400)',
  spend: 'var(--color-warning)',
  revenue: 'var(--color-success)',
};

/** A period-over-period delta pill: green when up, red when down (inverted for cost metrics). */
function DeltaPill({ pct, invert = false }: { pct: number; invert?: boolean }) {
  const rounded = Math.round(pct * 10) / 10;
  const good = invert ? rounded < 0 : rounded > 0;
  const neutral = rounded === 0;
  const cls = neutral ? styles.deltaNeutral : good ? styles.deltaUp : styles.deltaDown;
  const Icon = rounded >= 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`${styles.delta} ${cls}`}>
      {!neutral && <Icon size={12} />}
      {rounded > 0 ? '+' : ''}{rounded}%
    </span>
  );
}

const EVENT_LABEL: Record<AdEvent['state'], string> = {
  served: 'Ad served',
  impressed: 'Impression',
  clicked: 'Click',
  converted: 'Conversion',
};

function BreakdownColumn({ title, buckets }: { title: string; buckets: BreakdownBucket[] }) {
  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
      {buckets.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No data yet.</p>
      ) : (
        buckets.slice(0, 6).map((b) => {
          const ctr = b.impressed > 0 ? (b.clicked / b.impressed) * 100 : 0;
          return (
            <div key={b.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-gray-200)', fontSize: 13 }}>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{b.key}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{formatNumber(b.impressed)} views · {formatPercent(ctr, 1)} CTR</span>
            </div>
          );
        })
      )}
    </div>
  );
}

export function CampaignPerformance() {
  const { id } = useParams();
  const { user } = useCurrentUser();
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyPerformance[]>([]);
  const [comparison, setComparison] = useState<PerformanceComparison | null>(null);
  const [events, setEvents] = useState<AdEvent[]>([]);
  const [breakdown, setBreakdown] = useState<AdBreakdown | null>(null);
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
      const [summaryData, daily, compare, recent, dims] = await Promise.all([
        campaignsApi.getPerformance(id!),
        campaignsApi.getDailyPerformance(id!, dayRange),
        campaignsApi.getComparison(id!, 7).catch((): PerformanceComparison | null => null),
        activityApi.getRecent(id!, 15).catch((): AdEvent[] => []),
        activityApi.getBreakdown(id!).catch((): AdBreakdown | null => null),
      ]);
      setSummary(summaryData);
      setDailyData(daily);
      setComparison(compare);
      setEvents(recent);
      setBreakdown(dims);
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

  const chartLabels = useMemo(() => dailyData.map((d) => d.date.slice(5)), [dailyData]);

  const trafficSeries = useMemo<ChartSeries[]>(
    () => [
      { name: 'Impressions', color: CHART_COLORS.impressions, values: dailyData.map((d) => d.impressions), area: true },
      { name: 'Clicks', color: CHART_COLORS.clicks, values: dailyData.map((d) => d.clicks) },
    ],
    [dailyData],
  );

  const moneySeries = useMemo<ChartSeries[]>(
    () => [
      { name: 'Spend', color: CHART_COLORS.spend, values: dailyData.map((d) => d.spend), format: formatCurrency },
      { name: 'Revenue', color: CHART_COLORS.revenue, values: dailyData.map((d) => d.revenue), format: formatCurrency },
    ],
    [dailyData],
  );

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
        color: 'var(--color-warning-light)',
      },
      {
        label: 'Deposits',
        value: summary.deposits,
        percentage: (summary.deposits / maxVal) * 100,
        color: 'var(--color-success-light)',
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
                  {summary.status.toUpperCase()}
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
              <span className={styles.kpiLabel}>Reach</span>
              <span className={styles.kpiValue}>{formatNumber(summary.reach)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Frequency</span>
              <span className={styles.kpiValue}>{summary.frequency.toFixed(1)}×</span>
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
              <span className={styles.kpiLabel}>Conversions</span>
              <span className={styles.kpiValue}>{formatNumber(summary.conversions)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Conv. Rate</span>
              <span className={styles.kpiValue}>{formatPercent(summary.conversionRate)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>CPC</span>
              <span className={styles.kpiValue}>{formatCurrency(summary.cpc)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>CPM</span>
              <span className={styles.kpiValue}>{formatCurrency(summary.cpm)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>CPA</span>
              <span className={styles.kpiValue}>{formatCurrency(summary.cpa)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Revenue</span>
              <span className={styles.kpiValue}>{formatCurrency(summary.revenue)}</span>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiCardHighlight}`}>
              <span className={styles.kpiLabel}>ROAS</span>
              <span className={styles.kpiValue}>{summary.roas.toFixed(2)}×</span>
            </div>
            <div className={`${styles.kpiCard} ${styles.kpiCardHighlight}`}>
              <span className={styles.kpiLabel}>ROI</span>
              <span className={styles.kpiValue}>{formatPercent(summary.roi)}</span>
            </div>
          </div>

          {/* Budget pacing */}
          <div className={styles.pacingCard}>
            <div className={styles.pacingHeader}>
              <span className={styles.pacingTitle}>Budget pacing</span>
              <span className={styles.pacingFigures}>
                {formatCurrency(summary.spend)} of {formatCurrency(summary.budget)} spent ·{' '}
                <strong>{formatCurrency(Math.max(summary.budget - summary.spend, 0))} remaining</strong>
              </span>
            </div>
            <div className={styles.pacingTrack}>
              <div
                className={styles.pacingBar}
                style={{ width: `${summary.budget > 0 ? Math.min((summary.spend / summary.budget) * 100, 100) : 0}%` }}
              />
            </div>
          </div>

          {/* ROI Statement */}
          <div className={styles.roiStatement}>
            You spent <strong>{formatCurrency(summary.spend)}</strong> and earned{' '}
            <strong>{formatCurrency(summary.revenue)}</strong> in revenue from{' '}
            <strong>{formatNumber(summary.applications)}</strong> applications and{' '}
            <strong>{formatNumber(summary.deposits)}</strong> deposits, an ROI of{' '}
            <strong>{formatPercent(summary.roi)}</strong>.
          </div>

          {/* Period-over-period comparison (last 7 days vs previous 7) */}
          {comparison && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Last {comparison.days} days vs previous {comparison.days}</h2>
              <div className={styles.comparisonGrid}>
                <div className={styles.comparisonCard}>
                  <span className={styles.kpiLabel}>Impressions</span>
                  <span className={styles.comparisonValue}>{formatNumber(comparison.current.impressions)}</span>
                  <DeltaPill pct={comparison.change.impressionsPct} />
                </div>
                <div className={styles.comparisonCard}>
                  <span className={styles.kpiLabel}>Clicks</span>
                  <span className={styles.comparisonValue}>{formatNumber(comparison.current.clicks)}</span>
                  <DeltaPill pct={comparison.change.clicksPct} />
                </div>
                <div className={styles.comparisonCard}>
                  <span className={styles.kpiLabel}>Conversions</span>
                  <span className={styles.comparisonValue}>{formatNumber(comparison.current.conversions)}</span>
                  <DeltaPill pct={comparison.change.conversionsPct} />
                </div>
                <div className={styles.comparisonCard}>
                  <span className={styles.kpiLabel}>Spend</span>
                  <span className={styles.comparisonValue}>{formatCurrency(comparison.current.spend)}</span>
                  <DeltaPill pct={comparison.change.spendPct} invert />
                </div>
                <div className={styles.comparisonCard}>
                  <span className={styles.kpiLabel}>Revenue</span>
                  <span className={styles.comparisonValue}>{formatCurrency(comparison.current.revenue)}</span>
                  <DeltaPill pct={comparison.change.revenuePct} />
                </div>
              </div>
            </div>
          )}

          {/* Conversion Funnel */}
          <div className={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 className={styles.sectionTitle}>Conversion Funnel</h2>
              {(summary.status === 'draft' || summary.status === 'active') && (
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
              <TimeSeriesChart labels={chartLabels} series={trafficSeries} />
            )}
          </div>

          {/* Spend vs Revenue trend */}
          {dailyData.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Spend vs Revenue</h2>
              <TimeSeriesChart labels={chartLabels} series={moneySeries} yFormat={formatCurrency} />
            </div>
          )}

          {/* Conversions by type */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Conversions by type</h2>
            <div className={styles.convTypeGrid}>
              <div className={styles.convTypeCard}>
                <span className={styles.kpiLabel}>Applications</span>
                <span className={styles.kpiValue}>{formatNumber(summary.conversionsByType.application)}</span>
              </div>
              <div className={styles.convTypeCard}>
                <span className={styles.kpiLabel}>Deposits</span>
                <span className={styles.kpiValue}>{formatNumber(summary.conversionsByType.deposit)}</span>
              </div>
              <div className={styles.convTypeCard}>
                <span className={styles.kpiLabel}>Other</span>
                <span className={styles.kpiValue}>{formatNumber(summary.conversionsByType.generic)}</span>
              </div>
            </div>
          </div>

          {/* Where it's shown (platform / format / location) */}
          {breakdown && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Where It's Shown</h2>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <BreakdownColumn title="By Platform" buckets={breakdown.byPlatform} />
                <BreakdownColumn title="By Format" buckets={breakdown.byFormat} />
                <BreakdownColumn title="By Location" buckets={breakdown.byLocation} />
              </div>
            </div>
          )}

          {/* Recent activity (granular ad-delivery events) */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            {events.length === 0 ? (
              <div className={styles.emptyChart}>No recent ad activity for this campaign.</div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {events.map((e) => (
                  <li
                    key={e.servedAdId + e.state + e.servedAt}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--color-gray-200)' }}
                  >
                    <span
                      style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        backgroundColor:
                          e.state === 'converted' ? 'var(--color-success)'
                          : e.state === 'clicked' ? 'var(--color-primary-700)'
                          : e.state === 'impressed' ? 'var(--color-info)' : 'var(--color-gray-600)',
                      }}
                    />
                    <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                      {EVENT_LABEL[e.state]} · {e.format}
                      {e.deviceId ? ` · ${e.deviceId.slice(0, 16)}` : ''}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDateTime(e.servedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      <Footer variant="dashboard" />
    </div>
  );
}
