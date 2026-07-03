import { Users, Megaphone, DollarSign, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui';
import { BarChart, TimeSeriesChart, type BarChartItem, type ChartSeries } from '../../components/charts';
import { useQuery } from '../../lib/queryCache';
import { formatCurrency, formatNumber, formatDateTime, formatPercent } from '../../utils/formatters';
import { dashboardApi, type DashboardTrendPoint } from '../../api/dashboard';
import { activityApi, type AdBreakdown, type BreakdownBucket } from '../../api/activity';
import { useAuth } from '../../context/AuthContext';
import type { DashboardData } from '../../types';
import styles from './Dashboard.module.css';

function BreakdownChart({ title, buckets }: { title: string; buckets: BreakdownBucket[] }) {
  const items: BarChartItem[] = buckets
    .slice(0, 6)
    .map((b) => ({
      label: b.key,
      value: b.impressed,
      caption: `${formatPercent(b.impressed > 0 ? (b.clicked / b.impressed) * 100 : 0, 1)} CTR`,
    }));
  return (
    <div className={styles.breakdownColumn}>
      <h4 className={styles.breakdownTitle}>{title}</h4>
      {items.length === 0 ? (
        <p className={styles.breakdownEmpty}>No data yet.</p>
      ) : (
        <BarChart items={items} format={(v) => `${formatNumber(v)} views`} />
      )}
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery<DashboardData>('dashboard:stats', () =>
    dashboardApi.getStats()
  );
  const { data: breakdown } = useQuery<AdBreakdown>('admin:breakdown', () => activityApi.getBreakdown());
  const { data: trend } = useQuery<DashboardTrendPoint[]>('admin:trend', () => dashboardApi.getTrend(30));

  const trendLabels = (trend ?? []).map((d) => d.date.slice(5));
  const trafficSeries: ChartSeries[] = [
    { name: 'Impressions', color: 'var(--color-primary-700)', values: (trend ?? []).map((d) => d.impressions), area: true },
    { name: 'Clicks', color: 'var(--color-info)', values: (trend ?? []).map((d) => d.clicks) },
  ];
  const moneySeries: ChartSeries[] = [
    { name: 'Spend', color: '#e0794b', values: (trend ?? []).map((d) => d.spend), format: formatCurrency },
    { name: 'Revenue', color: 'var(--color-success)', values: (trend ?? []).map((d) => d.revenue), format: formatCurrency },
  ];

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Loading...</p>
        </div>
        <div className={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className={styles.statCard}>
              <div className={styles.skeleton} style={{ height: 100 }} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  const { stats, recentActivity } = data;

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Welcome back, {user?.name || 'Admin'}</p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={formatNumber(stats.totalUsers)}
          icon={<Users size={24} />}
          color="primary"
        />
        <StatCard
          title="Active Campaigns"
          value={formatNumber(stats.activeCampaigns)}
          icon={<Megaphone size={24} />}
          color="info"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign size={24} />}
          color="success"
        />
        <StatCard
          title="Pending Approvals"
          value={formatNumber(stats.pendingApprovals)}
          icon={<Clock size={24} />}
          color="warning"
        />
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          title="Revenue This Month"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={<DollarSign size={24} />}
          color="success"
        />
        <StatCard
          title="Impressions"
          value={formatNumber(stats.totalImpressions)}
          icon={<TrendingUp size={24} />}
          color="info"
        />
        <StatCard
          title="Clicks"
          value={formatNumber(stats.totalClicks)}
          icon={<Megaphone size={24} />}
          color="primary"
        />
        <StatCard
          title="Average CTR"
          value={formatPercent(stats.averageCtr, 2)}
          icon={<TrendingUp size={24} />}
          color="warning"
        />
      </div>

      <div className={styles.contentGrid}>
        <Card className={styles.activityCard}>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className={styles.emptyActivity}>No recent activity to display</p>
            ) : (
              <ul className={styles.activityList}>
                {recentActivity.map((activity) => (
                  <li key={activity.id} className={styles.activityItem}>
                    <span className={`${styles.activityDot} ${styles[activity.type]}`} />
                    <div className={styles.activityContent}>
                      <p className={styles.activityMessage}>{activity.description}</p>
                      <span className={styles.activityTime}>
                        {formatDateTime(activity.timestamp)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className={styles.quickActions}>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.quickStatsList}>
              <div className={styles.quickStat}>
                <span className={styles.quickStatLabel}>New Users (this month)</span>
                <span className={styles.quickStatValue}>{formatNumber(stats.newUsersThisMonth)}</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickStatLabel}>Total Campaigns</span>
                <span className={styles.quickStatValue}>{formatNumber(stats.totalCampaigns)}</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickStatLabel}>Pending Reviews</span>
                <span className={styles.quickStatValue}>{formatNumber(stats.pendingApprovals)}</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickStatLabel}>Average CTR</span>
                <span className={styles.quickStatValue}>{formatPercent(stats.averageCtr, 2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {trend && trend.length > 0 && (
        <Card className={styles.breakdownCard}>
          <CardHeader>
            <CardTitle>Platform Trend — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart labels={trendLabels} series={trafficSeries} />
            <div className={styles.trendSpacer}>
              <TimeSeriesChart labels={trendLabels} series={moneySeries} yFormat={formatCurrency} />
            </div>
          </CardContent>
        </Card>
      )}

      {breakdown && (
        <Card className={styles.breakdownCard}>
          <CardHeader>
            <CardTitle>Where Ads Are Shown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.breakdownGrid}>
              <BreakdownChart title="By Platform" buckets={breakdown.byPlatform} />
              <BreakdownChart title="By Format" buckets={breakdown.byFormat} />
              <BreakdownChart title="By Location" buckets={breakdown.byLocation} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'info';
}

function StatCard({ title, value, change, icon, color }: StatCardProps) {
  return (
    <Card className={styles.statCard} hover>
      <div className={styles.statHeader}>
        <div className={`${styles.statIcon} ${styles[color]}`}>{icon}</div>
        {change !== undefined && (
          <div className={`${styles.statChange} ${change >= 0 ? styles.positive : styles.negative}`}>
            {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className={styles.statBody}>
        <h3 className={styles.statValue}>{value}</h3>
        <p className={styles.statTitle}>{title}</p>
      </div>
    </Card>
  );
}
