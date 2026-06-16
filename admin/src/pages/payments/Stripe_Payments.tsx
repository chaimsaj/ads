import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../context/ToastContext'
import stripePaymentsApi, {
  type StripeBalance,
  type StripePaymentStats,
  type StripeTransaction,
  type StripeDispute,
} from '../../api/Stripe_payments'
import styles from './Stripe_Payments.module.css'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Search,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Ban,
} from 'lucide-react'

type TabId = 'overview' | 'transactions' | 'disputes'

export function StripePayments() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [loading, setLoading] = useState(true)
  const fetchedRef = useRef(false)

  // Data states
  const [balance, setBalance] = useState<StripeBalance | null>(null)
  const [stats, setStats] = useState<StripePaymentStats | null>(null)
  const [transactions, setTransactions] = useState<StripeTransaction[]>([])
  const [disputes, setDisputes] = useState<StripeDispute[]>([])

  // UI states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  })

  // Modal states
  const [selectedTransaction, setSelectedTransaction] = useState<StripeTransaction | null>(null)
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState<'duplicate' | 'fraudulent' | 'requested_by_customer'>('requested_by_customer')

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(amount / 100)
    } catch {
      return `$${(amount / 100).toFixed(2)}`
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [balanceData, statsData] = await Promise.all([
        stripePaymentsApi.getBalance(),
        stripePaymentsApi.getPaymentStats(dateRange.startDate, dateRange.endDate),
      ])
      setBalance(balanceData)
      setStats(statsData)
    } catch {
      toast.error('Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }, [dateRange, toast])

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await stripePaymentsApi.listTransactions({
        status: statusFilter || undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 50,
      })
      setTransactions(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load transactions')
      setTransactions([])
    }
  }, [dateRange, statusFilter, toast])

  const fetchDisputes = useCallback(async () => {
    try {
      const data = await stripePaymentsApi.listDisputes({ limit: 20 })
      setDisputes(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load disputes')
      setDisputes([])
    }
  }, [toast])

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'transactions') fetchTransactions()
    if (activeTab === 'disputes') fetchDisputes()
  }, [activeTab, fetchTransactions, fetchDisputes])

  const handleRefund = async () => {
    if (!selectedTransaction?.stripePaymentIntentId) return

    if (refundAmount) {
      const parsed = parseFloat(refundAmount)
      if (isNaN(parsed) || parsed <= 0) {
        toast.error('Refund amount must be a positive number')
        return
      }
      const maxAmount = (selectedTransaction.amount ?? 0) / 100
      if (parsed > maxAmount) {
        toast.error(`Refund amount cannot exceed the original amount ($${maxAmount.toFixed(2)})`)
        return
      }
    }

    try {
      await stripePaymentsApi.createRefund({
        paymentIntentId: selectedTransaction.stripePaymentIntentId,
        amount: refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined,
        reason: refundReason,
      })
      toast.success('Refund created successfully')
      setIsRefundModalOpen(false)
      setSelectedTransaction(null)
      setRefundAmount('')
      fetchTransactions()
    } catch {
      toast.error('Failed to create refund')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      completed: 'success',
      succeeded: 'success',
      paid: 'success',
      pending: 'warning',
      processing: 'warning',
      open: 'warning',
      failed: 'error',
      refunded: 'default',
      canceled: 'default',
      void: 'default',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const tabItems: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'disputes', label: 'Disputes' },
  ]

  const availableBalance = balance?.available?.[0]
  const pendingBalance = balance?.pending?.[0]
  const growth = stats?.periodComparison?.revenueGrowth ?? 0

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Payments</h1>
          <p>Manage Stripe payments and refunds</p>
        </div>
        <Button onClick={() => { fetchedRef.current = false; fetchData(); }} variant="outline" leftIcon={<RefreshCw size={16} />}>
          Refresh
        </Button>
      </div>

      {/* Tabs */}
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

      {loading && activeTab === 'overview' && (
        <p className={styles.loadingText}>Loading...</p>
      )}

      {activeTab === 'overview' && !loading && (
        <div className={styles.overview}>
          {/* Balance Cards */}
          <div className={styles.balanceCards}>
            <Card className={styles.balanceCard}>
              <div className={styles.cardIcon}>
                <DollarSign size={24} />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardLabel}>Available Balance</span>
                <span className={styles.cardValue}>
                  {availableBalance
                    ? formatCurrency(availableBalance.amount, availableBalance.currency)
                    : '$0.00'}
                </span>
              </div>
            </Card>
            <Card className={styles.balanceCard}>
              <div className={styles.cardIcon}>
                <CreditCard size={24} />
              </div>
              <div className={styles.cardContent}>
                <span className={styles.cardLabel}>Pending Balance</span>
                <span className={styles.cardValue}>
                  {pendingBalance
                    ? formatCurrency(pendingBalance.amount, pendingBalance.currency)
                    : '$0.00'}
                </span>
              </div>
            </Card>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className={styles.statsGrid}>
              <Card className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span>Total Revenue</span>
                  {growth >= 0 ? (
                    <TrendingUp size={16} className={styles.positive} />
                  ) : (
                    <TrendingDown size={16} className={styles.negative} />
                  )}
                </div>
                <div className={styles.statValue}>
                  {formatCurrency(stats.totalRevenue ?? 0)}
                </div>
                <div className={`${styles.statChange} ${growth >= 0 ? styles.positive : styles.negative}`}>
                  {growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(growth).toFixed(1)}% vs previous period
                </div>
              </Card>

              <Card className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span>Successful Payments</span>
                </div>
                <div className={styles.statValue}>{stats.successfulPayments ?? 0}</div>
                <div className={styles.statSecondary}>
                  of {stats.totalTransactions ?? 0} total
                </div>
              </Card>

              <Card className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span>Failed Payments</span>
                </div>
                <div className={styles.statValue}>{stats.failedPayments ?? 0}</div>
                <div className={styles.statSecondary}>
                  {(stats.totalTransactions ?? 0) > 0
                    ? (((stats.failedPayments ?? 0) / stats.totalTransactions) * 100).toFixed(1)
                    : '0.0'}% failure rate
                </div>
              </Card>

              <Card className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span>Refunded Amount</span>
                </div>
                <div className={styles.statValue}>
                  {formatCurrency(stats.refundedAmount ?? 0)}
                </div>
                <div className={styles.statSecondary}>
                  Avg: {formatCurrency(stats.averageTransactionValue ?? 0)}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className={styles.transactions}>
          <div className={styles.filters}>
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.select}
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Campaign</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-tertiary)' }}>
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <code className={styles.txId}>
                          {(tx.stripePaymentIntentId ?? tx.id ?? '').slice(0, 16)}...
                        </code>
                      </td>
                      <td>{formatCurrency(tx.amount ?? 0, tx.currency)}</td>
                      <td>{getStatusBadge(tx.status ?? 'pending')}</td>
                      <td>{tx.type || '-'}</td>
                      <td>{tx.campaignId || '-'}</td>
                      <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '-'}</td>
                      <td>
                        <div className={styles.actions}>
                          {tx.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTransaction(tx)
                                setIsRefundModalOpen(true)
                              }}
                            >
                              <Ban size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'disputes' && (
        <div className={styles.disputes}>
          {disputes.length === 0 ? (
            <Card className={styles.emptyState}>
              <AlertTriangle size={48} />
              <h3>No Disputes</h3>
              <p>No payment disputes found</p>
            </Card>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Dispute ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Evidence Due</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((dispute) => (
                    <tr key={dispute.id}>
                      <td>
                        <code className={styles.txId}>
                          {(dispute.id ?? '').slice(0, 16)}...
                        </code>
                      </td>
                      <td>{formatCurrency(dispute.amount ?? 0, dispute.currency)}</td>
                      <td>{getStatusBadge(dispute.status ?? 'unknown')}</td>
                      <td>{dispute.reason || '-'}</td>
                      <td>
                        {dispute.evidenceDueBy
                          ? new Date(dispute.evidenceDueBy).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Refund Modal */}
      <Modal
        isOpen={isRefundModalOpen}
        onClose={() => {
          setIsRefundModalOpen(false)
          setSelectedTransaction(null)
          setRefundAmount('')
        }}
        title="Create Refund"
      >
        <div className={styles.refundModal}>
          <p>
            Refund for transaction: <code>{selectedTransaction?.stripePaymentIntentId ?? '-'}</code>
          </p>
          <p>
            Original amount:{' '}
            {selectedTransaction
              ? formatCurrency(selectedTransaction.amount ?? 0, selectedTransaction.currency)
              : '-'}
          </p>

          <Input
            label="Refund Amount (leave empty for full refund)"
            type="number"
            placeholder="Amount in dollars"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
          />

          <div className={styles.formGroup}>
            <label>Reason</label>
            <select
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value as typeof refundReason)}
              className={styles.select}
            >
              <option value="requested_by_customer">Requested by customer</option>
              <option value="duplicate">Duplicate</option>
              <option value="fraudulent">Fraudulent</option>
            </select>
          </div>

          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setIsRefundModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRefund}>
              Create Refund
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default StripePayments
