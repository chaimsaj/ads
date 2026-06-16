import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { WizardLayout } from '../../components/layout';
import { Input } from '../../components/ui';
import { usersApi, type UserSearchResult } from '../../api/users';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './SearchUser.module.css';

function getWizardData(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem('campaignWizard') || '{}'); } catch { return {}; }
}

function saveWizardData(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem('campaignWizard') || '{}');
  localStorage.setItem('campaignWizard', JSON.stringify({ ...existing, ...data }));
}

export function SearchUser() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const existing = getWizardData();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(() => {
    if (existing.spotlightUserId && existing.spotlightUsername) {
      return {
        id: existing.spotlightUserId as string,
        name: existing.spotlightUsername as string,
        company: (existing.spotlightUserCompany as string) || null,
        avatar: (existing.spotlightUserAvatar as string) || null,
      };
    }
    return null;
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // HARDCODED test data — remove when real API is ready
  const HARDCODED_USERS: UserSearchResult[] = [
    { id: '000000000000000000000999', name: 'Sara', company: 'Myngly Inc', avatar: null },
    { id: '000000000000000000000998', name: 'Chaim', company: 'Myngly Ads', avatar: null },
    { id: '000000000000000000000997', name: 'Mani', company: 'Myngly Dev', avatar: null },
  ];

  const searchUsers = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);

    // MOCK: Filter hardcoded users by query
    const hardcoded = HARDCODED_USERS.filter(u =>
      u.name.toLowerCase().includes(q.toLowerCase())
    );

    // Try to fetch real users from API, but don't fail if unavailable
    let apiResults: UserSearchResult[] = [];
    try {
      apiResults = await usersApi.search(q);
    } catch {
      // API unavailable — use hardcoded only
    }

    const merged = [
      ...hardcoded,
      ...apiResults.filter(d => !HARDCODED_USERS.some(h => h.id === d.id)),
    ];
    setResults(merged);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchUsers]);

  const handleSelectUser = (u: UserSearchResult) => {
    setSelectedUser(u);
    setQuery('');
    setResults([]);
  };

  const handleNext = () => {
    if (!selectedUser) return;
    saveWizardData({
      spotlightUserId: selectedUser.id,
      spotlightUsername: selectedUser.name,
      spotlightUserCompany: selectedUser.company || '',
      spotlightUserAvatar: selectedUser.avatar || '',
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
      nextDisabled={!selectedUser}
      user={user || { name: '' }}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Who do you want to spotlight?</h1>
          <p className={styles.subtitle}>
            Choose a Myngly user to promote.
          </p>
        </div>

        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>@Username</label>
            <Input
              placeholder="@"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedUser) setSelectedUser(null);
              }}
            />
          </div>

          {/* Search results dropdown */}
          {query.length >= 2 && !selectedUser && (
            <div className={styles.dropdown}>
              {isSearching ? (
                <div className={styles.dropdownEmpty}>Searching...</div>
              ) : results.length === 0 ? (
                <div className={styles.dropdownEmpty}>No users found</div>
              ) : (
                results.map((u) => (
                  <button
                    key={u.id}
                    className={styles.dropdownItem}
                    onClick={() => handleSelectUser(u)}
                    type="button"
                  >
                    <div className={styles.userAvatar}>
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className={styles.avatarImg} />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{u.name}</span>
                      {u.company && (
                        <span className={styles.userCompany}>{u.company}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected user card */}
          {selectedUser && (
            <div className={styles.selectedCard}>
              <div className={styles.userAvatar}>
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt={selectedUser.name} className={styles.avatarImg} />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{selectedUser.name}</span>
                {selectedUser.company && (
                  <span className={styles.userCompany}>{selectedUser.company}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </WizardLayout>
  );
}
