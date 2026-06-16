import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Upload, X } from 'lucide-react';
import { WizardLayout } from '../../components/layout';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './UserAdPreview.module.css';

function getWizardData(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('campaignWizard') || '{}'); } catch { return {}; }
}

function saveWizardData(data: Record<string, unknown>) {
  const existing = getWizardData();
  localStorage.setItem('campaignWizard', JSON.stringify({ ...existing, ...data }));
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function UserAdPreview() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const wizardData = getWizardData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const spotlightName = (wizardData.spotlightUsername as string) || user?.name || 'You';
  const spotlightCompany = (wizardData.spotlightUserCompany as string) || '';
  const defaultAvatar = (wizardData.spotlightUserAvatar as string) || '';
  const boostType = (wizardData.boostType as string) || 'standard';

  const [campaignImage, setCampaignImage] = useState<string>(
    (wizardData.campaignImage as string) || ''
  );
  const [uploadError, setUploadError] = useState('');

  // The displayed avatar: custom upload takes priority, then existing avatar
  const displayAvatar = campaignImage || defaultAvatar;

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
      setCampaignImage(dataUrl);
      saveWizardData({ campaignImage: dataUrl });
    } catch {
      setUploadError('Failed to read image. Please try again.');
    }

    // Reset input so re-selecting the same file triggers onChange
    e.target.value = '';
  }, []);

  const handleRemoveImage = useCallback(() => {
    setCampaignImage('');
    saveWizardData({ campaignImage: '' });
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleNext = () => {
    navigate('/campaign/new/targeting');
  };

  const handleBack = () => {
    navigate('/campaign/new/boost-type');
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
          <h1 className={styles.title}>Ad Preview</h1>
          <p className={styles.subtitle}>
            We'll use your profile details to help you stand out.
          </p>
        </div>

        <div className={styles.content}>
          {/* Left: Campaign Image */}
          <div className={styles.imageSection}>
            <h2 className={styles.sectionTitle}>Campaign Image</h2>
            <p className={styles.sectionSubtitle}>
              Upload a custom image or use your existing profile photo.
            </p>

            <div className={styles.profileCard}>
              <h3 className={styles.profileCardTitle}>Profile Image</h3>

              <div className={styles.profileAvatar}>
                {displayAvatar ? (
                  <img src={displayAvatar} alt={spotlightName} className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <User size={48} />
                  </div>
                )}
              </div>

              {campaignImage && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={handleRemoveImage}
                >
                  <X size={14} />
                  Remove custom image
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileSelect}
                className={styles.fileInput}
              />

              <button
                type="button"
                className={styles.uploadBtn}
                onClick={handleUploadClick}
              >
                <Upload size={18} />
                {campaignImage ? 'Replace image' : 'Upload new image'}
              </button>

              {uploadError && (
                <p className={styles.uploadError}>{uploadError}</p>
              )}

              <p className={styles.profileCardDesc}>
                JPG, PNG, or WebP. Max 5 MB. Square images work best.
              </p>
            </div>
          </div>

          {/* Right: Phone Preview */}
          <div className={styles.previewSection}>
            <h2 className={styles.previewTitle}>Preview</h2>

            <div className={styles.phoneMockup}>
              <div className={styles.phoneScreen}>
                <div className={styles.phoneHeader}>
                  <span className={styles.phoneLogo}>myngly</span>
                  <div className={styles.phoneIcons}>
                    <span className={styles.phoneIcon} />
                    <span className={styles.phoneIcon} />
                  </div>
                </div>

                {boostType === 'premium' && (
                  <div className={styles.featuredBar}>
                    <span className={styles.featuredLabel}>Featured Connections</span>
                  </div>
                )}

                <div className={styles.profilePreview}>
                  <div className={styles.previewAvatar}>
                    {displayAvatar ? (
                      <img src={displayAvatar} alt={spotlightName} className={styles.previewAvatarImg} />
                    ) : (
                      <User size={28} />
                    )}
                  </div>
                  <span className={styles.previewName}>{spotlightName}</span>
                  {spotlightCompany && (
                    <span className={styles.previewCompany}>{spotlightCompany}</span>
                  )}
                  <div className={styles.previewTags}>
                    <span className={styles.previewTag}>Network</span>
                    <span className={styles.previewTag}>Invest in projects</span>
                  </div>
                  <div className={styles.previewActions}>
                    <span className={styles.actionBtn}>&#10005;</span>
                    <span className={`${styles.actionBtn} ${styles.actionAccept}`}>&#10003;</span>
                  </div>
                </div>

                <div className={styles.phoneNav}>
                  {['App', 'Events', 'Network', 'Share', 'Profile'].map((label) => (
                    <span key={label} className={styles.navItem}>{label}</span>
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
