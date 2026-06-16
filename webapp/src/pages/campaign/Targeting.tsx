import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { WizardLayout } from '../../components/layout';
import { Input, LocationMap } from '../../components/ui';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './Targeting.module.css';

function saveWizardData(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem('campaignWizard') || '{}');
  localStorage.setItem('campaignWizard', JSON.stringify({ ...existing, ...data }));
}

function getWizardData(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('campaignWizard') || '{}'); } catch { return {}; }
}

export function Targeting() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const existing = getWizardData();
  const [formData, setFormData] = useState({
    address: (existing.address as string) || '',
    radius: (existing.radius as string) || '5',
    startDate: (existing.startDate as string) || '',
    endDate: (existing.endDate as string) || '',
    latitude: (existing.latitude as number) ?? null,
    longitude: (existing.longitude as number) ?? null,
  });

  const handleNext = () => {
    saveWizardData({
      address: formData.address,
      radius: formData.radius,
      startDate: formData.startDate,
      endDate: formData.endDate,
      latitude: formData.latitude,
      longitude: formData.longitude,
    });
    navigate('/campaign/new/payment');
  };

  const adType = existing.adType as string;

  const handleBack = () => {
    if (adType === 'user') {
      navigate('/campaign/new/user-ad-preview');
    } else if (adType === 'event') {
      navigate('/campaign/new/event-preview');
    } else {
      navigate('/campaign/new/create-ad');
    }
  };

  const handleLocationResolved = useCallback((coords: { lat: number; lng: number }) => {
    setFormData((prev) => ({ ...prev, latitude: coords.lat, longitude: coords.lng }));
  }, []);

  return (
    <WizardLayout
      currentStep={2}
      totalSteps={3}
      onBack={handleBack}
      onNext={handleNext}
      nextDisabled={!formData.address || !formData.startDate || !formData.endDate}
      user={user || { name: '' }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Targeting & Schedule</h1>
          <p className={styles.subtitle}>
            Define where and when your ad will be shown.
          </p>
        </div>

        <div className={styles.sections}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Location Targeting</h2>
            <p className={styles.sectionDesc}>
              Your ad will be shown to users within the specified radius of this location.
            </p>

            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className={styles.label}>Address</label>
                <Input
                  placeholder="Enter address or location"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  leftIcon={<MapPin size={18} />}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Radius</label>
                <div className={styles.radiusSelector}>
                  {['1', '5', '10', '25', '50'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`${styles.radiusBtn} ${formData.radius === r ? styles.active : ''}`}
                      onClick={() => setFormData({ ...formData, radius: r })}
                    >
                      {r} miles
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.mapContainer}>
              <LocationMap
                address={formData.address}
                radiusMiles={parseInt(formData.radius, 10)}
                onLocationResolved={handleLocationResolved}
              />
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Campaign Schedule</h2>
            <p className={styles.sectionDesc}>
              Set the start and end dates for your campaign.
            </p>

            <div className={styles.dateFields}>
              <div className={styles.field}>
                <label className={styles.label}>Start Date</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>End Date</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </WizardLayout>
  );
}
