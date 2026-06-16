import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Upload, MapPin, Save, X, Loader, User, Calendar } from 'lucide-react';
import { Header, Footer } from '../../components/layout';
import { Button, Input } from '../../components/ui';
import { campaignsApi } from '../../api/campaigns';
import type { CampaignDetail } from '../../api/campaigns';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './EditCampaign.module.css';

type TabType = 'content' | 'targeting' | 'budget';

export function EditCampaign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);

  // Campaign form state
  const [formData, setFormData] = useState({
    name: '',
    adText: '',
    link: '',
    bannerImage: null as File | null,
    address: '',
    radius: '5',
    startDate: '',
    endDate: '',
    budget: '100',
  });

  // Generate preview URL for newly uploaded banner image
  const uploadedImageUrl = useMemo(() => {
    if (!formData.bannerImage) return null;
    return URL.createObjectURL(formData.bannerImage);
  }, [formData.bannerImage]);

  useEffect(() => {
    return () => {
      if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    };
  }, [uploadedImageUrl]);

  // The image to show in preview: uploaded file takes priority, then existing banner
  const previewImageUrl = uploadedImageUrl || campaign?.bannerImage || null;

  const adType = (campaign?.adType || '').toLowerCase();
  const adFormat = (campaign?.adFormat || '').toLowerCase();

  useEffect(() => {
    if (!id) return;
    loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedCampaign = await campaignsApi.getById(id!);
      if (!loadedCampaign) {
        setError('Campaign not found.');
        return;
      }
      const status = (loadedCampaign.status || '').toLowerCase();
      if (status !== 'draft' && status !== 'rejected') {
        setError('Only draft or rejected campaigns can be edited.');
        return;
      }
      setCampaign(loadedCampaign);
      setFormData({
        name: loadedCampaign.name || '',
        adText: loadedCampaign.adText || '',
        link: loadedCampaign.adLink || '',
        bannerImage: null,
        address: loadedCampaign.targeting?.address || '',
        radius: loadedCampaign.targeting?.radius || '5',
        startDate: loadedCampaign.startDate || '',
        endDate: loadedCampaign.endDate || '',
        budget: String(loadedCampaign.budget || 100),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await campaignsApi.update(id!, {
        name: formData.name,
        adText: formData.adText,
        link: formData.link,
        targeting: {
          address: formData.address,
          radius: formData.radius,
          startDate: formData.startDate,
          endDate: formData.endDate,
        },
        budget: parseFloat(formData.budget),
      });
      setHasChanges(false);
      navigate(`/campaign/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save campaign');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/campaign/${id}`);
  };

  const tabs = [
    { id: 'content' as const, label: 'Ad Content' },
    { id: 'targeting' as const, label: 'Targeting & Schedule' },
    { id: 'budget' as const, label: 'Budget' },
  ];

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Header variant="dashboard" user={user || { name: '' }} />
        <main className={styles.main}>
          <div className={styles.container} style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader size={32} />
            <p>Loading campaign...</p>
          </div>
        </main>
        <Footer variant="dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Header variant="dashboard" user={user || { name: '' }} />
        <main className={styles.main}>
          <div className={styles.container} style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--color-error, red)', marginBottom: '1rem' }}>{error}</p>
            <Link to={`/campaign/${id}`}>Back to Campaign Details</Link>
          </div>
        </main>
        <Footer variant="dashboard" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header variant="dashboard" user={user || { name: '' }} />

      <main className={styles.main}>
        <div className={`${styles.container} ${activeTab === 'content' ? styles.containerWide : ''}`}>

          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>Edit Campaign</h1>
              <p className={styles.subtitle}>
                Make changes to your campaign settings.
              </p>
            </div>
            <div className={styles.headerActions}>
              <Button variant="outline" leftIcon={<X size={18} />} onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="primary"
                leftIcon={<Save size={18} />}
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <div className={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={activeTab === 'content' ? styles.contentWithPreview : styles.content}>
            {activeTab === 'content' && (
              <>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Ad Content</h2>
                  <p className={styles.sectionDesc}>
                    Update your ad text, images, and destination link.
                  </p>

                  <div className={styles.formFields}>
                    <Input
                      label="Campaign Name"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                    />

                    <div className={styles.field}>
                      <label className={styles.label}>Ad Text</label>
                      <textarea
                        className={styles.textarea}
                        value={formData.adText}
                        onChange={(e) => updateField('adText', e.target.value)}
                        maxLength={150}
                        rows={4}
                      />
                      <span className={styles.charCount}>{formData.adText.length}/150</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Banner Image</label>
                      <label className={styles.uploadArea}>
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updateField('bannerImage', file);
                          }}
                          className={styles.fileInput}
                        />
                        <Upload size={24} />
                        <span>Upload new banner</span>
                      </label>
                      {formData.bannerImage && (
                        <p className={styles.fileName}>{formData.bannerImage.name}</p>
                      )}
                    </div>

                    <Input
                      label="Destination Link"
                      type="url"
                      value={formData.link}
                      onChange={(e) => updateField('link', e.target.value)}
                    />
                  </div>
                </section>

                {/* Live Phone Preview */}
                <div className={styles.previewSection}>
                  <h2 className={styles.previewTitle}>Preview</h2>
                  <div className={styles.phoneMockup}>
                    <div className={styles.phoneScreen}>

                      {/* USER type preview */}
                      {adType === 'user' && (
                        <>
                          <div className={styles.phoneHeader}>
                            <span className={styles.phoneLogo}>myngly</span>
                            <div className={styles.phoneIcons}>
                              <span className={styles.phoneIconDot} />
                              <span className={styles.phoneIconDot} />
                            </div>
                          </div>
                          <div className={styles.phoneContent}>
                            <div className={styles.profilePreview}>
                              <div className={styles.sponsoredBadge}>Sponsored</div>
                              <div className={styles.previewAvatar}>
                                {previewImageUrl ? (
                                  <img src={previewImageUrl} alt="Profile" className={styles.previewAvatarImg} />
                                ) : (
                                  <User size={28} />
                                )}
                              </div>
                              <span className={styles.previewName}>{formData.name || 'Your Name'}</span>
                              <p className={styles.previewAdText}>
                                {formData.adText || 'Your ad text will appear here...'}
                              </p>
                              <div className={styles.previewTags}>
                                <span className={styles.previewTag}>Network</span>
                                <span className={styles.previewTag}>Invest in projects</span>
                              </div>
                              <div className={styles.previewActions}>
                                <span className={styles.actionBtn}>&#10005;</span>
                                <span className={`${styles.actionBtn} ${styles.actionAccept}`}>&#10003;</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* EVENT type preview */}
                      {adType === 'event' && (
                        <>
                          <div className={styles.phoneStatusBar}>
                            <span className={styles.statusTime}>9:41</span>
                            <div className={styles.statusDots}>
                              <span className={styles.statusDot} />
                              <span className={styles.statusDot} />
                              <span className={styles.statusDot} />
                            </div>
                          </div>
                          <div className={styles.phoneHeaderEvents}>
                            <span className={styles.phoneHeaderTitle}>Events</span>
                          </div>
                          <div className={styles.phoneContent}>
                            <div className={styles.phoneTabs}>
                              <span className={styles.phoneTabActive}>Create Event</span>
                              <span className={styles.phoneTabInactive}>Hosted</span>
                              <span className={styles.phoneTabInactive}>Tickets</span>
                            </div>
                            <div className={styles.phoneEventsSection}>
                              <div className={styles.phoneEventsHeader}>
                                <span className={styles.phoneEventsLabel}>Your Events</span>
                                <span className={styles.phoneSeeAll}>See All</span>
                              </div>
                              <div className={styles.phoneEventCard}>
                                <div className={styles.phoneEventThumb} />
                                <div className={styles.phoneEventInfo}>
                                  <span className={styles.phoneEventDate}>Event date</span>
                                  <span className={styles.phoneEventName}>Upcoming Event</span>
                                </div>
                              </div>
                            </div>
                            <div className={styles.phonePromoted}>
                              <div className={styles.phonePromotedLabel}>Sponsored</div>
                              <div className={styles.phonePromotedCard}>
                                <div className={styles.phonePromotedThumb}>
                                  {previewImageUrl ? (
                                    <img src={previewImageUrl} alt="Event" className={styles.phoneThumbImg} />
                                  ) : (
                                    <Calendar size={16} />
                                  )}
                                </div>
                                <div className={styles.phonePromotedInfo}>
                                  <span className={styles.phonePromotedDate}>
                                    {formData.startDate || 'Event date'}
                                  </span>
                                  <span className={styles.phonePromotedName}>
                                    {formData.name || 'Your Event'}
                                  </span>
                                  {formData.address && (
                                    <span className={styles.phonePromotedAddress}>
                                      <MapPin size={10} /> {formData.address}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className={styles.phoneEventActions}>
                                <span className={styles.phoneActionBtn}>Going</span>
                                <span className={styles.phoneActionBtn}>Interested</span>
                                <span className={styles.phoneActionBtn}>Share</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* BRAND type preview */}
                      {adType === 'brand' && (
                        <>
                          <div className={styles.phoneHeader}>
                            <span>Calendar</span>
                            <span className={styles.searchIcon}>&#128269;</span>
                          </div>
                          <div className={styles.phoneContent}>
                            {adFormat === 'banner' && (
                              <>
                                <div className={styles.brandTabBar}>
                                  <span className={styles.brandTabActive}>Create Event</span>
                                  <span className={styles.brandTab}>Hosted Events</span>
                                </div>
                                <p className={styles.emptyText}>
                                  There are no events you are going to.<br /><strong>See All</strong>
                                </p>
                                <div className={styles.filterTabs}>
                                  <span>TOP</span>
                                  <span>THIS WEEK</span>
                                  <span>CONTACTS</span>
                                  <span>INTERESTED</span>
                                </div>
                                <div className={styles.adPreview}>
                                  <div className={styles.adHeader}>
                                    <strong>Your Ad</strong>
                                  </div>
                                  <p className={styles.adText}>
                                    {formData.adText || 'Your ad text will appear here...'}
                                  </p>
                                  {previewImageUrl && (
                                    <img
                                      src={previewImageUrl}
                                      alt="Banner preview"
                                      className={styles.adBannerImage}
                                    />
                                  )}
                                  {formData.link && (
                                    <a href="#" className={styles.adLink} onClick={(e) => e.preventDefault()}>
                                      click here
                                    </a>
                                  )}
                                </div>
                              </>
                            )}

                            {adFormat === 'interstitial' && (
                              <>
                                <div className={styles.brandTabBar}>
                                  <span className={styles.brandTabActive}>Create Event</span>
                                  <span className={styles.brandTab}>Hosted Events</span>
                                </div>
                                <div className={styles.interstitialOverlay}>
                                  <div className={styles.interstitialClose}>&#10005;</div>
                                  <div className={styles.interstitialContent}>
                                    {previewImageUrl ? (
                                      <img
                                        src={previewImageUrl}
                                        alt="Interstitial preview"
                                        className={styles.interstitialImage}
                                      />
                                    ) : (
                                      <div className={styles.interstitialPlaceholder}>
                                        <span>Ad Creative</span>
                                      </div>
                                    )}
                                    <p className={styles.interstitialText}>
                                      {formData.adText || 'Your full-screen ad appears here...'}
                                    </p>
                                    {formData.link && (
                                      <span className={styles.interstitialCta}>Learn More</span>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}

                            {adFormat === 'push' && (
                              <>
                                <div className={styles.pushNotification}>
                                  <div className={styles.pushIcon}>M</div>
                                  <div className={styles.pushBody}>
                                    <div className={styles.pushAppName}>Myngly</div>
                                    <p className={styles.pushText}>
                                      {formData.adText || 'Your push notification text...'}
                                    </p>
                                  </div>
                                  <div className={styles.pushTime}>now</div>
                                </div>
                                <div className={styles.brandTabBar}>
                                  <span className={styles.brandTabActive}>Create Event</span>
                                  <span className={styles.brandTab}>Hosted Events</span>
                                </div>
                                <p className={styles.emptyText}>
                                  There are no events you are going to.<br /><strong>See All</strong>
                                </p>
                                {previewImageUrl && (
                                  <div className={styles.pushBannerWrap}>
                                    <img
                                      src={previewImageUrl}
                                      alt="Push banner"
                                      className={styles.adBannerImage}
                                    />
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </>
                      )}

                      {/* Fallback for unknown type */}
                      {!adType && (
                        <div className={styles.phoneContent}>
                          <p className={styles.emptyText}>Preview not available</p>
                        </div>
                      )}

                      <div className={styles.phoneNav}>
                        <span>Home</span>
                        <span>Calendar</span>
                        <span>Inbox</span>
                        <span>Profile</span>
                      </div>
                    </div>
                  </div>
                  <p className={styles.previewNote}>
                    Published ads may differ from preview. Preview depends on operating system and screen size.
                  </p>
                </div>
              </>
            )}

            {activeTab === 'targeting' && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Targeting & Schedule</h2>
                <p className={styles.sectionDesc}>
                  Update location targeting and campaign dates.
                </p>

                <div className={styles.formFields}>
                  <Input
                    label="Target Location"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    leftIcon={<MapPin size={18} />}
                  />

                  <div className={styles.field}>
                    <label className={styles.label}>Radius</label>
                    <div className={styles.radiusSelector}>
                      {['1', '5', '10', '25', '50'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          className={`${styles.radiusBtn} ${formData.radius === r ? styles.active : ''}`}
                          onClick={() => updateField('radius', r)}
                        >
                          {r} miles
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.dateFields}>
                    <Input
                      label="Start Date"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateField('startDate', e.target.value)}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => updateField('endDate', e.target.value)}
                    />
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'budget' && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Budget</h2>
                <p className={styles.sectionDesc}>
                  Adjust your campaign budget.
                </p>

                <div className={styles.formFields}>
                  <div className={styles.field}>
                    <label className={styles.label}>Campaign Budget</label>
                    <div className={styles.budgetInput}>
                      <span className={styles.currency}>$</span>
                      <input
                        type="number"
                        value={formData.budget}
                        onChange={(e) => updateField('budget', e.target.value)}
                        className={styles.budgetField}
                        min="10"
                        step="10"
                      />
                      <span className={styles.budgetSuffix}>USD</span>
                    </div>
                  </div>

                  <div className={styles.budgetPresets}>
                    {['50', '100', '250', '500', '1000'].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        className={`${styles.presetBtn} ${formData.budget === amount ? styles.active : ''}`}
                        onClick={() => updateField('budget', amount)}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>

                  <div className={styles.summary}>
                    <h3 className={styles.summaryTitle}>Cost Summary</h3>
                    <div className={styles.summaryRow}>
                      <span>Campaign Budget</span>
                      <span>${formData.budget}.00</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Service Fee (5%)</span>
                      <span>${(parseFloat(formData.budget || '0') * 0.05).toFixed(2)}</span>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.total}`}>
                      <span>Total</span>
                      <span>${(parseFloat(formData.budget || '0') * 1.05).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer variant="dashboard" />
    </div>
  );
}
