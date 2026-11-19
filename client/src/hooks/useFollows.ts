import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

const LOCAL_KEY_PREFIX = 'pakjai_following_';
const SYNC_EVENT = 'pakjai-follows-changed';

const readLocal = (userId: string): string[] => {
  try {
    const raw = window.localStorage.getItem(`${LOCAL_KEY_PREFIX}${userId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

const writeLocal = (userId: string, ids: string[]) => {
  try {
    window.localStorage.setItem(`${LOCAL_KEY_PREFIX}${userId}`, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { userId, ids } }));
  } catch {
    // ignore storage quota errors
  }
};

export const useFollows = () => {
  const { user, openAuthModal } = useAuth();
  const [followingIds, setFollowingIds] = useState<string[]>(() =>
    user?.id ? readLocal(user.id) : []
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  // Load current user's following list from Supabase (falls back to local cache if table not migrated yet)
  useEffect(() => {
    if (!user?.id) {
      setFollowingIds([]);
      return;
    }

    setFollowingIds(readLocal(user.id));
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (!cancelled && !error && data) {
          const ids = data.map((row: { following_id: string }) => row.following_id);
          setFollowingIds(ids);
          writeLocal(user.id, ids);
        }
      } catch {
        // Keep local cache if follows table isn't created yet
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Cross-component sync
  useEffect(() => {
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent<{ userId: string; ids: string[] }>).detail;
      if (detail && user?.id && detail.userId === user.id) {
        setFollowingIds(detail.ids);
      }
    };
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, [user?.id]);

  const isFollowing = useCallback(
    (targetUserId: string) => followingIds.includes(targetUserId),
    [followingIds]
  );

  const toggleFollow = useCallback(
    async (targetUserId: string) => {
      if (!user?.id) {
        openAuthModal('login');
        return false;
      }
      if (!targetUserId || targetUserId === user.id) return false;
      if (busyId === targetUserId) return false;

      const currentlyFollowing = followingIds.includes(targetUserId);
      const optimistic = currentlyFollowing
        ? followingIds.filter((id) => id !== targetUserId)
        : [targetUserId, ...followingIds];

      setBusyId(targetUserId);
      setFollowingIds(optimistic);
      writeLocal(user.id, optimistic);

      try {
        if (currentlyFollowing) {
          await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', targetUserId);
        } else {
          await supabase
            .from('follows')
            .insert({ follower_id: user.id, following_id: targetUserId });
        }
      } catch {
        // Keep optimistic local state if offline or SQL not run yet
      } finally {
        setBusyId(null);
      }
      return !currentlyFollowing;
    },
    [user?.id, followingIds, busyId, openAuthModal]
  );

  return {
    followingIds,
    followingCount: followingIds.length,
    isFollowing,
    toggleFollow,
    busyId,
  };
};
