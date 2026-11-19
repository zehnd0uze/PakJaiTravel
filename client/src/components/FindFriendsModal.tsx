import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { useFollows } from '../hooks/useFollows';
import { type PublicTraveler } from '../types';
import './FindFriendsModal.css';

interface FindFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'discover' | 'followers' | 'following';
  targetUserId?: string;
  /** Optional fallback travelers extracted from loaded posts */
  fallbackTravelers?: PublicTraveler[];
}

const fallbackAvatar = (name?: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'T')}&background=2C4C3B&color=fff`;

export const FindFriendsModal: React.FC<FindFriendsModalProps> = ({
  isOpen,
  onClose,
  mode = 'discover',
  targetUserId,
  fallbackTravelers = [],
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFollowing, toggleFollow, busyId } = useFollows();

  const [query, setQuery] = useState('');
  const [travelers, setTravelers] = useState<PublicTraveler[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        if (mode === 'discover') {
          const { data, error } = await supabase.rpc('search_friends', {
            search_query: query.trim(),
            max_results: 30,
          });

          if (!cancelled && !error && Array.isArray(data)) {
            const mapped: PublicTraveler[] = data
              .filter((r: any) => r.id !== user?.id)
              .map((r: any) => ({
                id: r.id,
                name: r.name || 'Traveler',
                avatar: r.avatar,
                role: r.role,
                isVerified: Boolean(r.is_verified),
                postsCount: Number(r.posts_count || 0),
                followersCount: Number(r.followers_count || 0),
              }));
            setTravelers(mapped);
            setLoading(false);
            return;
          }

          // Graceful fallback if search_friends RPC isn't migrated yet: derive from posts + fallbackTravelers
          let derived = [...fallbackTravelers];
          if (derived.length === 0) {
            const { data: postRows } = await supabase
              .from('posts')
              .select('user_id, author_name, author_avatar')
              .order('created_at', { ascending: false })
              .limit(60);

            const byId = new Map<string, PublicTraveler>();
            (postRows || []).forEach((p: any) => {
              if (!p.user_id) return;
              const existing = byId.get(p.user_id);
              if (existing) {
                existing.postsCount = (existing.postsCount || 0) + 1;
              } else {
                byId.set(p.user_id, {
                  id: p.user_id,
                  name: p.author_name || 'Traveler',
                  avatar: p.author_avatar,
                  postsCount: 1,
                });
              }
            });
            derived = Array.from(byId.values());
          }

          const q = query.trim().toLowerCase();
          const filtered = derived.filter(
            (tr) => tr.id !== user?.id && (!q || tr.name.toLowerCase().includes(q))
          );
          if (!cancelled) setTravelers(filtered);
        } else if (targetUserId) {
          const { data, error } = await supabase.rpc('get_follow_list', {
            target_user_id: targetUserId,
            list_mode: mode,
          });

          if (!cancelled && !error && Array.isArray(data)) {
            setTravelers(
              data.map((r: any) => ({
                id: r.id,
                name: r.name || 'Traveler',
                avatar: r.avatar,
                role: r.role,
                isVerified: Boolean(r.is_verified),
              }))
            );
          } else if (!cancelled) {
            setTravelers([]);
          }
        }
      } catch {
        if (!cancelled) setTravelers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const timer = window.setTimeout(load, mode === 'discover' ? 180 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOpen, mode, targetUserId, query, user?.id, fallbackTravelers]);

  if (!isOpen) return null;

  const title =
    mode === 'followers'
      ? t('social.followersTitle')
      : mode === 'following'
        ? t('social.followingTitle')
        : t('social.findFriendsTitle');

  const openProfile = (id: string) => {
    onClose();
    navigate(id === user?.id ? '/profile' : `/profile/${id}`);
  };

  return (
    <div className="ffm-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="ffm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ffm-header">
          <div>
            <h2>{title}</h2>
            {mode === 'discover' && <p>{t('social.findFriendsSub')}</p>}
          </div>
          <button type="button" className="ffm-close" onClick={onClose} aria-label={t('chiangDaoMap.close')}>
            ×
          </button>
        </div>

        {mode === 'discover' && (
          <div className="ffm-search-wrap">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <circle cx="11" cy="11" r="7.5" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('social.searchPlaceholder')}
              autoFocus
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label={t('chiangDaoMap.close')}>
                ×
              </button>
            )}
          </div>
        )}

        <div className="ffm-body">
          {loading ? (
            <div className="ffm-empty">{t('hotelDetail.loading')}</div>
          ) : travelers.length === 0 ? (
            <div className="ffm-empty">
              {mode === 'discover' ? t('social.noUsersFound') : t('social.noFollowList')}
            </div>
          ) : (
            <ul className="ffm-list">
              {travelers.map((person) => {
                const following = isFollowing(person.id);
                const isSelf = user?.id === person.id;
                return (
                  <li key={person.id} className="ffm-row">
                    <button
                      type="button"
                      className="ffm-person"
                      onClick={() => openProfile(person.id)}
                    >
                      <img src={person.avatar || fallbackAvatar(person.name)} alt="" />
                      <div className="ffm-person-info">
                        <strong>
                          {person.name}
                          {person.role === 'host' && (
                            <span className="ffm-host-tag">{t('profileSettings.typeHost')}</span>
                          )}
                        </strong>
                        <span>
                          {person.postsCount !== undefined
                            ? t('social.journalsCount', { count: person.postsCount })
                            : t('social.contributor')}
                          {person.followersCount !== undefined && person.followersCount > 0
                            ? ` · ${t('social.followersCount', { count: person.followersCount })}`
                            : ''}
                        </span>
                      </div>
                    </button>

                    {!isSelf && (
                      <button
                        type="button"
                        className={`ffm-follow-btn${following ? ' is-following' : ''}`}
                        onClick={() => toggleFollow(person.id)}
                        disabled={busyId === person.id}
                      >
                        {following ? t('social.following') : t('social.follow')}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindFriendsModal;
