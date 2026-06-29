import { Users, Megaphone, DollarSign, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui';
import { useQuery } from '../../lib/queryCache';
import { formatCurrency, formatNumber, formatDateTime } from '../../utils/formatters';
import { dashboardApi } from '../../api/dashboard';
import { useAuth } from '../../context/AuthContext';
import type { DashboardData } from '../../types';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery<DashboardData>('dashboard:stats', () =>
    dashboardApi.getStats()
  );

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
          change={stats.userGrowth}
          icon={<Users size={24} />}
          color="primary"
        />
        <StatCard
          title="Active Campaigns"
          value={formatNumber(stats.activeCampaigns)}
          change={stats.campaignGrowth}
          icon={<Megaphone size={24} />}
          color="info"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueGrowth}
          icon={<DollarSign size={24} />}
          color="success"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals.toString()}
          icon={<Clock size={24} />}
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
                <span className={styles.quickStatLabel}>Active Users</span>
                <span className={styles.quickStatValue}>{formatNumber(stats.activeUsers)}</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickStatLabel}>Total Campaigns</span>
                <span className={styles.quickStatValue}>{formatNumber(stats.totalCampaigns)}</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickStatLabel}>Pending Reviews</span>
                <span className={styles.quickStatValue}>{stats.pendingApprovals}</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickStatLabel}>User Growth</span>
                <span className={styles.quickStatValue}>{stats.userGrowth}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
