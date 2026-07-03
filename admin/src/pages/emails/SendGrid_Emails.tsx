import { useState, useEffect, useCallback } from 'react';
import {
  sendGridEmailsApi,
  type EmailLogEntry,
  type EmailStats,
  type BulkEmailRequest,
} from '../../api/SendGrid_emails';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import styles from './SendGrid_Emails.module.css';

type TabType = 'overview' | 'logs' | 'bulk';

export function SendGridEmails() {
  const { user } = useAuth();
  // Sending bulk email is a governance/comms action (backend: AdminGovernance = super-admin/admin).
  const canSendEmail = user?.role === 'super_admin' || user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [stats, setStats] = useState<EmailStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);

  const [bulkEmail, setBulkEmail] = useState({
    recipientsText: '',
    subject: '',
    content: '',
  });

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await sendGridEmailsApi.getEmailStats();
      setStats(data);
    } catch {
      setError('Failed to load email statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sendGridEmailsApi.getEmailLogs();
      setLogs(data.logs || []);
    } catch {
      setError('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, loadLogs]);

  const handleSendBulkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSendEmail) {
      setError('You do not have permission to send bulk email.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const emails = bulkEmail.recipientsText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
          const match = line.match(/^.+?\s*<(.+?)>$/);
          return match ? match[1].trim() : line;
        });

      if (emails.length === 0) {
        setError('Please enter at least one recipient');
        setLoading(false);
        return;
      }

      const request: BulkEmailRequest = {
        to: emails,
        subject: bulkEmail.subject,
        html: bulkEmail.content,
      };

      const result = await sendGridEmailsApi.sendBulkEmail(request);
      const { successCount, failedCount, totalRecipients } = result;
      setSuccess(
        `Bulk email completed: ${successCount}/${totalRecipients} sent successfully` +
          (failedCount > 0 ? `, ${failedCount} failed` : ''),
      );
      setBulkEmail({ recipientsText: '', subject: '', content: '' });
    } catch {
      setError('Failed to send bulk email');
    } finally {
      setLoading(false);
    }
  };

  const tabItems: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'logs', label: 'Logs' },
    ...(canSendEmail ? [{ id: 'bulk' as const, label: 'Bulk' }] : []),
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Email Management</h1>
        <p>Manage email communications via SendGrid</p>
      </div>

      {error && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <span>{error}</span>
          <button className={styles.alertClose} onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}
      {success && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <span>{success}</span>
          <button className={styles.alertClose} onClick={() => setSuccess(null)}>
            &times;
          </button>
        </div>
      )}

      <div className={styles.tabBar}>
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <Card>
            <div style={{ padding: 'var(--space-10)' }}>
              <h3 className={styles.formTitle}>Email Statistics</h3>
              {statsLoading ? (
                <p className={styles.loadingText}>Loading statistics...</p>
              ) : stats ? (
                <>
                  <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} ${styles.blue}`}>
                      <span className={styles.statLabel}>Total Sent</span>
                      <p className={styles.statValue}>{stats.totalSent}</p>
                    </div>
                    <div className={`${styles.statCard} ${styles.red}`}>
                      <span className={styles.statLabel}>Total Failed</span>
                      <p className={styles.statValue}>{stats.totalFailed}</p>
                    </div>
                    <div className={`${styles.statCard} ${styles.green}`}>
                      <span className={styles.statLabel}>Success Rate</span>
                      <p className={styles.statValue}>{(stats.successRate ?? 0).toFixed(1)}%</p>
                    </div>
                    <div className={`${styles.statCard} ${styles.purple}`}>
                      <span className={styles.statLabel}>Total Emails</span>
                      <p className={styles.statValue}>{stats.totalSent + stats.totalFailed}</p>
                    </div>
                  </div>

                  {Object.keys(stats.byTemplate ?? {}).length > 0 && (
                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>By Template Type</h4>
                      <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Template</th>
                              <th>Sent</th>
                              <th>Failed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(stats.byTemplate ?? {}).map(([template, data]) => (
                              <tr key={template}>
                                <td>{template}</td>
                                <td style={{ color: 'var(--color-success)' }}>{data.sent}</td>
                                <td style={{ color: 'var(--color-error)' }}>{data.failed}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {(stats.byDay ?? []).length > 0 && (
                    <div className={styles.section}>
                      <h4 className={styles.sectionTitle}>Last 7 Days</h4>
                      <div className={styles.dayGrid}>
                        {(stats.byDay ?? []).slice(-7).map((day) => (
                          <div key={day.date} className={styles.dayItem}>
                            <div className={styles.dayLabel}>
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className={styles.daySent}>{day.sent}</div>
                            <div className={styles.dayFailed}>{day.failed}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.statsGrid}>
                  <div className={`${styles.statCard} ${styles.blue}`}>
                    <span className={styles.statLabel}>Total Sent</span>
                    <p className={styles.statValue}>0</p>
                  </div>
                  <div className={`${styles.statCard} ${styles.red}`}>
                    <span className={styles.statLabel}>Total Failed</span>
                    <p className={styles.statValue}>0</p>
                  </div>
                  <div className={`${styles.statCard} ${styles.green}`}>
                    <span className={styles.statLabel}>Success Rate</span>
                    <p className={styles.statValue}>0.0%</p>
                  </div>
                  <div className={`${styles.statCard} ${styles.purple}`}>
                    <span className={styles.statLabel}>Total Emails</span>
                    <p className={styles.statValue}>0</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Status</th>
                <th>To</th>
                <th>Subject</th>
                <th>Template</th>
                <th>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={styles.emptyRow}>Loading...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyRow}>No email logs found</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          log.status === 'sent' ? styles.badgeSent : styles.badgeFailed
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 'var(--font-medium)' }}>
                        {log.toName || log.to}
                      </div>
                      {log.toName && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-neutral-500)' }}>
                          {log.to}
                        </div>
                      )}
                    </td>
                    <td>{log.subject}</td>
                    <td style={{ color: 'var(--color-neutral-500)' }}>
                      {log.templateType || '-'}
                    </td>
                    <td style={{ color: 'var(--color-neutral-500)' }}>
                      {new Date(log.sentAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'bulk' && (
        <Card className={styles.formCard}>
          <div style={{ padding: 'var(--space-10)' }}>
            <h3 className={styles.formTitle}>Send Bulk Email</h3>
            <form onSubmit={handleSendBulkEmail} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Recipients (one per line)</label>
                <textarea
                  value={bulkEmail.recipientsText}
                  onChange={(e) => setBulkEmail({ ...bulkEmail, recipientsText: e.target.value })}
                  required
                  rows={5}
                  className={`${styles.textarea} ${styles.textareaMono}`}
                  placeholder={`email@example.com\nJohn Doe <john@example.com>\njane@example.com`}
                />
                <span className={styles.formHint}>
                  Format: email@example.com or Name &lt;email@example.com&gt;
                </span>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Subject</label>
                <input
                  type="text"
                  value={bulkEmail.subject}
                  onChange={(e) => setBulkEmail({ ...bulkEmail, subject: e.target.value })}
                  required
                  className={styles.input}
                  placeholder="Email subject"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Content (HTML)</label>
                <textarea
                  value={bulkEmail.content}
                  onChange={(e) => setBulkEmail({ ...bulkEmail, content: e.target.value })}
                  required
                  rows={8}
                  className={styles.textarea}
                  placeholder="<h1>Hello</h1><p>Your email content here...</p>"
                />
              </div>
              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? 'Sending...' : 'Send Bulk Email'}
              </button>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}

export default SendGridEmails;
