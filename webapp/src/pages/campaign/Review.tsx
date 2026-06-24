import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, MapPin, Calendar, DollarSign, Image, Link as LinkIcon, BarChart3 } from 'lucide-react';
import { WizardLayout } from '../../components/layout';
import { Button } from '../../components/ui';
import { campaignsApi } from '../../api/campaigns';
import type { CampaignEstimate } from '../../api/campaigns';
import { isApiError } from '../../api/client';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './Review.module.css';

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function getWizardData() {
  try {
    const raw = localStorage.getItem('campaignWizard');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function Review() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Store wizard data in state so it survives localStorage being cleared after submit
  const [wizardData] = useState(() => getWizardData());
  const [estimates, setEstimates] = useState<CampaignEstimate | null>(null);
  const [estimatesLoading, setEstimatesLoading] = useState(false);

  useEffect(() => {
    if (!wizardData) return;

    const budget = parseFloat(wizardData.budget || '0');
    if (budget <= 0) return;

    const adFormat = (wizardData.adFormat || 'banner').toUpperCase();
    const startDate = wizardData.startDate ? new Date(wizardData.startDate) : new Date();
    const endDate = wizardData.endDate ? new Date(wizardData.endDate) : new Date();
    const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    setEstimatesLoading(true);
    campaignsApi
      .getEstimate({
        budget,
        adFormat,
        durationDays,
        locationName: wizardData.address || undefined,
      })
      .then((data) => {
        setEstimates(data);
      })
      .catch(() => {
        setEstimates(null);
      })
      .finally(() => {
        setEstimatesLoading(false);
      });
  }, [wizardData]);

  const campaignData = wizardData
    ? {
        name: wizardData.name || '',
        format: wizardData.adFormat || '',
        adText: wizardData.adText || '',
        link: wizardData.link || '',
        hasBanner: !!wizardData.hasBanner,
        location: wizardData.address || '',
        radius: wizardData.radius ? `${wizardData.radius} miles` : '',
        startDate: wizardData.startDate || '',
        endDate: wizardData.endDate || '',
        budget: wizardData.budget || '0',
        serviceFee: (parseFloat(wizardData.budget || '0') * 0.05).toFixed(2),
        total: (parseFloat(wizardData.budget || '0') * 1.05).toFixed(2),
        paymentMethod: wizardData.paymentMethodLabel || 'Card on file',
      }
    : null;

  const handleSubmit = async () => {
    if (!wizardData) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await campaignsApi.create({
        name: wizardData.name || '',
        adType: wizardData.adType || 'brand',
        boostType: wizardData.boostType,
        adFormat: wizardData.adFormat || 'banner',
        adText: wizardData.adText || '',
        link: wizardData.link || '',
        bannerImage: wizardData.bannerImage || undefined,
        spotlightUserId: wizardData.spotlightUserId || undefined,
        eventId: wizardData.eventId || undefined,
        brandName: wizardData.brandName || undefined,
        brandTagline: wizardData.brandTagline || undefined,
        targeting: {
          address: wizardData.address || '',
          radius: wizardData.radius || '5',
          startDate: wizardData.startDate || '',
          endDate: wizardData.endDate || '',
          latitude: wizardData.latitude ?? null,
          longitude: wizardData.longitude ?? null,
        },
        audience: wizardData.audienceGoals ? {
          city: wizardData.audienceCity || '',
          industry: wizardData.audienceIndustry || '',
          goals: wizardData.audienceGoals || [],
          education: wizardData.audienceEducation || [],
          experience: wizardData.audienceExperience || [],
        } : undefined,
        budget: parseFloat(wizardData.budget || '0'),
        paymentMethodId: wizardData.paymentMethodId || '',
      });

      localStorage.removeItem('campaignWizard');
      setIsSubmitted(true);
    } catch (err) {
      if (isApiError(err)) {
        setSubmitError(err.message);
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to submit campaign');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewCampaigns = () => {
    navigate('/dashboard');
  };

  if (isSubmitted) {
    return (
      <WizardLayout
        currentStep={3}
        totalSteps={3}
        onBack={handleBack}
        onNext={handleViewCampaigns}
        nextLabel="View Campaigns"
        user={user || { name: '' }}
        hideBackButton
      >
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>
            <Check size={48} />
          </div>
          <h1 className={styles.successTitle}>Campaign Submitted!</h1>
          <p className={styles.successText}>
            Your campaign has been submitted for review. You'll receive an email once it's approved and live.
          </p>
          <div className={styles.successActions}>
            <Button variant="primary" onClick={handleViewCampaigns}>
              View My Campaigns
            </Button>
            <Button variant="outline" onClick={() => navigate('/campaign/new')}>
              Create Another Campaign
            </Button>
          </div>
        </div>
      </WizardLayout>
    );
  }

  if (!campaignData) {
    return (
      <WizardLayout
        currentStep={3}
        totalSteps={3}
        onBack={handleBack}
        onNext={() => navigate('/campaign/new')}
        nextLabel="Start Over"
        user={user || { name: '' }}
      >
        <div className={styles.container} style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No campaign data found. Please start the campaign creation process.</p>
        </div>
      </WizardLayout>
    );
  }

  return (
    <WizardLayout
      currentStep={3}
      totalSteps={3}
      onBack={handleBack}
      onNext={handleSubmit}
      nextLabel={isSubmitting ? 'Submitting...' : 'Submit Campaign'}
      nextDisabled={isSubmitting}
      user={user || { name: '' }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Review & Submit</h1>
          <p className={styles.subtitle}>
            Review your campaign details before submitting.
          </p>
        </div>

        {submitError && (
          <div style={{ color: 'red', padding: '1rem', marginBottom: '1rem' }}>{submitError}</div>
        )}

        <div className={styles.sections}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Ad Content</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/campaign/new/create-ad')}>
                Edit
              </Button>
            </div>

            <div className={styles.reviewItems}>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Ad Format</span>
                <span className={styles.reviewValue}>{campaignData.format}</span>
              </div>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Ad Text</span>
                <p className={styles.reviewText}>{campaignData.adText}</p>
              </div>
              <div className={styles.reviewItem}>
                <div className={styles.iconLabel}>
                  <Image size={16} />
                  <span className={styles.reviewLabel}>Banner</span>
                </div>
                <span className={styles.reviewValue}>
                  {campaignData.hasBanner ? 'Uploaded' : 'Not uploaded'}
                </span>
              </div>
              <div className={styles.reviewItem}>
                <div className={styles.iconLabel}>
                  <LinkIcon size={16} />
                  <span className={styles.reviewLabel}>Link</span>
                </div>
                <a href={campaignData.link} className={styles.reviewLink} target="_blank" rel="noopener noreferrer">
                  {campaignData.link}
                </a>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Targeting & Schedule</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/campaign/new/targeting')}>
                Edit
              </Button>
            </div>

            <div className={styles.reviewItems}>
              <div className={styles.reviewItem}>
                <div className={styles.iconLabel}>
                  <MapPin size={16} />
                  <span className={styles.reviewLabel}>Location</span>
                </div>
                <span className={styles.reviewValue}>{campaignData.location}</span>
              </div>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Radius</span>
                <span className={styles.reviewValue}>{campaignData.radius}</span>
              </div>
              <div className={styles.reviewItem}>
                <div className={styles.iconLabel}>
                  <Calendar size={16} />
                  <span className={styles.reviewLabel}>Duration</span>
                </div>
                <span className={styles.reviewValue}>
                  {campaignData.startDate} - {campaignData.endDate}
                </span>
              </div>
            </div>
          </section>

          {(estimatesLoading || estimates) && (
            <section className={styles.estimatesCard}>
              <div className={styles.estimatesHeader}>
                <div className={styles.estimatesIconTitle}>
                  <BarChart3 size={20} />
                  <h2 className={styles.sectionTitle}>Estimated Performance</h2>
                </div>
                <p className={styles.estimatesSubtitle}>
                  Based on your ${campaignData.budget} budget, {campaignData.format} format, and {campaignData.location || 'broad'} targeting
                </p>
              </div>

              {estimatesLoading ? (
                <div className={styles.estimatesGrid}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={styles.estimateItem}>
                      <div className={styles.estimateLabel}>Loading...</div>
                      <div className={styles.estimateRange} style={{ opacity: 0.3 }}>--</div>
                      <div className={styles.estimateBar}>
                        <div className={styles.estimateBarFill} style={{ width: '0%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : estimates ? (
                <>
                  <div className={styles.estimatesGrid}>
                    <div className={styles.estimateItem}>
                      <div className={styles.estimateLabel}>Estimated Reach</div>
                      <div className={styles.estimateRange}>
                        {formatNumber(estimates.estimatedImpressions.low)} - {formatNumber(estimates.estimatedImpressions.high)} impressions
                      </div>
                      <div className={styles.estimateBar}>
                        <div className={styles.estimateBarFill} style={{ width: '65%' }} />
                      </div>
                    </div>
                    <div className={styles.estimateItem}>
                      <div className={styles.estimateLabel}>Estimated Clicks</div>
                      <div className={styles.estimateRange}>
                        {formatNumber(estimates.estimatedClicks.low)} - {formatNumber(estimates.estimatedClicks.high)} click-throughs
                      </div>
                      <div className={styles.estimateBar}>
                        <div className={styles.estimateBarFill} style={{ width: '45%' }} />
                      </div>
                    </div>
                    <div className={styles.estimateItem}>
                      <div className={styles.estimateLabel}>Estimated CTR</div>
                      <div className={styles.estimateRange}>
                        {estimates.estimatedCtr.low.toFixed(1)}% - {estimates.estimatedCtr.high.toFixed(1)}%
                      </div>
                      <div className={styles.estimateBar}>
                        <div className={styles.estimateBarFill} style={{ width: '55%' }} />
                      </div>
                    </div>
                    <div className={styles.estimateItem}>
                      <div className={styles.estimateLabel}>Estimated CPC</div>
                      <div className={styles.estimateRange}>
                        ${estimates.estimatedCpc.low.toFixed(2)} - ${estimates.estimatedCpc.high.toFixed(2)}
                      </div>
                      <div className={styles.estimateBar}>
                        <div className={styles.estimateBarFill} style={{ width: '35%' }} />
                      </div>
                    </div>
                  </div>
                  <p className={styles.estimateNote}>
                    These estimates are based on industry benchmarks and may vary. Actual performance depends on ad quality, audience, and market conditions.
                  </p>
                </>
              ) : null}
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Payment</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/campaign/new/payment')}>
                Edit
              </Button>
            </div>

            <div className={styles.reviewItems}>
              <div className={styles.reviewItem}>
                <div className={styles.iconLabel}>
                  <DollarSign size={16} />
                  <span className={styles.reviewLabel}>Payment Method</span>
                </div>
                <span className={styles.reviewValue}>{campaignData.paymentMethod}</span>
              </div>
            </div>

            <div className={styles.costSummary}>
              <div className={styles.costRow}>
                <span>Campaign Budget</span>
                <span>${campaignData.budget}</span>
              </div>
              <div className={styles.costRow}>
                <span>Service Fee (5%)</span>
                <span>${campaignData.serviceFee}</span>
              </div>
              <div className={`${styles.costRow} ${styles.total}`}>
                <span>Total</span>
                <span>${campaignData.total}</span>
              </div>
            </div>
          </section>

          <section className={styles.termsSection}>
            <p className={styles.terms}>
              By submitting this campaign, you agree to our{' '}
              <a href="/terms" className={styles.termsLink}>Terms of Service</a>
              {' '}and{' '}
              <a href="/advertising-policies" className={styles.termsLink}>Advertising Policies</a>.
            </p>
          </section>
        </div>
      </div>
    </WizardLayout>
  );
}
