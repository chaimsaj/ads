import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { WizardLayout } from '../../components/layout';
import { Input } from '../../components/ui';
import { campaignsApi } from '../../api/campaigns';
import { isApiError } from '../../api/client';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './CreateAd.module.css';

const MAX_BANNER_BYTES = 5 * 1024 * 1024;

type AdFormat = 'banner' | 'interstitial' | 'push';

const formatInfo: Record<AdFormat, { title: string; description: string }> = {
  banner: {
    title: 'Banner',
    description: 'Display your ad in the events section of the calendar.',
  },
  interstitial: {
    title: 'Interstitial',
    description: 'Full screen ad that covers the entire interface of the Myngly application.',
  },
  push: {
    title: 'Push to nearby users',
    description: 'Limit your audience based on location.',
  },
};

function saveWizardData(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem('campaignWizard') || '{}');
  localStorage.setItem('campaignWizard', JSON.stringify({ ...existing, ...data }));
}

export function CreateAd() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const wizardData = JSON.parse(localStorage.getItem('campaignWizard') || '{}');
  const format = (wizardData.adFormat || searchParams.get('format') || 'banner') as AdFormat;

  const [formData, setFormData] = useState({
    adText: (wizardData.adText as string) || '',
    link: (wizardData.link as string) || '',
    bannerImage: null as File | null,
    bannerUrl: (wizardData.bannerImage as string) || '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const info = formatInfo[format];

  const imagePreviewUrl = useMemo(() => {
    if (!formData.bannerImage) return null;
    return URL.createObjectURL(formData.bannerImage);
  }, [formData.bannerImage]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const normalizedLink = formData.link && !/^https?:\/\//i.test(formData.link)
    ? `https://${formData.link}`
    : formData.link;

  const handleNext = () => {
    saveWizardData({
      adText: formData.adText,
      link: normalizedLink,
      bannerImage: formData.bannerUrl || undefined,
      hasBanner: !!formData.bannerUrl,
    });
    navigate('/campaign/new/targeting');
  };

  const handleBack = () => {
    navigate('/campaign/new/ad-format');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BANNER_BYTES) {
      setUploadError('Image is too large. Please choose a file under 5 MB.');
      e.target.value = '';
      return;
    }
    setUploadError(null);
    setFormData((prev) => ({ ...prev, bannerImage: file }));
    setIsUploading(true);
    try {
      const { url } = await campaignsApi.uploadBanner(file, format);
      setFormData((prev) => ({ ...prev, bannerUrl: url }));
    } catch (err) {
      setFormData((prev) => ({ ...prev, bannerImage: null, bannerUrl: '' }));
      setUploadError(isApiError(err) ? err.message : 'Failed to upload banner. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <WizardLayout
      currentStep={2}
      totalSteps={3}
      onBack={handleBack}
      onNext={handleNext}
      nextDisabled={!formData.adText || !formData.link || isUploading}
      user={user || { name: '' }}
    >
      <div className={styles.container}>
        <div className={styles.formSection}>
          <div className={styles.header}>
            <span className={styles.label}>Create Ad</span>
            <h1 className={styles.title}>{info.title}</h1>
            <p className={styles.description}>{info.description}</p>
          </div>

          <div className={styles.formCard}>
            <div className={styles.field}>
              <h3 className={styles.fieldTitle}>Ad text <span className={styles.required}>(required)</span></h3>
              <p className={styles.fieldHint}>Enter the text you want to appear in the ad.</p>
              <textarea
                className={styles.textarea}
                value={formData.adText}
                onChange={(e) => setFormData({ ...formData, adText: e.target.value })}
                maxLength={150}
                placeholder="Enter your ad text here..."
              />
              <span className={styles.charCount}>{formData.adText.length}/150</span>
            </div>

            <div className={styles.field}>
              <h3 className={styles.fieldTitle}>Banner</h3>
              <p className={styles.fieldHint}>Drag and drop files to upload them to your library. Use JPG or PNG.</p>
              <label className={styles.uploadArea}>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleImageUpload}
                  className={styles.fileInput}
                />
                <Upload size={24} />
                <span>Upload banner graphics</span>
              </label>
              {isUploading && <p className={styles.fileName}>Uploading...</p>}
              {!isUploading && formData.bannerImage && (
                <p className={styles.fileName}>{formData.bannerImage.name}</p>
              )}
              {uploadError && (
                <p className={styles.fileName} style={{ color: 'var(--color-error, red)' }}>{uploadError}</p>
              )}
            </div>

            <div className={styles.field}>
              <h3 className={styles.fieldTitle}>Link</h3>
              <p className={styles.fieldHint}>Enter the link you want users to visit.</p>
              <Input
                placeholder="https://example.com"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className={styles.previewSection}>
          <h2 className={styles.previewTitle}>Preview</h2>
          <div className={styles.phoneMockup}>
            <div className={styles.phoneScreen}>
              <div className={styles.phoneHeader}>
                <span>Calendar</span>
                <span className={styles.searchIcon}>&#128269;</span>
              </div>
              <div className={styles.phoneContent}>
                {format === 'banner' && (
                  <>
                    <div className={styles.tabBar}>
                      <span className={styles.tabActive}>Create Event</span>
                      <span className={styles.tab}>Hosted Events</span>
                    </div>
                    <p className={styles.emptyText}>There are no events you are going to.<br /><strong>See All</strong></p>
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
                      {imagePreviewUrl && (
                        <img
                          src={imagePreviewUrl}
                          alt="Banner preview"
                          className={styles.adBannerImage}
                        />
                      )}
                      {formData.link && (
                        <a href="#" className={styles.adLink}>click here</a>
                      )}
                    </div>
                  </>
                )}

                {format === 'interstitial' && (
                  <>
                    <div className={styles.tabBar}>
                      <span className={styles.tabActive}>Create Event</span>
                      <span className={styles.tab}>Hosted Events</span>
                    </div>
                    <div className={styles.interstitialOverlay}>
                      <div className={styles.interstitialClose}>&#10005;</div>
                      <div className={styles.interstitialContent}>
                        {imagePreviewUrl ? (
                          <img
                            src={imagePreviewUrl}
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

                {format === 'push' && (
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
                    <div className={styles.tabBar}>
                      <span className={styles.tabActive}>Create Event</span>
                      <span className={styles.tab}>Hosted Events</span>
                    </div>
                    <p className={styles.emptyText}>There are no events you are going to.<br /><strong>See All</strong></p>
                    {imagePreviewUrl && (
                      <div className={styles.pushBannerWrap}>
                        <img
                          src={imagePreviewUrl}
                          alt="Push banner"
                          className={styles.adBannerImage}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className={styles.phoneNav}>
                <span>Home</span>
                <span>Calendar</span>
                <span>Inbox</span>
                <span>Profile</span>
              </div>
            </div>
          </div>
          <p className={styles.previewNote}>
            Published banners may differ from preview. Preview depends on operating system and screen size.
          </p>
        </div>
      </div>
    </WizardLayout>
  );
}
