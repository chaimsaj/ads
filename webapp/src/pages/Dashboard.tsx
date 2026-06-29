import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  Copy,
  Plus,
  Files,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pause,
  Play,
  Download,
  X,
  Check,
  Loader,
  BarChart3,
  Radio,
} from 'lucide-react';
import { Header, Footer } from '../components/layout';
import { Button, Badge, Input } from '../components/ui';
import { campaignsApi, type PerformanceOverview } from '../api/campaigns';
import { apiClient } from '../api/client';
import { runQuery, DEFAULT_TTL } from '../lib/queryCache';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { useCurrentUser } from '../hooks/useCurrentUser';
import styles from './Dashboard.module.css';

interface Campaign {
  id: string;
  name: string;
  image: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: 'active' | 'paused' | 'scheduled' | 'completed' | 'review' | 'draft' | 'rejected';
  adFormat: 'Banner' | 'Interstitial' | 'Push';
  budget: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

type SortField = 'id' | 'name' | 'startDate' | 'isActive' | 'status' | 'adFormat' | 'budget';
type SortDirection = 'asc' | 'desc';

const statusOptions = ['all', 'active', 'paused', 'scheduled', 'completed', 'review', 'draft', 'rejected'] as const;
const formatOptions = ['all', 'Banner', 'Interstitial', 'Push'] as const;

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<{ label: string; value: string; subtitle: string; percentage: number; color: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<PerformanceOverview | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter states
  const [statusFilter, setStatusFilter] = useState<typeof statusOptions[number]>('all');
  const [formatFilter, setFormatFilter] = useState<typeof formatOptions[number]>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Reuse campaign modal
  const [showReuseModal, setShowReuseModal] = useState(false);
  const [reuseLoading, setReuseLoading] = useState<string | null>(null);

  const itemsPerPage = 5;

  // Compute stats from the loaded campaigns list
  const computeStats = (list: Campaign[]) => {
    const total = list.length || 1;
    const active = list.filter((c) => c.status === 'active').length;
    const paused = list.filter((c) => c.status === 'paused').length;
    const scheduled = list.filter((c) => c.status === 'scheduled').length;
    const completed = list.filter((c) => c.status === 'completed').length;

    setStats([
      {
        label: 'Total Active Campaigns',
        value: `${active} Active`,
        subtitle: 'From Last Six Months',
        percentage: Math.round((active / total) * 100),
        color: '#aad9be',
      },
      {
        label: 'Total Paused Campaigns',
        value: `${paused} Paused`,
        subtitle: 'From Last Six Months',
        percentage: Math.round((paused / total) * 100),
        color: '#f0d994',
      },
      {
        label: 'Total Scheduled Campaigns',
        value: `${scheduled} Scheduled`,
        subtitle: 'From Last Six Months',
        percentage: Math.round((scheduled / total) * 100),
        color: '#93d6ea',
      },
      {
        label: 'Total Completed Campaigns',
        value: `${completed} Completed`,
        subtitle: 'From Last Six Months',
        percentage: Math.round((completed / total) * 100),
        color: '#e79d9d',
      },
    ]);
  };

  // Load campaigns from API
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async (force = false) => {
    try {
      setIsLoading(true);
      setError(null);
      // Served from the in-memory cache on revisits within the TTL; mutations pass force=true.
      const [data, overviewData] = await runQuery(
        'webapp:dashboard:data',
        () =>
          Promise.all([campaignsApi.getAll(), campaignsApi.getPerformanceOverview().catch(() => null)]),
        DEFAULT_TTL,
        force
      );
      const mapped: Campaign[] = data.map((c) => {
        const impressions = c.impressions ?? 0;
        const clicks = c.clicks ?? 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        return {
          id: c.id,
          name: c.name,
          image: c.image || '/placeholder.png',
          startDate: c.startDate,
          endDate: c.endDate,
          isActive: c.isActive,
          status: c.status,
          adFormat: c.adFormat,
          budget: c.budget,
          impressions,
          clicks,
          ctr: Math.round(ctr * 100) / 100,
        };
      });
      setCampaigns(mapped);
      computeStats(mapped);
      if (overviewData) {
        setOverview(overviewData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Filtered and sorted campaigns
  const filteredCampaigns = useMemo(() => {
    let result = [...campaigns];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Apply format filter
    if (formatFilter !== 'all') {
      result = result.filter((c) => c.adFormat === formatFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal: string | number | boolean = a[sortField];
      let bVal: string | number | boolean = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [campaigns, searchQuery, statusFilter, formatFilter, sortField, sortDirection]);

  // Paginated campaigns
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCampaigns.slice(start, start + itemsPerPage);
  }, [filteredCampaigns, currentPage]);

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedCampaigns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCampaigns.map((c) => c.id));
    }
  };

  // Handle individual select
  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle campaign active state via API
  const toggleActive = async (id: string) => {
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return;

    const newStatus = campaign.isActive ? 'paused' : 'active';
    try {
      await campaignsApi.updateStatus(id, newStatus);
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, isActive: !c.isActive, status: newStatus as Campaign['status'] }
            : c
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update campaign status';
      showToast(message, 'error');
    }
  };

  // Bulk actions via API
  const handleBulkPause = async () => {
    if (bulkLoading) return;
    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => campaignsApi.updateStatus(id, 'paused'))
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (succeeded > 0) {
        await loadCampaigns(true);
        showToast(
          failed > 0
            ? `${succeeded} paused, ${failed} failed (may not be pausable)`
            : `${succeeded} campaign(s) paused`
        );
      } else {
        showToast('Failed to pause campaigns. They may not be in a pausable state.', 'error');
      }
      setSelectedIds([]);
    } catch {
      showToast('Failed to pause campaigns', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkActivate = async () => {
    if (bulkLoading) return;
    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => campaignsApi.updateStatus(id, 'active'))
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (succeeded > 0) {
        await loadCampaigns(true);
        showToast(
          failed > 0
            ? `${succeeded} activated, ${failed} failed (may not be activatable)`
            : `${succeeded} campaign(s) activated`
        );
      } else {
        showToast('Failed to activate campaigns. They may not be in an activatable state.', 'error');
      }
      setSelectedIds([]);
    } catch {
      showToast('Failed to activate campaigns', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (bulkLoading) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} campaign(s)? This cannot be undone.`
    );
    if (!confirmed) return;
    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => campaignsApi.delete(id))
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (succeeded > 0) {
        await loadCampaigns(true);
        showToast(
          failed > 0
            ? `${succeeded} deleted, ${failed} failed`
            : `${succeeded} campaign(s) deleted`
        );
      } else {
        showToast('Failed to delete campaigns', 'error');
      }
      setSelectedIds([]);
    } catch {
      showToast('Failed to delete campaigns', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  // Duplicate campaign via API
  const handleDuplicate = async (campaign: Campaign) => {
    try {
      await campaignsApi.duplicate(campaign.id);
      await loadCampaigns(true);
      showToast('Campaign duplicated successfully');
    } catch {
      showToast('Failed to duplicate campaign', 'error');
    }
  };

  // Reuse a previous campaign: fetch details, populate wizard, navigate
  const handleReuseCampaign = async (campaignId: string) => {
    try {
      setReuseLoading(campaignId);
      const detail = await campaignsApi.getById(campaignId);
      const wizardData = {
        name: `${detail.name} (Copy)`,
        adType: detail.adType || 'brand',
        boostType: detail.boostType || '',
        adFormat: detail.adFormat || 'banner',
        adText: detail.adText || '',
        link: detail.adLink || '',
        hasBanner: !!detail.bannerImage,
        address: detail.targeting?.address || '',
        radius: detail.targeting?.radius || '5',
        startDate: '',
        endDate: '',
        latitude: null,
        longitude: null,
        budget: '',
        paymentMethodId: '',
        paymentMethodLabel: '',
      };
      localStorage.setItem('campaignWizard', JSON.stringify(wizardData));
      setShowReuseModal(false);
      navigate('/campaign/new');
    } catch {
      showToast('Failed to load campaign details', 'error');
    } finally {
      setReuseLoading(null);
    }
  };

  // Export to CSV via API
  const handleExport = async () => {
    try {
      const blob = await campaignsApi.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campaigns.csv';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Campaigns exported to CSV');
    } catch {
      showToast('Failed to export campaigns', 'error');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setFormatFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || formatFilter !== 'all';

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => (
    <span className={styles.sortIcon}>
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp size={14} />
        ) : (
          <ChevronDown size={14} />
        )
      ) : (
        <ChevronDown size={14} className={styles.sortInactive} />
      )}
    </span>
  );

  return (
    <div className={styles.page}>
      <Header variant="dashboard" title="Campaign Manager" user={user || { name: '' }} />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Toast Notification */}
          {toast && (
            <div className={`${styles.toast} ${styles[toast.type]}`}>
              {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
              {toast.message}
            </div>
          )}

          {/* Performance Overview */}
          {overview && (
            <div className={styles.overviewGrid}>
              <div className={styles.overviewCard}>
                <span className={styles.overviewLabel}>Total Spend</span>
                <span className={styles.overviewValue}>{formatCurrency(overview.totalSpend)}</span>
              </div>
              <div className={styles.overviewCard}>
                <span className={styles.overviewLabel}>Total Campaigns</span>
                <span className={styles.overviewValue}>{overview.campaignCount}</span>
              </div>
              <div className={styles.overviewCard}>
                <span className={styles.overviewLabel}>Total Impressions</span>
                <span className={styles.overviewValue}>{formatNumber(overview.totalImpressions)}</span>
              </div>
              <div className={styles.overviewCard}>
                <span className={styles.overviewLabel}>Total Clicks</span>
                <span className={styles.overviewValue}>{formatNumber(overview.totalClicks)}</span>
              </div>
              <div className={styles.overviewCard}>
                <span className={styles.overviewLabel}>Avg CTR</span>
                <span className={styles.overviewValue}>{formatPercent(overview.averageCtr)}</span>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statCard}>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statSubtitle}>{stat.subtitle}</span>
                </div>
                <div className={styles.statChart}>
                  <svg viewBox="0 0 36 36" className={styles.circularChart}>
                    <path
                      className={styles.circleBg}
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={styles.circle}
                      style={{ stroke: stat.color }}
                      strokeDasharray={`${stat.percentage}, 100`}
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className={styles.percentage}>
                      {stat.percentage}%
                    </text>
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Link to="/campaign/new">
              <Button variant="primary" leftIcon={<Plus size={16} />}>
                Create Campaign
              </Button>
            </Link>
            <Button variant="outline" leftIcon={<Files size={16} />} onClick={() => setShowReuseModal(true)}>
              Reuse Previous Campaign
            </Button>
            <Button variant="outline" leftIcon={<Download size={16} />} onClick={handleExport}>
              Export CSV
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className={styles.bulkActions}>
              <span className={styles.selectedCount}>
                {selectedIds.length} selected
              </span>
              <Button variant="outline" size="sm" leftIcon={<Play size={14} />} onClick={handleBulkActivate} disabled={bulkLoading}>
                {bulkLoading ? 'Processing...' : 'Activate'}
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Pause size={14} />} onClick={handleBulkPause} disabled={bulkLoading}>
                {bulkLoading ? 'Processing...' : 'Pause'}
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Trash2 size={14} />} onClick={handleBulkDelete} className={styles.deleteBtn} disabled={bulkLoading}>
                {bulkLoading ? 'Processing...' : 'Delete'}
              </Button>
              <button className={styles.clearSelection} onClick={() => setSelectedIds([])}>
                <X size={14} /> Clear
              </button>
            </div>
          )}

          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <Input
                placeholder="Search by name or ID"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search size={18} />}
              />
            </div>
            <div className={styles.filterGroup}>
              {/* Ad Format Dropdown */}
              <div className={styles.dropdown}>
                <button
                  className={styles.filterBtn}
                  onClick={() => {
                    setShowFormatDropdown(!showFormatDropdown);
                    setShowStatusDropdown(false);
                    setShowDatePicker(false);
                  }}
                >
                  Ad Format
                  {formatFilter !== 'all' && (
                    <span className={styles.filterBadge}>1</span>
                  )}
                  <ChevronDown size={16} />
                </button>
                {showFormatDropdown && (
                  <div className={styles.dropdownMenu}>
                    {formatOptions.map((option) => (
                      <button
                        key={option}
                        className={`${styles.dropdownItem} ${formatFilter === option ? styles.active : ''}`}
                        onClick={() => {
                          setFormatFilter(option);
                          setShowFormatDropdown(false);
                          setCurrentPage(1);
                        }}
                      >
                        {option === 'all' ? 'All Formats' : option}
                        {formatFilter === option && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Dropdown */}
              <div className={styles.dropdown}>
                <button
                  className={styles.filterBtn}
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowFormatDropdown(false);
                    setShowDatePicker(false);
                  }}
                >
                  Status
                  {statusFilter !== 'all' && (
                    <span className={styles.filterBadge}>1</span>
                  )}
                  <ChevronDown size={16} />
                </button>
                {showStatusDropdown && (
                  <div className={styles.dropdownMenu}>
                    {statusOptions.map((option) => (
                      <button
                        key={option}
                        className={`${styles.dropdownItem} ${statusFilter === option ? styles.active : ''}`}
                        onClick={() => {
                          setStatusFilter(option);
                          setShowStatusDropdown(false);
                          setCurrentPage(1);
                        }}
                      >
                        {option === 'all' ? 'All Statuses' : option.charAt(0).toUpperCase() + option.slice(1)}
                        {statusFilter === option && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className={styles.dropdown}>
                <button
                  className={styles.filterBtn}
                  onClick={() => {
                    setShowDatePicker(!showDatePicker);
                    setShowFormatDropdown(false);
                    setShowStatusDropdown(false);
                  }}
                >
                  Time Range{dateRange.start && dateRange.end ? <>: <strong>{dateRange.start} - {dateRange.end}</strong></> : null}
                  <ChevronDown size={16} />
                </button>
                {showDatePicker && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.datePickerContent}>
                      <label className={styles.dateLabel}>
                        Start Date
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                          className={styles.dateInput}
                        />
                      </label>
                      <label className={styles.dateLabel}>
                        End Date
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                          className={styles.dateInput}
                        />
                      </label>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowDatePicker(false)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <button className={styles.clearFilters} onClick={clearFilters}>
                  <X size={14} /> Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className={styles.resultsInfo}>
            Showing {paginatedCampaigns.length} of {filteredCampaigns.length} campaigns
          </div>

          {/* Loading / Error State */}
          {isLoading ? (
            <div className={styles.emptyState} style={{ textAlign: 'center', padding: '3rem' }}>
              <Loader size={32} className={styles.spinner} />
              <p>Loading campaigns...</p>
            </div>
          ) : error ? (
            <div className={styles.emptyState} style={{ textAlign: 'center', padding: '3rem' }}>
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={() => loadCampaigns(true)}>Retry</Button>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={selectedIds.length === paginatedCampaigns.length && paginatedCampaigns.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th onClick={() => handleSort('id')} className={styles.sortable}>
                        ID <SortIcon field="id" />
                      </th>
                      <th onClick={() => handleSort('name')} className={styles.sortable}>
                        Campaign name <SortIcon field="name" />
                      </th>
                      <th>Image</th>
                      <th onClick={() => handleSort('startDate')} className={styles.sortable}>
                        Range time <SortIcon field="startDate" />
                      </th>
                      <th onClick={() => handleSort('isActive')} className={styles.sortable}>
                        off/on <SortIcon field="isActive" />
                      </th>
                      <th onClick={() => handleSort('status')} className={styles.sortable}>
                        Status <SortIcon field="status" />
                      </th>
                      <th onClick={() => handleSort('adFormat')} className={styles.sortable}>
                        Ad Format <SortIcon field="adFormat" />
                      </th>
                      <th onClick={() => handleSort('budget')} className={styles.sortable}>
                        Budget <SortIcon field="budget" />
                      </th>
                      <th>Impressions</th>
                      <th>Clicks</th>
                      <th>CTR</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={13} className={styles.emptyState}>
                          <div className={styles.emptyContent}>
                            <Files size={48} />
                            <p>No campaigns found</p>
                            {hasActiveFilters && (
                              <Button variant="outline" size="sm" onClick={clearFilters}>
                                Clear Filters
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedCampaigns.map((campaign) => (
                        <tr key={campaign.id} className={selectedIds.includes(campaign.id) ? styles.selectedRow : ''}>
                          <td>
                            <input
                              type="checkbox"
                              className={styles.checkbox}
                              checked={selectedIds.includes(campaign.id)}
                              onChange={() => handleSelect(campaign.id)}
                            />
                          </td>
                          <td>{campaign.id}</td>
                          <td className={styles.campaignName}>{campaign.name}</td>
                          <td>
                            <div className={styles.imageThumb}>
                              {campaign.image && campaign.image !== '/placeholder.png' ? (
                                <img src={apiClient.mediaUrl(campaign.image)} alt={campaign.name} />
                              ) : (
                                <span>{campaign.name.substring(0, 15)}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            {campaign.startDate} - {campaign.endDate}
                          </td>
                          <td>
                            <label className={`${styles.toggle} ${!['active', 'paused'].includes(campaign.status) ? styles.toggleDisabled : ''}`}>
                              <input
                                type="checkbox"
                                checked={campaign.isActive}
                                onChange={() => toggleActive(campaign.id)}
                                disabled={!['active', 'paused'].includes(campaign.status)}
                              />
                              <span className={styles.toggleSlider} />
                            </label>
                          </td>
                          <td>
                            <Badge variant={campaign.status}>
                              {campaign.status.charAt(0).toUpperCase() +
                                campaign.status.slice(1)}
                            </Badge>
                          </td>
                          <td>{campaign.adFormat}</td>
                          <td>{formatCurrency(campaign.budget)}</td>
                          <td>{campaign.impressions > 0 ? formatNumber(campaign.impressions) : '-'}</td>
                          <td>{campaign.clicks > 0 ? formatNumber(campaign.clicks) : '-'}</td>
                          <td>{campaign.impressions > 0 ? formatPercent(campaign.ctr) : '-'}</td>
                          <td>
                            <div className={styles.actionBtns}>
                              <button
                                className={styles.iconBtn}
                                title="View"
                                onClick={() => navigate(`/campaign/${campaign.id}`)}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className={styles.iconBtn}
                                title="Edit"
                                onClick={() => navigate(`/campaign/${campaign.id}/edit`)}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className={styles.iconBtn}
                                title="Duplicate"
                                onClick={() => handleDuplicate(campaign)}
                              >
                                <Copy size={16} />
                              </button>
                              {(campaign.status === 'active' || campaign.status === 'paused' || campaign.status === 'completed') && (
                                <button
                                  className={styles.iconBtn}
                                  title="View Report"
                                  onClick={() => navigate(`/campaign/${campaign.id}/performance`)}
                                >
                                  <BarChart3 size={16} />
                                </button>
                              )}
                              {(campaign.status === 'draft' || campaign.status === 'active') && (
                                <button
                                  className={styles.iconBtn}
                                  title="Setup Conversion Tracking"
                                  onClick={() => navigate(`/campaign/${campaign.id}/tracking`)}
                                >
                                  <Radio size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      className={`${styles.pageNum} ${
                        currentPage === i + 1 ? styles.active : ''
                      }`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className={styles.pageBtn}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer variant="dashboard" />

      {/* Reuse Campaign Modal */}
      {showReuseModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReuseModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Reuse Previous Campaign</h2>
              <button className={styles.modalClose} onClick={() => setShowReuseModal(false)}>
                <X size={20} />
              </button>
            </div>
            <p className={styles.modalSubtitle}>
              Select a campaign to use as a template. Dates, budget, and payment will need to be set fresh.
            </p>
            <div className={styles.modalList}>
              {campaigns.length === 0 ? (
                <p className={styles.modalEmpty}>No campaigns found.</p>
              ) : (
                campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    className={styles.modalItem}
                    onClick={() => handleReuseCampaign(campaign.id)}
                    disabled={reuseLoading !== null}
                  >
                    <div className={styles.modalItemInfo}>
                      <span className={styles.modalItemName}>{campaign.name}</span>
                      <span className={styles.modalItemMeta}>
                        {campaign.adFormat} &middot; {campaign.status} &middot; ${campaign.budget}
                      </span>
                    </div>
                    {reuseLoading === campaign.id ? (
                      <Loader size={16} className={styles.spinning} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
