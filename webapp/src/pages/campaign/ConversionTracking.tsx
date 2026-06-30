import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Loader,
  ChevronRight,
  FileText,
  DollarSign,
  Copy,
  Check,
  Info,
  Send,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Header, Footer } from '../../components/layout';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { campaignsApi, type CampaignSummary } from '../../api/campaigns';
import { apiClient, API_BASE } from '../../api/client';
import styles from './ConversionTracking.module.css';

type ConversionType = 'application' | 'deposit';

interface TestResult {
  success: boolean;
  message: string;
}

function buildPixelSnippet(campaignId: string, type: ConversionType): string {
  return `<!-- Myngly Conversion Tracking Pixel -->\n<img src="${API_BASE}/tracking/pixel/${campaignId}.png?type=${type}"\n     width="1" height="1" style="display:none"\n     alt="" />`;
}

export function ConversionTracking() {
  const { id: paramId } = useParams();
  const { user } = useCurrentUser();

  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(paramId ?? '');
  const [conversionType, setConversionType] = useState<ConversionType>('application');
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const loadCampaigns = useCallback(async () => {
    try {
      setIsLoadingCampaigns(true);
      setLoadError(null);
      const data = await campaignsApi.getAll();
      const eligible = data.filter((c) => c.status === 'active' || c.status === 'scheduled');
      setCampaigns(eligible);
      if (!selectedCampaignId && eligible.length > 0) {
        setSelectedCampaignId(eligible[0].id);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, [selectedCampaignId]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleCopy = async () => {
    if (!selectedCampaignId) return;
    const snippet = buildPixelSnippet(selectedCampaignId, conversionType);
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = snippet;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendTest = async () => {
    if (!selectedCampaignId) return;
    try {
      setIsTesting(true);
      setTestResult(null);
      await apiClient.post('/tracking/conversion', {
        campaignId: selectedCampaignId,
        type: conversionType,
        test: true,
      });
      setTestResult({ success: true, message: 'Test conversion recorded successfully.' });
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Test conversion failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
  const hasSelection = Boolean(selectedCampaignId);

  if (isLoadingCampaigns) {
    return (
      <div className={styles.page}>
        <Header variant="dashboard" title="Conversion Tracking" user={user || { name: '' }} />
        <main className={styles.main}>
          <div className={styles.loadingState}>
            <Loader size={32} className={styles.spinner} />
            <p>Loading campaigns...</p>
          </div>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <Header variant="dashboard" title="Conversion Tracking" user={user || { name: '' }} />
        <main className={styles.main}>
          <div className={styles.errorState}>
            <p>{loadError}</p>
            <Link to="/dashboard">
              <button className={styles.testButton}>Back to Dashboard</button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header variant="dashboard" title="Conversion Tracking" user={user || { name: '' }} />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb}>
            <Link to="/dashboard">Dashboard</Link>
            <ChevronRight size={14} className={styles.breadcrumbSeparator} />
            {selectedCampaign && (
              <>
                <Link to={`/campaign/${selectedCampaignId}/performance`}>
                  {selectedCampaign.name}
                </Link>
                <ChevronRight size={14} className={styles.breadcrumbSeparator} />
              </>
            )}
            <span>Conversion Tracking</span>
          </nav>

          {/* Page Header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Conversion Tracking Setup</h1>
            <p className={styles.pageSubtitle}>
              Install a tracking pixel on your website to measure conversions from your campaigns.
            </p>
          </div>

          {/* Campaign Selector */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Select Campaign</h2>
            <div className={styles.selectGroup}>
              <label htmlFor="campaign-select" className={styles.selectLabel}>
                Campaign
              </label>
              <select
                id="campaign-select"
                className={styles.select}
                value={selectedCampaignId}
                onChange={(e) => {
                  setSelectedCampaignId(e.target.value);
                  setTestResult(null);
                }}
              >
                <option value="">-- Select a campaign --</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversion Type */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Conversion Type</h2>
            <div className={styles.typeCards}>
              <button
                type="button"
                className={`${styles.typeCard} ${conversionType === 'application' ? styles.typeCardSelected : ''}`}
                onClick={() => {
                  setConversionType('application');
                  setTestResult(null);
                }}
              >
                <FileText size={28} className={styles.typeCardIcon} />
                <p className={styles.typeCardTitle}>Application</p>
                <p className={styles.typeCardDesc}>Track form submissions</p>
              </button>
              <button
                type="button"
                className={`${styles.typeCard} ${conversionType === 'deposit' ? styles.typeCardSelected : ''}`}
                onClick={() => {
                  setConversionType('deposit');
                  setTestResult(null);
                }}
              >
                <DollarSign size={28} className={styles.typeCardIcon} />
                <p className={styles.typeCardTitle}>Deposit</p>
                <p className={styles.typeCardDesc}>Track tuition deposits</p>
              </button>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className={`${styles.section} ${!hasSelection ? styles.disabledOverlay : ''}`}>
            <h2 className={styles.sectionTitle}>Setup Instructions</h2>

            <div className={styles.steps}>
              {/* Step 1 */}
              <div className={styles.step}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNumber}>1</span>
                  <h3 className={styles.stepTitle}>Copy the tracking pixel</h3>
                </div>
                <div className={styles.stepContent}>
                  <p className={styles.stepDescription}>
                    Copy the HTML snippet below and paste it into your website's source code.
                  </p>
                  <div className={styles.codeWrapper}>
                    <pre className={styles.codeBlock}>
                      {hasSelection
                        ? buildPixelSnippet(selectedCampaignId, conversionType)
                        : '<!-- Select a campaign above to generate your pixel -->'}
                    </pre>
                    {hasSelection && (
                      <button
                        type="button"
                        className={`${styles.copyButton} ${copied ? styles.copyButtonCopied : ''}`}
                        onClick={handleCopy}
                      >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className={styles.step}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNumber}>2</span>
                  <h3 className={styles.stepTitle}>Place it on the right page</h3>
                </div>
                <div className={styles.stepContent}>
                  <p className={styles.stepDescription}>
                    {conversionType === 'application'
                      ? 'Add this pixel to the "Thank You" or confirmation page that appears after a user submits an application form.'
                      : 'Add this pixel to the payment confirmation page that appears after a user completes a tuition deposit.'}
                  </p>
                  <div className={styles.infoBox}>
                    <Info size={16} className={styles.infoIcon} />
                    <p className={styles.infoText}>
                      The tracking pixel is a 1x1 invisible image. It will not affect the appearance of your page.
                      When a visitor loads the page, the pixel fires and Myngly records the conversion.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className={styles.step}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNumber}>3</span>
                  <h3 className={styles.stepTitle}>Verify it's working</h3>
                </div>
                <div className={styles.stepContent}>
                  <p className={styles.stepDescription}>
                    Click the button below to send a test conversion event. This confirms the tracking endpoint is reachable.
                  </p>
                  <div className={styles.testRow}>
                    <button
                      type="button"
                      className={styles.testButton}
                      onClick={handleSendTest}
                      disabled={isTesting || !hasSelection}
                    >
                      {isTesting ? (
                        <Loader size={16} className={styles.spinner} />
                      ) : (
                        <Send size={16} />
                      )}
                      {isTesting ? 'Sending...' : 'Send Test'}
                    </button>
                    {testResult && (
                      <span
                        className={`${styles.testResult} ${testResult.success ? styles.testSuccess : styles.testFailure}`}
                      >
                        {testResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {testResult.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Status */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Tracking Status</h2>
            <div className={styles.statusGrid}>
              <div className={styles.statusCard}>
                <span
                  className={`${styles.statusDot} ${
                    testResult?.success && conversionType === 'application'
                      ? styles.statusDotActive
                      : styles.statusDotInactive
                  }`}
                />
                <div className={styles.statusInfo}>
                  <span className={styles.statusLabel}>Application Pixel</span>
                  <span className={styles.statusValue}>
                    {testResult?.success && conversionType === 'application'
                      ? 'Active'
                      : 'Not installed'}
                  </span>
                </div>
              </div>
              <div className={styles.statusCard}>
                <span
                  className={`${styles.statusDot} ${
                    testResult?.success && conversionType === 'deposit'
                      ? styles.statusDotActive
                      : styles.statusDotInactive
                  }`}
                />
                <div className={styles.statusInfo}>
                  <span className={styles.statusLabel}>Deposit Pixel</span>
                  <span className={styles.statusValue}>
                    {testResult?.success && conversionType === 'deposit'
                      ? 'Active'
                      : 'Not installed'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer variant="dashboard" />
    </div>
  );
}
