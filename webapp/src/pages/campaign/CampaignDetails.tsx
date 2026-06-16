import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Pause, Play, Pencil, Loader, Send } from 'lucide-react';
import { Header } from '../../components/layout';
import { Button, Badge } from '../../components/ui';
import { campaignsApi, type CampaignDetail } from '../../api/campaigns';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './CampaignDetails.module.css';

export function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await campaignsApi.getById(id!);
      setCampaign(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    if (!campaign || statusUpdating) return;
    try {
      setStatusUpdating(true);
      setError(null);
      await campaignsApi.updateStatus(campaign.id, 'paused');
      setCampaign({ ...campaign, status: 'paused' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause campaign');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleResume = async () => {
    if (!campaign || statusUpdating) return;
    try {
      setStatusUpdating(true);
      setError(null);
      await campaignsApi.updateStatus(campaign.id, 'active');
      setCampaign({ ...campaign, status: 'active' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume campaign');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!campaign || statusUpdating) return;
    try {
      setStatusUpdating(true);
      setError(null);
      await campaignsApi.updateStatus(campaign.id, 'review');
      setCampaign({ ...campaign, status: 'review' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit campaign for review');
    } finally {
      setStatusUpdating(false);
    }
  };

  const canEdit = campaign?.status === 'draft' || campaign?.status === 'rejected';
  const canPauseResume = campaign?.status === 'active' || campaign?.status === 'scheduled' || campaign?.status === 'paused';

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Header variant="dashboard" title="Campaign Manager" user={user || { name: '' }} />
        <main className={styles.main}>
          <div className={styles.container} style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader size={32} />
            <p>Loading campaign...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className={styles.page}>
        <Header variant="dashboard" title="Campaign Manager" user={user || { name: '' }} />
        <main className={styles.main}>
          <div className={styles.container} style={{ textAlign: 'center', padding: '3rem' }}>
            <p>{error || 'Campaign not found'}</p>
            <Link to="/dashboard">Back to Dashboard</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header variant="dashboard" title="Campaign Manager" user={user || { name: '' }} />

      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.pageTitle}>Campaign Details</h1>

          <div className={styles.content}>
            <div className={styles.leftColumn}>
              {/* Campaign Overview */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Campaign Overview</h2>
                  {canEdit && (
                    <button className={styles.editBtn} onClick={() => navigate(`/campaign/${id}/edit`)}>Edit</button>
                  )}
                </div>
                <div className={styles.fieldGroup}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>ID</span>
                    <span className={styles.fieldValue}>{campaign.id}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Campaign Name</span>
                    <span className={styles.fieldValue}>{campaign.name}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Range time</span>
                    <span className={styles.fieldValue}>{campaign.startDate} - {campaign.endDate}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Ad Format</span>
                    <span className={styles.fieldValue}>{campaign.adFormat}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Created on</span>
                    <span className={styles.fieldValue}>{campaign.createdAt}</span>
                  </div>
                  <div className={styles.field}>
                    <Badge variant={campaign.status as 'active' | 'paused' | 'scheduled' | 'completed' | 'review' | 'draft' | 'rejected' | 'default'}>{campaign.status}</Badge>
                  </div>
                </div>
              </section>

              {/* Payment Info */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Payment info</h2>
                  {canEdit && (
                    <button className={styles.editBtn} onClick={() => navigate(`/campaign/${id}/edit`)}>Edit</button>
                  )}
                </div>
                <div className={styles.fieldGroup}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Payment method</span>
                    <span className={styles.fieldValue}>{campaign.paymentMethod}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Budget</span>
                    <span className={styles.fieldValue}>${campaign.budget.toFixed(2)}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Transaction ID</span>
                    <span className={styles.fieldValue}>{campaign.transactionId}</span>
                  </div>
                </div>
              </section>

              {/* Targeting */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Targeting</h2>
                  {canEdit && (
                    <button className={styles.editBtn} onClick={() => navigate(`/campaign/${id}/edit`)}>Edit</button>
                  )}
                </div>
                <div className={styles.fieldGroup}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Address</span>
                    <span className={styles.fieldValue}>{campaign.targeting.address}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Radio</span>
                    <span className={styles.fieldValue}>{campaign.targeting.radius}</span>
                  </div>
                </div>
              </section>
            </div>

            <div className={styles.rightColumn}>
              {/* Creative Assets */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Creative Assets</h2>
                  {canEdit && (
                    <button className={styles.editBtn} onClick={() => navigate(`/campaign/${id}/edit`)}>Edit</button>
                  )}
                </div>
                <div className={styles.fieldGroup}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Ad text</span>
                    <span className={styles.fieldValue}>{campaign.adText}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Ad link</span>
                    <span className={styles.fieldValue}>{campaign.adLink}</span>
                  </div>
                </div>

                <div className={styles.previewSection}>
                  <div className={styles.phoneMockup}>
                    <div className={styles.phoneScreen}>
                      <div className={styles.phoneHeader}>Calendar</div>
                      <div className={styles.adPreview}>
                        <div className={styles.adCard}>
                          <strong>{campaign.name}</strong>
                          <p>{campaign.adText}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className={styles.previewNote}>
                    Published banners may differ from preview. Preview depends on operating system and screen size.
                  </p>
                </div>
              </section>

              {!canEdit && (
                <p className={styles.lockNote}>
                  Campaign editing is locked while your ad is under review, running, or completed. Only draft and rejected campaigns can be edited.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <Link to="/dashboard" className={styles.backLink}>Back</Link>
          <div className={styles.footerActions}>
            {canPauseResume && campaign.status !== 'paused' && (
              <Button
                variant="outline"
                leftIcon={<Pause size={16} />}
                onClick={handlePause}
                disabled={statusUpdating}
              >
                {statusUpdating ? 'Updating...' : 'Pause Campaign'}
              </Button>
            )}
            {campaign.status === 'paused' && (
              <Button
                variant="outline"
                leftIcon={<Play size={16} />}
                onClick={handleResume}
                disabled={statusUpdating}
              >
                {statusUpdating ? 'Updating...' : 'Resume Campaign'}
              </Button>
            )}
            {canEdit && (
              <>
                <Button
                  variant="primary"
                  leftIcon={<Pencil size={16} />}
                  onClick={() => navigate(`/campaign/${id}/edit`)}
                >
                  Edit
                </Button>
                {campaign.status === 'draft' && (
                  <Button
                    variant="primary"
                    leftIcon={<Send size={16} />}
                    onClick={handleSubmitForReview}
                    disabled={statusUpdating}
                  >
                    {statusUpdating ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
