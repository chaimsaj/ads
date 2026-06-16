import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Upload, X } from 'lucide-react';
import { WizardLayout } from '../../components/layout';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './EventPreview.module.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function getWizardData(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('campaignWizard') || '{}'); } catch { return {}; }
}

function saveWizardData(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem('campaignWizard') || '{}');
  localStorage.setItem('campaignWizard', JSON.stringify({ ...existing, ...data }));
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function formatEventDate(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toISOString().slice(0, 10);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    const m = String(minutes).padStart(2, '0');
    return `${date} \u00b7 ${h}:${m} ${ampm}`;
  } catch {
    return iso;
  }
}

export function EventPreview() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const wizardData = getWizardData();

  const eventCode = (wizardData.eventCode as number) || 0;
  const eventName = (wizardData.eventName as string) || 'Your Event';
  const eventAddress = (wizardData.eventAddress as string) || '';
  const eventDate = (wizardData.eventDate as string) || '';
  const originalBanner = (wizardData.eventBannerImage as string) || '';

  const [bannerImage, setBannerImage] = useState(originalBanner);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Please upload a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Image must be under 5 MB.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setBannerImage(dataUrl);
      saveWizardData({ eventBannerImage: dataUrl });
    } catch {
      setUploadError('Failed to read image. Please try again.');
    }
    e.target.value = '';
  }, []);

  const handleRemoveImage = useCallback(() => {
    setBannerImage('');
    saveWizardData({ eventBannerImage: '' });
  }, []);

  const handleNext = () => {
    navigate('/campaign/new/targeting');
  };

  const handleBack = () => {
    navigate('/campaign/new/audience-targeting');
  };

  return (
    <WizardLayout
      currentStep={2}
      totalSteps={3}
      onBack={handleBack}
      onNext={handleNext}
      user={user || { name: '' }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Event Preview</h1>
          <p className={styles.subtitle}>
            Your event will appear at the top of the Events tab and trigger a push notification to nearby users.
          </p>
          <p className={styles.subtitle}>
            Get maximum visibility and reach the right people when they're most likely to attend.
          </p>
        </div>

        <div className={styles.content}>
          {/* Left: Event Banner */}
          <div className={styles.bannerSection}>
            <h2 className={styles.sectionTitle}>Event Banner</h2>
            <p className={styles.sectionSubtitle}>
              Upload a custom banner image for your event promotion, or keep the existing one.
            </p>

            <div className={styles.uploadControls}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className={styles.fileInput}
              />
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} />
                {bannerImage ? 'Change Image' : 'Upload Image'}
              </button>
              {bannerImage && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={handleRemoveImage}
                >
                  <X size={16} />
                  Remove
                </button>
              )}
            </div>
            {uploadError && <p className={styles.uploadError}>{uploadError}</p>}

            <div className={styles.eventCard}>
              <div className={styles.eventCardImage}>
                {bannerImage ? (
                  <img src={bannerImage} alt={eventName} className={styles.bannerImg} />
                ) : (
                  <div className={styles.bannerPlaceholder}>
                    <Calendar size={48} />
                  </div>
                )}
              </div>
              <div className={styles.eventCardInfo}>
                <span className={styles.eventCode}>code: <strong>{eventCode}</strong></span>
                <span className={styles.eventDateTime}>{formatEventDate(eventDate)}</span>
                <h3 className={styles.eventName}>{eventName}</h3>
                {eventAddress && (
                  <span className={styles.eventAddress}>{eventAddress}</span>
                )}
              </div>
            </div>

            <p className={styles.pushNote}>
              This promotion includes a location-based push notification to nearby users.
            </p>
          </div>

          {/* Right: Phone Preview */}
          <div className={styles.previewSection}>
            <h2 className={styles.previewTitle}>Preview</h2>

            <div className={styles.phoneMockup}>
              <div className={styles.phoneScreen}>
                {/* Phone status bar */}
                <div className={styles.phoneStatusBar}>
                  <span className={styles.statusTime}>9:41</span>
                  <div className={styles.statusIcons}>
                    <span className={styles.statusDot} />
                    <span className={styles.statusDot} />
                    <span className={styles.statusDot} />
                  </div>
                </div>

                {/* Events header */}
                <div className={styles.phoneHeader}>
                  <span className={styles.phoneHeaderTitle}>Events</span>
                  <span className={styles.phoneFilterIcon}>&#9660;</span>
                </div>

                {/* Filter tabs */}
                <div className={styles.phoneTabs}>
                  <span className={`${styles.phoneTab} ${styles.phoneTabActive}`}>Create Event</span>
                  <span className={styles.phoneTab}>Hosted</span>
                  <span className={styles.phoneTab}>Tickets</span>
                </div>

                {/* Your Events section */}
                <div className={styles.phoneEventsSection}>
                  <div className={styles.phoneEventsHeader}>
                    <span className={styles.phoneEventsLabel}>Your Events</span>
                    <span className={styles.phoneSeeAll}>See All</span>
                  </div>

                  {/* Generic event card */}
                  <div className={styles.phoneEventCard}>
                    <div className={styles.phoneEventThumb} />
                    <div className={styles.phoneEventInfo}>
                      <span className={styles.phoneEventDate}>Event date</span>
                      <span className={styles.phoneEventName}>Upcoming Event</span>
                    </div>
                  </div>
                </div>

                {/* Promoted event - highlighted */}
                <div className={styles.phonePromoted}>
                  <div className={styles.phonePromotedLabel}>Sponsored</div>
                  <div className={styles.phonePromotedCard}>
                    <div className={styles.phonePromotedThumb}>
                      {bannerImage ? (
                        <img src={bannerImage} alt={eventName} className={styles.phoneThumbImg} />
                      ) : (
                        <Calendar size={16} />
                      )}
                    </div>
                    <div className={styles.phonePromotedInfo}>
                      <span className={styles.phonePromotedDate}>{eventDate ? formatEventDate(eventDate) : 'Event date'}</span>
                      <span className={styles.phonePromotedName}>{eventName}</span>
                      {eventAddress && (
                        <span className={styles.phonePromotedAddress}>
                          <MapPin size={10} /> {eventAddress}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.phoneActions}>
                    <span className={styles.phoneActionBtn}>Going</span>
                    <span className={styles.phoneActionBtn}>Interested</span>
                    <span className={styles.phoneActionBtn}>Share</span>
                  </div>
                </div>

                {/* Phone bottom nav */}
                <div className={styles.phoneNav}>
                  {['App', 'Events', 'Accounts', 'Share', 'Profile'].map((label) => (
                    <span key={label} className={`${styles.navItem} ${label === 'Events' ? styles.navItemActive : ''}`}>{label}</span>
                  ))}
                </div>
              </div>
            </div>

            <p className={styles.disclaimer}>
              Actual appearance may vary slightly based on your device or operating system.
            </p>
          </div>
        </div>
      </div>
    </WizardLayout>
  );
}
