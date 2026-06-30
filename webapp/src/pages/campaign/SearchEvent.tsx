import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { WizardLayout } from '../../components/layout';
import { Input } from '../../components/ui';
import { eventsApi, type EventSearchResult } from '../../api/events';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './SearchEvent.module.css';

function getWizardData(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('campaignWizard') || '{}'); } catch { return {}; }
}

function saveWizardData(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem('campaignWizard') || '{}');
  localStorage.setItem('campaignWizard', JSON.stringify({ ...existing, ...data }));
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

export function SearchEvent() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const existing = getWizardData();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EventSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventSearchResult | null>(() => {
    if (existing.eventId && existing.eventName) {
      return {
        id: existing.eventId as string,
        code: existing.eventCode as number,
        name: existing.eventName as string,
        address: (existing.eventAddress as string) || null,
        date: (existing.eventDate as string) || '',
        bannerImage: (existing.eventBannerImage as string) || null,
      };
    }
    return null;
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchEvents = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await eventsApi.search(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchEvents(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchEvents]);

  const handleSelectEvent = (e: EventSearchResult) => {
    setSelectedEvent(e);
    setQuery('');
    setResults([]);
  };

  const handleNext = () => {
    if (!selectedEvent) return;
    saveWizardData({
      eventId: selectedEvent.id,
      eventCode: selectedEvent.code,
      eventName: selectedEvent.name,
      eventAddress: selectedEvent.address || '',
      eventDate: selectedEvent.date,
      eventBannerImage: selectedEvent.bannerImage || '',
    });
    navigate('/campaign/new/audience-targeting');
  };

  const handleBack = () => {
    navigate('/campaign/new');
  };

  return (
    <WizardLayout
      currentStep={1}
      totalSteps={3}
      onBack={handleBack}
      onNext={handleNext}
      nextDisabled={!selectedEvent}
      user={user || { name: '' }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Which event would you like to promote?</h1>
          <p className={styles.subtitle}>
            Enter the name or code of the event you want to promote.
          </p>
        </div>

        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Event name or ID</label>
            <Input
              placeholder="Search events..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedEvent) setSelectedEvent(null);
              }}
            />
          </div>

          {/* Search results dropdown */}
          {query.length >= 2 && !selectedEvent && (
            <div className={styles.dropdown}>
              {isSearching ? (
                <div className={styles.dropdownEmpty}>Searching...</div>
              ) : results.length === 0 ? (
                <div className={styles.dropdownEmpty}>No events found</div>
              ) : (
                results.map((evt) => (
                  <button
                    key={evt.id}
                    className={styles.dropdownItem}
                    onClick={() => handleSelectEvent(evt)}
                    type="button"
                  >
                    <div className={styles.eventIcon}>
                      <Calendar size={20} />
                    </div>
                    <div className={styles.eventInfo}>
                      <span className={styles.eventCode}>code: <strong>{evt.code}</strong></span>
                      <span className={styles.eventName}>{evt.name}</span>
                      <span className={styles.eventMeta}>
                        {evt.address ? `${evt.address} \u00b7 ` : ''}{formatEventDate(evt.date)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected event card */}
          {selectedEvent && (
            <div className={styles.selectedCard}>
              <div className={styles.eventIcon}>
                <Calendar size={20} />
              </div>
              <div className={styles.eventInfo}>
                <span className={styles.eventCode}>code: <strong>{selectedEvent.code}</strong></span>
                <span className={styles.eventName}>{selectedEvent.name}</span>
                <span className={styles.eventMeta}>
                  {selectedEvent.address ? `${selectedEvent.address} \u00b7 ` : ''}{formatEventDate(selectedEvent.date)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </WizardLayout>
  );
}
