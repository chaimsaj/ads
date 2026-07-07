import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { Calendar, X } from 'lucide-react';
import { usersApi, type UserSearchResult } from '../../api/users';
import { eventsApi, type EventSearchResult } from '../../api/events';
import styles from './TargetPickerModal.module.css';

type TargetPickerMode = 'user' | 'event';

interface TargetPickerModalProps {
  mode: TargetPickerMode;
  open: boolean;
  onClose: () => void;
  onSelectUser?: (result: UserSearchResult) => void;
  onSelectEvent?: (result: EventSearchResult) => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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
    return `${date} · ${h}:${m} ${ampm}`;
  } catch {
    return iso;
  }
}

export function TargetPickerModal({ mode, open, onClose, onSelectUser, onSelectEvent }: TargetPickerModalProps) {
  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [eventResults, setEventResults] = useState<EventSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setUserResults([]);
      setEventResults([]);
      setSearchError(false);
      return;
    }
    setIsSearching(true);
    setSearchError(false);
    try {
      if (mode === 'user') {
        setUserResults(await usersApi.search(q));
      } else {
        setEventResults(await eventsApi.search(q));
      }
    } catch {
      setSearchError(true);
      setUserResults([]);
      setEventResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [mode]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setUserResults([]);
    setEventResults([]);
    setSearchError(false);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(focusTimer);
  }, [open, mode]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const title = mode === 'user' ? 'Who do you want to spotlight?' : 'Which event would you like to promote?';
  const placeholder = mode === 'user' ? 'Search by name...' : 'Search events...';
  const noResultsLabel = mode === 'user' ? 'No users found' : 'No events found';

  return (
    <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className={styles.resultsArea}>
          {isSearching ? (
            <div className={styles.emptyState}>Searching...</div>
          ) : searchError ? (
            <div className={styles.emptyState}>
              Something went wrong.{' '}
              <button type="button" className={styles.retryBtn} onClick={() => runSearch(query)}>
                Try again
              </button>
            </div>
          ) : query.length < 2 ? (
            <div className={styles.emptyState}>Type at least 2 characters to search.</div>
          ) : mode === 'user' && userResults.length === 0 ? (
            <div className={styles.emptyState}>{noResultsLabel}</div>
          ) : mode === 'event' && eventResults.length === 0 ? (
            <div className={styles.emptyState}>{noResultsLabel}</div>
          ) : mode === 'user' ? (
            userResults.map((u) => (
              <button key={u.id} type="button" className={styles.resultRow} onClick={() => onSelectUser?.(u)}>
                <div className={styles.userAvatar}>
                  {u.avatar ? <img src={u.avatar} alt={u.name} className={styles.avatarImg} /> : <span>{initials(u.name)}</span>}
                </div>
                <div className={styles.resultInfo}>
                  <span className={styles.resultName}>{u.name}</span>
                  {u.company && <span className={styles.resultMeta}>{u.company}</span>}
                </div>
              </button>
            ))
          ) : (
            eventResults.map((evt) => (
              <button key={evt.id} type="button" className={styles.resultRow} onClick={() => onSelectEvent?.(evt)}>
                <div className={styles.eventThumb}>
                  {evt.bannerImage ? <img src={evt.bannerImage} alt={evt.name} className={styles.thumbImg} /> : <Calendar size={20} />}
                </div>
                <div className={styles.resultInfo}>
                  <span className={styles.resultName}>{evt.name}</span>
                  <span className={styles.resultMeta}>
                    {evt.address ? `${evt.address} · ` : ''}{formatEventDate(evt.date)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
