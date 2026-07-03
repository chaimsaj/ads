import { useMemo, useState } from 'react';
import { ScrollText, Search } from 'lucide-react';
import { Card, CardContent, Input } from '../../components/ui';
import { useQuery } from '../../lib/queryCache';
import { auditApi, type AuditEntry } from '../../api/audit';
import { formatDateTime, titleCase } from '../../utils/formatters';
import styles from './AuditLog.module.css';

const actionVariant: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  campaign_approved: 'success',
  campaign_rejected: 'error',
  campaign_status_changed: 'info',
  campaign_deleted: 'error',
  user_status_changed: 'warning',
  user_updated: 'info',
  user_deleted: 'error',
};

export function AuditLog() {
  const { data, isLoading, error } = useQuery<AuditEntry[]>('admin:audit', () => auditApi.getRecent(200));
  const allEntries = useMemo(() => data ?? [], [data]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const actions = useMemo(
    () => Array.from(new Set(allEntries.map((e) => e.action))).sort(),
    [allEntries],
  );

  const entries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allEntries.filter((e) => {
      if (actionFilter && e.action !== actionFilter) return false;
      if (!q) return true;
      return [e.actorName, e.action, e.targetType, e.targetName, e.targetId, e.detail].some((f) =>
        (f ?? '').toLowerCase().includes(q),
      );
    });
  }, [allEntries, search, actionFilter]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Audit Log</h1>
          <p className={styles.subtitle}>Every governance action taken by an administrator</p>
        </div>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder="Search by admin, action, target, detail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={16} />}
        />
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={styles.select}>
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {titleCase(a)}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className={styles.cardBody}>
          {isLoading ? (
            <p className={styles.empty}>Loading…</p>
          ) : error ? (
            <p className={styles.empty}>Error loading audit log: {error}</p>
          ) : entries.length === 0 ? (
            <div className={styles.emptyState}>
              <ScrollText size={28} />
              <p>No actions recorded yet.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className={styles.when}>{formatDateTime(e.createdAt)}</td>
                    <td>{e.actorName}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[actionVariant[e.action] ?? 'default']}`}>
                        {titleCase(e.action)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.targetType}>{titleCase(e.targetType)}</span>{' '}
                      {e.targetName ?? e.targetId}
                    </td>
                    <td className={styles.detail}>{e.detail ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
