import { useState, useEffect } from 'react';
import { userApi } from '../api/user';

interface UseCurrentUserResult {
  user: { name: string; email?: string; company?: string; phone?: string; avatar?: string } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<UseCurrentUserResult['user']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profile = await userApi.getProfile();
      setUser({
        name: profile.name,
        email: profile.email,
        company: profile.companyName,
        phone: profile.phone,
        avatar: profile.avatarUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, isLoading, error, refetch: fetchUser };
}
