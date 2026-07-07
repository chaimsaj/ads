import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardLayout } from '../../components/layout';
import { CityAutocomplete } from '../../components/ui';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './AudienceTargeting.module.css';

function getWizardData(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('campaignWizard') || '{}'); } catch { return {}; }
}

function saveWizardData(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem('campaignWizard') || '{}');
  localStorage.setItem('campaignWizard', JSON.stringify({ ...existing, ...data }));
}

const GOALS = [
  'All', 'Invest in projects', 'Mentor others', 'Find internship',
  'Network', 'Find freelance', 'Part-time job',
  'Full-time job', 'Hire employees', 'Find investors',
  'Find mentors', 'Find/Explore grad school', 'Hire freelancers',
  'Find interns', 'Enroll Grad Students',
] as const;

const EDUCATION_LEVELS = [
  'All', 'High school', 'Trade/tech school', 'In college',
  'Undergraduate degree', 'In grad school', 'Graduate degree',
] as const;

const EXPERIENCE_YEARS = [
  'All', '0 - 2 years', '3 - 5 years', '6 - 10 years',
  '10+ years', '20+ years',
] as const;

const INDUSTRIES = [
  'Marketing & Advertising', 'Technology', 'Finance', 'Healthcare',
  'Education', 'Real Estate', 'Consulting', 'Engineering',
  'Legal', 'Media & Entertainment', 'Non-profit', 'Other',
] as const;

function toggleChip(list: string[], value: string, allLabel = 'All'): string[] {
  if (value === allLabel) return [allLabel];
  const without = list.filter((v) => v !== allLabel && v !== value);
  if (list.includes(value)) return without.length === 0 ? [allLabel] : without;
  return [...without, value];
}

export function AudienceTargeting() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const existing = getWizardData();

  const [city, setCity] = useState((existing.audienceCity as string) || '');
  const [industry, setIndustry] = useState((existing.audienceIndustry as string) || '');
  const [goals, setGoals] = useState<string[]>(
    (existing.audienceGoals as string[]) || ['All'],
  );
  const [educationLevels, setEducationLevels] = useState<string[]>(
    (existing.audienceEducation as string[]) || ['All'],
  );
  const [experienceYears, setExperienceYears] = useState<string[]>(
    (existing.audienceExperience as string[]) || ['All'],
  );

  const adType = existing.adType as string;

  const handleNext = () => {
    saveWizardData({
      audienceCity: city,
      audienceIndustry: industry,
      audienceGoals: goals,
      audienceEducation: educationLevels,
      audienceExperience: experienceYears,
    });
    if (adType === 'event') {
      navigate('/campaign/new/event-preview');
    } else if (adType === 'brand') {
      navigate('/campaign/new/ad-format');
    } else {
      navigate('/campaign/new/boost-type');
    }
  };

  const handleBack = () => {
    navigate(adType === 'brand' ? '/campaign/new/brand-details' : '/campaign/new');
  };

  return (
    <WizardLayout
      currentStep={1}
      totalSteps={3}
      onBack={handleBack}
      onNext={handleNext}
      user={user || { name: '' }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Define your target audience</h1>
          <p className={styles.subtitle}>
            Help us show your ad to the right people based on their profile, interest, and location.
          </p>
        </div>

        <p className={styles.prefillNote}>
          We've pre-filled audience details based on your profile. Adjust any filters to better match who you want to reach.
        </p>

        <div className={styles.grid}>
          {/* Left column: Location & Focus */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Location & Focus</h2>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>City</label>
              <CityAutocomplete
                value={city}
                onChange={(val) => setCity(val)}
                placeholder="Start typing a city..."
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Industry & Category</label>
              <select
                className={styles.select}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option value="">Select industry...</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Right column: Goals & Interests */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Goals & Interests</h2>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Goals</label>
              <div className={styles.chipGrid}>
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    className={`${styles.chip} ${goals.includes(goal) ? styles.chipActive : ''}`}
                    onClick={() => setGoals(toggleChip(goals, goal))}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom: Education & Experience */}
          <section className={`${styles.card} ${styles.fullWidth}`}>
            <h2 className={styles.cardTitle}>Education & Experience</h2>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Education levels</label>
              <div className={styles.chipGrid}>
                {EDUCATION_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`${styles.chip} ${educationLevels.includes(level) ? styles.chipActive : ''}`}
                    onClick={() => setEducationLevels(toggleChip(educationLevels, level))}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Years of experience</label>
              <div className={styles.chipGrid}>
                {EXPERIENCE_YEARS.map((years) => (
                  <button
                    key={years}
                    type="button"
                    className={`${styles.chip} ${experienceYears.includes(years) ? styles.chipActive : ''}`}
                    onClick={() => setExperienceYears(toggleChip(experienceYears, years))}
                  >
                    {years}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </WizardLayout>
  );
}
