import { useState, useEffect, useMemo, useCallback } from 'react';
import { Download, Loader, BarChart3, TrendingUp, Check, X } from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, Badge } from '../components/ui';
import { BarChart, type BarChartItem } from '../components/charts';
import { campaignsApi, type CampaignSummary, type PerformanceOverview } from '../api/campaigns';
import { runQuery, DEFAULT_TTL } from '../lib/queryCache';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import styles from './Reports.module.css';

interface AccountTotals {
  campaigns: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  spent: number;
  revenue: number;
  roi: number;
  roas: number;
  cpc: number;
  cpm: number;
}

/**
 * Account-wide totals. Prefers the server-aggregated overview (accurate across
 * any number of campaigns); falls back to summing the loaded page if it is absent.
 */
function summarize(campaigns: CampaignSummary[], overview: PerformanceOverview | null): AccountTotals {
  const impressions = overview?.totalImpressions ?? campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const clicks = overview?.totalClicks ?? campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const spent = overview?.totalSpend ?? campaigns.reduce((sum, c) => sum + c.spent, 0);
  const revenue = overview?.totalRevenue ?? campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const conversions = overview?.totalConversions ?? campaigns.reduce((sum, c) => sum + c.conversions, 0);
  return {
    campaigns: overview?.campaignCount ?? campaigns.length,
    impressions,
    clicks,
    ctr: overview?.averageCtr ?? (impressions === 0 ? 0 : (clicks / impressions) * 100),
    conversions,
    spent,
    revenue,
    roi: spent === 0 ? 0 : ((revenue - spent) / spent) * 100,
    roas: overview?.averageRoas ?? (spent === 0 ? 0 : revenue / spent),
    cpc: clicks === 0 ? 0 : spent / clicks,
    cpm: impressions === 0 ? 0 : (spent / impressions) * 1000,
  };
}

const statusLabel = (status: string): string => status.charAt(0).toUpperCase() + status.slice(1);

export function Reports() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      runQuery('webapp:reports:campaigns', () => campaignsApi.getAll(), DEFAULT_TTL),
      runQuery('webapp:reports:overview', () => campaignsApi.getPerformanceOverview(), DEFAULT_TTL).catch(
        (): PerformanceOverview | null => null,
      ),
    ])
      .then(([data, ov]) => {
        if (active) {
          setCampaigns(data);
          setOverview(ov);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          showToast('Failed to load report data', 'error');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const totals = useMemo(() => summarize(campaigns, overview), [campaigns, overview]);

  const topBySpend = useMemo<BarChartItem[]>(
    () =>
      [...campaigns]
        .filter((c) => c.spent > 0)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 6)
        .map((c) => ({ label: c.name, value: c.spent, caption: `${formatPercent(c.roi)} ROI` })),
    [campaigns],
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const blob = await campaignsApi.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `myngly-ads-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Report downloaded');
    } catch {
      showToast('Failed to download report', 'error');
    } finally {
      setExporting(false);
    }
  }, [showToast]);

  const roiClass = totals.roi >= 0 ? styles.positive : styles.negative;

  return (
    <div className={styles.page}>
      <Header variant="dashboard" />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>
                <BarChart3 size={24} /> Performance Reports
              </h1>
              <p className={styles.subtitle}>
                Account-wide performance across all your campaigns.
              </p>
            </div>
            <Button
              variant="primary"
              leftIcon={exporting ? <Loader size={16} className={styles.spin} /> : <Download size={16} />}
              onClick={handleExport}
              disabled={exporting || loading}
            >
              {exporting ? 'Preparing…' : 'Download CSV'}
            </Button>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <Loader size={28} className={styles.spin} />
              <span>Loading report…</span>
            </div>
          ) : (
            <>
              <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Campaigns</span>
                  <span className={styles.kpiValue}>{formatNumber(totals.campaigns)}</span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Impressions</span>
                  <span className={styles.kpiValue}>{formatNumber(totals.impressions)}</span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Clicks</span>
                  <span className={styles.kpiValue}>{formatNumber(totals.clicks)}</span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>CTR</span>
                  <span className={styles.kpiValue}>{formatPercent(totals.ctr)}</span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Conversions</span>
                  <span className={styles.kpiValue}>{formatNumber(totals.conversions)}</span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Spend</span>
                  <span className={styles.kpiValue}>{formatCurrency(totals.spent)}</span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Revenue</span>
                  <span className={styles.kpiValue}>{formatCurrency(totals.revenue)}</span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>CPC</span>
                  <span className={styles.kpiValue}>{formatCurrency(totals.cpc)}</span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>CPM</span>
                  <span className={styles.kpiValue}>{formatCurrency(totals.cpm)}</span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>ROAS</span>
                  <span className={styles.kpiValue}>{totals.roas.toFixed(2)}×</span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>
                    <TrendingUp size={14} /> ROI
                  </span>
                  <span className={`${styles.kpiValue} ${roiClass}`}>{formatPercent(totals.roi)}</span>
                </div>
              </div>

              {topBySpend.length > 0 && (
                <div className={styles.tableCard}>
                  <h2 className={styles.sectionTitle}>Top campaigns by spend</h2>
                  <BarChart items={topBySpend} format={formatCurrency} />
                </div>
              )}

              <div className={styles.tableCard}>
                <h2 className={styles.sectionTitle}>Campaign Breakdown</h2>
                {campaigns.length === 0 ? (
                  <p className={styles.empty}>No campaigns yet. Create one to see performance data here.</p>
                ) : (
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Campaign</th>
                          <th>Status</th>
                          <th className={styles.num}>Impressions</th>
                          <th className={styles.num}>Clicks</th>
                          <th className={styles.num}>CTR</th>
                          <th className={styles.num}>Conv.</th>
                          <th className={styles.num}>Spend</th>
                          <th className={styles.num}>Revenue</th>
                          <th className={styles.num}>ROI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((c) => (
                          <tr key={c.id}>
                            <td className={styles.nameCell}>{c.name}</td>
                            <td>
                              <Badge variant={c.status}>{statusLabel(c.status)}</Badge>
                            </td>
                            <td className={styles.num}>{formatNumber(c.impressions)}</td>
                            <td className={styles.num}>{formatNumber(c.clicks)}</td>
                            <td className={styles.num}>{formatPercent(c.ctr)}</td>
                            <td className={styles.num}>{formatNumber(c.conversions)}</td>
                            <td className={styles.num}>{formatCurrency(c.spent)}</td>
                            <td className={styles.num}>{formatCurrency(c.revenue)}</td>
                            <td className={`${styles.num} ${c.roi >= 0 ? styles.positive : styles.negative}`}>
                              {formatPercent(c.roi)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {toast && (
            <div className={`${styles.toast} ${styles[toast.type]}`}>
              {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
              {toast.message}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
