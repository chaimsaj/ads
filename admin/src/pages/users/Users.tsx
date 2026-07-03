import { useState, useMemo } from 'react';
import { Plus, Download, Trash2, Ban, CheckCircle, MoreVertical, Search, Filter, X, Eye } from 'lucide-react';
import { Card, Button, Table, StatusBadge, Badge, Pagination, ConfirmDialog } from '../../components/ui';
import { useUsers } from '../../hooks/useUsers';
import { UserDetail } from './UserDetail';
import { exportUsersToCSV } from '../../utils/export';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';
import type { User, TableColumn } from '../../types';
import styles from './Users.module.css';

export function Users() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.USERS_WRITE);
  const canDelete = hasPermission(PERMISSIONS.USERS_DELETE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<User['status'] | undefined>();
  const [roleFilter, setRoleFilter] = useState<User['role'] | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'delete' | 'suspend' | 'activate';
    ids: string[];
  }>({ isOpen: false, action: 'delete', ids: [] });
  const [detailUserId, setDetailUserId] = useState<string | null>(null);

  const filters = useMemo(() => ({
    status: statusFilter,
    role: roleFilter,
  }), [statusFilter, roleFilter]);

  const {
    users,
    pagination,
    isLoading,
    bulkAction,
    deleteUser,
  } = useUsers(filters);

  const clearFilters = () => {
    setStatusFilter(undefined);
    setRoleFilter(undefined);
    pagination.setSearch('');
  };

  const hasActiveFilters = pagination.search || statusFilter || roleFilter;

  const handleBulkAction = async (action: 'activate' | 'suspend' | 'delete') => {
    const ids = Array.from(selectedIds);
    if (action === 'delete') {
      setConfirmDialog({ isOpen: true, action: 'delete', ids });
    } else {
      await bulkAction(action, ids);
      setSelectedIds(new Set());
    }
  };

  const handleConfirmAction = async () => {
    const { action, ids } = confirmDialog;
    if (action === 'delete') {
      if (ids.length === 1) {
        await deleteUser(ids[0]);
      } else {
        await bulkAction(action, ids);
      }
    } else {
      await bulkAction(action, ids);
    }
    setSelectedIds(new Set());
    setConfirmDialog({ isOpen: false, action: 'delete', ids: [] });
  };

  const columns: TableColumn<User>[] = [
    {
      key: 'name',
      label: 'User',
      sortable: true,
      render: (user) => (
        <div className={styles.userCell}>
          <div className={styles.avatar}>{user.name.charAt(0)}</div>
          <div>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userEmail}>{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (user) => <StatusBadge status={user.role} />,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: 'totalCampaigns',
      label: 'Campaigns',
      sortable: true,
    },
    {
      key: 'totalSpend',
      label: 'Total Spend',
      sortable: true,
      render: (user) => formatCurrency(user.totalSpend),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      render: (user) => formatDate(user.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            title="View user"
            onClick={() => setDetailUserId(user.id)}
          >
            <Eye size={16} />
          </button>
          {canDelete && (
            <button
              className={styles.actionBtn}
              title="Delete user"
              onClick={() => setConfirmDialog({ isOpen: true, action: 'delete', ids: [user.id] })}
            >
              <MoreVertical size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.users}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.subtitle}>{pagination.total} total users</p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="outline"
            leftIcon={<Download size={16} />}
            onClick={() => {
              exportUsersToCSV(users);
              toast.success('Users exported successfully');
            }}
          >
            Export
          </Button>
          {canWrite && (
            <Button
              leftIcon={<Plus size={16} />}
              onClick={() => toast.info('Users register through the app. Use the invite system to onboard new users.')}
            >
              Add User
            </Button>
          )}
        </div>
      </div>

      <Card padding="none">
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search users..."
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

            {selectedIds.size > 0 && (canWrite || canDelete) && (
              <div className={styles.bulkActions}>
                <Badge variant="primary">{selectedIds.size} selected</Badge>
                {canWrite && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<CheckCircle size={14} />}
                      onClick={() => handleBulkAction('activate')}
                    >
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Ban size={14} />}
                      onClick={() => handleBulkAction('suspend')}
                    >
                      Suspend
                    </Button>
                  </>
                )}
                {canDelete && (
                  <Button
                    size="sm"
                    variant="danger"
                    leftIcon={<Trash2 size={14} />}
                    onClick={() => handleBulkAction('delete')}
                  >
                    Delete
                  </Button>
                )}
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
                onChange={(e) => setStatusFilter(e.target.value as User['status'] || undefined)}
                className={styles.filterSelect}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Role</label>
              <select
                value={roleFilter || ''}
                onChange={(e) => setRoleFilter(e.target.value as User['role'] || undefined)}
                className={styles.filterSelect}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="advertiser">Advertiser</option>
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
          data={users}
          keyField="id"
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onSort={(key, direction) => pagination.setSort(key, direction)}
          sortKey={pagination.sortBy}
          sortDirection={pagination.sortOrder}
          emptyMessage="No users found"
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
        title={confirmDialog.action === 'delete' ? 'Delete User(s)' : `${confirmDialog.action} User(s)`}
        message={`Are you sure you want to ${confirmDialog.action} ${confirmDialog.ids.length} user(s)? This action cannot be undone.`}
        confirmText={confirmDialog.action === 'delete' ? 'Delete' : confirmDialog.action}
        variant={confirmDialog.action === 'delete' ? 'danger' : 'warning'}
      />

      <UserDetail
        userId={detailUserId}
        isOpen={!!detailUserId}
        onClose={() => setDetailUserId(null)}
        onUpdate={() => pagination.setPage(pagination.page)}
      />
    </div>
  );
}
