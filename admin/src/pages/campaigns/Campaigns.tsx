import { useState, useMemo } from 'react';
import {
  Download,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  MoreVertical,
  Search,
  Filter,
  X,
  Eye,
} from 'lucide-react';
import { Card, Button, Table, StatusBadge, Badge, Pagination, ConfirmDialog } from '../../components/ui';
import { useCampaigns } from '../../hooks/useCampaigns';
import { CampaignDetail } from './CampaignDetail';
import { exportCampaignsToCSV } from '../../utils/export';
import { useToast } from '../../context/ToastContext';
import type { Campaign, TableColumn } from '../../types';
import styles from './Campaigns.module.css';

export function Campaigns() {
  const toast = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Campaign['status'] | undefined>();
  const [formatFilter, setFormatFilter] = useState<Campaign['adFormat'] | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'delete' | 'approve' | 'reject' | 'activate' | 'pause';
    ids: string[];
  }>({ isOpen: false, action: 'delete', ids: [] });
  const [detailCampaignId, setDetailCampaignId] = useState<string | null>(null);

  const filters = useMemo(() => ({
    status: statusFilter,
    adFormat: formatFilter,
  }), [statusFilter, formatFilter]);

  const {
    campaigns,
    pagination,
    isLoading,
    approveCampaign,
    rejectCampaign,
    deleteCampaign,
    bulkAction,
  } = useCampaigns(filters);

  const clearFilters = () => {
    setStatusFilter(undefined);
    setFormatFilter(undefined);
    pagination.setSearch('');
  };

  const hasActiveFilters = pagination.search || statusFilter || formatFilter;
  const pendingReviewCount = campaigns.filter((c) => c.status === 'review').length;

  const handleBulkAction = async (action: 'activate' | 'pause' | 'delete') => {
    const ids = Array.from(selectedIds);
    if (action === 'delete') {
      setConfirmDialog({ isOpen: true, action: 'delete', ids });
    } else {
      await bulkAction(action, ids);
      setSelectedIds(new Set());
    }
  };

  const handleApprove = async (id: string) => {
    await approveCampaign(id);
  };

  const handleReject = async (id: string) => {
    setConfirmDialog({ isOpen: true, action: 'reject', ids: [id] });
  };

  const handleConfirmAction = async () => {
    const { action, ids } = confirmDialog;
    if (action === 'delete') {
      if (ids.length === 1) {
        await deleteCampaign(ids[0]);
      } else {
        await bulkAction(action, ids);
      }
    } else if (action === 'reject') {
      await rejectCampaign(ids[0]);
    } else if (action === 'activate' || action === 'pause') {
      await bulkAction(action, ids);
    }
    setSelectedIds(new Set());
    setConfirmDialog({ isOpen: false, action: 'delete', ids: [] });
  };

  const columns: TableColumn<Campaign>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      render: (campaign) => <span className={styles.campaignId}>{campaign.id}</span>,
    },
    {
      key: 'name',
      label: 'Campaign',
      sortable: true,
      render: (campaign) => (
        <div className={styles.campaignCell}>
          <div className={styles.campaignName}>{campaign.name}</div>
          <div className={styles.campaignOwner}>by {campaign.userName}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (campaign) => <StatusBadge status={campaign.status} />,
    },
    {
      key: 'adFormat',
      label: 'Format',
      sortable: true,
      render: (campaign) => (
        <Badge variant="default" size="sm">
          {campaign.adFormat}
        </Badge>
      ),
    },
    {
      key: 'budget',
      label: 'Budget',
      sortable: true,
      render: (campaign) => `$${campaign.budget.toLocaleString()}`,
    },
    {
      key: 'spent',
      label: 'Spent',
      sortable: true,
      render: (campaign) => (
        <div className={styles.spentCell}>
          <span>${campaign.spent.toLocaleString()}</span>
          <div className={styles.spentBar}>
            <div
              className={styles.spentProgress}
              style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'ctr',
      label: 'CTR',
      sortable: true,
      render: (campaign) => `${campaign.ctr.toFixed(2)}%`,
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (campaign) => new Date(campaign.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (campaign) => (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            title="View"
            onClick={() => setDetailCampaignId(campaign.id)}
          >
            <Eye size={16} />
          </button>
          {campaign.status === 'review' && (
            <>
              <button
                className={`${styles.actionBtn} ${styles.approve}`}
                title="Approve"
                onClick={() => handleApprove(campaign.id)}
              >
                <CheckCircle size={16} />
              </button>
              <button
                className={`${styles.actionBtn} ${styles.reject}`}
                title="Reject"
                onClick={() => handleReject(campaign.id)}
              >
                <XCircle size={16} />
              </button>
            </>
          )}
          <button
            className={styles.actionBtn}
            title="Delete"
            onClick={() => setConfirmDialog({ isOpen: true, action: 'delete', ids: [campaign.id] })}
          >
            <MoreVertical size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.campaigns}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Campaigns</h1>
          <p className={styles.subtitle}>
            {pagination.total} total campaigns
            {pendingReviewCount > 0 && (
              <span className={styles.reviewAlert}> · {pendingReviewCount} pending review</span>
            )}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="outline"
            leftIcon={<Download size={16} />}
            onClick={() => {
              exportCampaignsToCSV(campaigns);
              toast.success('Campaigns exported successfully');
            }}
          >
            Export
          </Button>
        </div>
      </div>

      <Card padding="none">
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={pagination.search}
              onChange={(e) => pagination.setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.toolbarActions}>
            <button
              className={`${styles.filterBtn} ${showFilters ? styles.active : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              Filters
              {hasActiveFilters && <span className={styles.filterBadge}>!</span>}
            </button>

            {selectedIds.size > 0 && (
              <div className={styles.bulkActions}>
                <Badge variant="primary">{selectedIds.size} selected</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Play size={14} />}
                  onClick={() => handleBulkAction('activate')}
                >
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Pause size={14} />}
                  onClick={() => handleBulkAction('pause')}
                >
                  Pause
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  leftIcon={<Trash2 size={14} />}
                  onClick={() => handleBulkAction('delete')}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        {showFilters && (
          <div className={styles.filtersPanel}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Status</label>
              <select
                value={statusFilter || ''}
                onChange={(e) => setStatusFilter(e.target.value as Campaign['status'] || undefined)}
                className={styles.filterSelect}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="review">Pending Review</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Ad Format</label>
              <select
                value={formatFilter || ''}
                onChange={(e) => setFormatFilter(e.target.value as Campaign['adFormat'] || undefined)}
                className={styles.filterSelect}
              >
                <option value="">All Formats</option>
                <option value="banner">Banner</option>
                <option value="interstitial">Interstitial</option>
                <option value="push">Push</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button className={styles.clearFilters} onClick={clearFilters}>
                <X size={14} />
                Clear filters
              </button>
            )}
          </div>
        )}

        <Table
          columns={columns}
          data={campaigns}
          keyField="id"
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onSort={(key, direction) => pagination.setSort(key, direction)}
          sortKey={pagination.sortBy}
          sortDirection={pagination.sortOrder}
          emptyMessage="No campaigns found"
          loading={isLoading}
        />

        {pagination.totalPages > 1 && (
          <div style={{ padding: '0 var(--spacing-md)' }}>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={pagination.setPage}
              onLimitChange={pagination.setLimit}
            />
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: 'delete', ids: [] })}
        onConfirm={handleConfirmAction}
        title={confirmDialog.action === 'delete' ? 'Delete Campaign(s)' : `${confirmDialog.action} Campaign(s)`}
        message={`Are you sure you want to ${confirmDialog.action} ${confirmDialog.ids.length} campaign(s)?`}
        confirmText={confirmDialog.action === 'delete' ? 'Delete' : confirmDialog.action === 'reject' ? 'Reject' : confirmDialog.action}
        variant={confirmDialog.action === 'delete' || confirmDialog.action === 'reject' ? 'danger' : 'warning'}
      />

      <CampaignDetail
        campaignId={detailCampaignId}
        isOpen={!!detailCampaignId}
        onClose={() => setDetailCampaignId(null)}
        onUpdate={() => pagination.setPage(pagination.page)}
      />
    </div>
  );
}
