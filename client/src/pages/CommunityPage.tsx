import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import JournalModal from '../components/JournalModal';
import { type Post } from '../types';
import './CommunityPage.css';

type FeedTab = 'latest' | 'top' | 'reviews';
type ViewMode = 'feed' | 'grid';

interface Place {
  name: string;
  count: number;
}

const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerPhoto, setViewerPhoto] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const locationFilter = searchParams.get('location');
  const tab: FeedTab = (['latest', 'top', 'reviews'] as const).includes(searchParams.get('tab') as FeedTab)
    ? (searchParams.get('tab') as FeedTab)
    : 'latest';

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, comments(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(p => ({
        ...p,
        userId: p.user_id,
        authorName: p.author_name,
        authorAvatar: p.author_avatar,
        imageUrl: p.image_url,
        locationTag: p.location_tag,
        priceRating: p.price_rating,
        propertyId: p.property_id,
        joinPotw: p.join_potw,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        comments: (p.comments || [])
          .map((c: { id: string; user_id: string; author_name: string; author_avatar: string; text: string; created_at: string }) => ({
            id: c.id,
            userId: c.user_id,
            authorName: c.author_name,
            authorAvatar: c.author_avatar,
            text: c.text,
            createdAt: c.created_at,
          }))
          .sort((a: { createdAt: string }, b: { createdAt: string }) => a.createdAt.localeCompare(b.createdAt)),
      }));
      setPosts(formatted);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prev => prev.map(p => (p.id === updatedPost.id ? updatedPost : p)));
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleCreateClick = () => {
    if (!user) {
      alert(t('journal.loginToPost'));
      return;
    }
    setIsModalOpen(true);
  };

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  // Places = every location tag in the journal, busiest first
  const places: Place[] = useMemo(() => {
    const map = new Map<string, Place>();
    for (const p of posts) {
      if (!p.locationTag) continue;
      const place = map.get(p.locationTag) || { name: p.locationTag, count: 0 };
      place.count += 1;
      map.set(p.locationTag, place);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [posts]);

  const feed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = posts.filter(p => !locationFilter || p.locationTag === locationFilter);
    if (q) {
      list = list.filter(
        p =>
          (p.content || '').toLowerCase().includes(q) ||
          (p.authorName || '').toLowerCase().includes(q) ||
          (p.locationTag || '').toLowerCase().includes(q)
      );
    }
    if (tab === 'reviews') list = list.filter(p => p.rating || p.priceRating);
    if (tab === 'top') list = [...list].sort((a, b) => (b.likes || []).length - (a.likes || []).length);
    return list;
  }, [posts, locationFilter, tab, searchQuery]);

  // Featured photo stories: prioritize Picture of the Week entries, fallback to top liked photo posts
  const spotlightPosts = useMemo(() => {
    const withPhotos = posts.filter(p => p.imageUrl || (p.images && p.images.length > 0));
    const potw = withPhotos
      .filter(p => p.joinPotw)
      .sort((a, b) => (b.likes || []).length - (a.likes || []).length);
    const others = withPhotos
      .filter(p => !p.joinPotw)
      .sort((a, b) => (b.likes || []).length - (a.likes || []).length);
    return [...potw, ...others].slice(0, 4);
  }, [posts]);

  const myPostsCount = useMemo(
    () => (user ? posts.filter(p => p.userId === user.id).length : 0),
    [posts, user]
  );

  const myLikesCount = useMemo(
    () =>
      user
        ? posts
            .filter(p => p.userId === user.id)
            .reduce((sum, p) => sum + (p.likes ? p.likes.length : 0), 0)
        : 0,
    [posts, user]
  );

  const openPostById = (id: string) => {
    setViewerPhoto(0);
    const idx = feed.findIndex(p => p.id === id);
    if (idx >= 0) {
      setViewerIndex(idx);
      return;
    }
    setSearchParams({});
    setSearchQuery('');
    const fullIdx = posts.findIndex(p => p.id === id);
    if (fullIdx >= 0) setViewerIndex(fullIdx);
  };

  const userAvatar = user
    ? user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=2C4C3B&color=fff`
    : null;

  const tabs: { id: FeedTab; label: string }[] = [
    { id: 'latest', label: t('journal.tabs.latest') },
    { id: 'top', label: t('journal.tabs.top') },
    { id: 'reviews', label: t('journal.tabs.reviews') },
  ];

  return (
    <div className="journal-page">
      <div className="journal-shell">
        {/* ── Editorial Masthead & Story Composer Bar ── */}
        <header className="journal-masthead">
          <div className="journal-masthead-copy">
            <h1 className="journal-title">
              Travel <em>Journal</em>
            </h1>
            <p className="journal-subtitle">
              Field notes, mountain mornings, and honest stay impressions shared by our community across Northern Thailand.
            </p>
          </div>

          {/* Integrated Borderless Composer */}
          <section className="journal-composer" aria-label={t('journal.composerLabel')}>
            <div className="journal-composer-top">
              {userAvatar ? (
                <img src={userAvatar} alt="" className="journal-composer-avatar" />
              ) : (
                <span className="journal-composer-avatar journal-composer-avatar--guest" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z" />
                  </svg>
                </span>
              )}
              <button className="journal-composer-prompt" onClick={handleCreateClick}>
                {user
                  ? t('journal.composerPrompt', { name: (user.name || '').split(' ')[0] })
                  : t('journal.composerPromptGuest')}
              </button>
              <button className="journal-composer-cta" onClick={handleCreateClick}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>{t('journal.sharePost')}</span>
              </button>
            </div>
            <div className="journal-composer-actions">
              <button onClick={handleCreateClick}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2F7D4F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <circle cx="9" cy="10" r="2" />
                  <path d="M21 16l-5-5-8 9" />
                </svg>
                {t('journal.photo')}
              </button>
              <button onClick={handleCreateClick}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#D99B26" aria-hidden="true">
                  <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
                </svg>
                {t('journal.review')}
              </button>
              <button onClick={handleCreateClick}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#C2704E" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
                {t('journal.place')}
              </button>
            </div>
          </section>
        </header>

        {/* ── Featured Visual Moments Strip ── */}
        {!loading && spotlightPosts.length > 0 && (
          <section className="journal-spotlight" aria-label="Featured Visual Moments">
            <div className="journal-spotlight-head">
              <div>
                <h2 className="journal-spotlight-title">
                  Visual <em>Moments</em>
                </h2>
                <p className="journal-spotlight-sub">
                  Selected frames and stories captured by travelers this week
                </p>
              </div>
              <span className="journal-spotlight-count">
                {posts.length} {posts.length === 1 ? 'story shared' : 'stories shared'}
              </span>
            </div>

            <div className="journal-spotlight-grid">
              {spotlightPosts.map((p, index) => {
                const cover = (p.images && p.images[0]) || p.imageUrl;
                const isCurrentUser = user && p.userId === user.id;
                const authorImg = isCurrentUser
                  ? userAvatar
                  : p.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.authorName || 'T')}&background=2C4C3B&color=fff`;

                return (
                  <article
                    key={p.id}
                    className={`spotlight-card ${index === 0 ? 'spotlight-card--hero' : ''}`}
                    onClick={() => openPostById(p.id)}
                  >
                    {cover && <img src={cover} alt={p.content || p.authorName} className="spotlight-img" loading="lazy" />}
                    <div className="spotlight-overlay" />

                    <div className="spotlight-top">
                      {p.locationTag ? (
                        <span className="spotlight-tag">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                            <circle cx="12" cy="9.5" r="2.5" />
                          </svg>
                          {p.locationTag}
                        </span>
                      ) : (
                        <span className="spotlight-tag">Featured Frame</span>
                      )}

                      <span className="spotlight-likes">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        {(p.likes || []).length}
                      </span>
                    </div>

                    <div className="spotlight-bottom">
                      {p.content && <p className="spotlight-caption">{p.content}</p>}
                      <div className="spotlight-author">
                        {authorImg && <img src={authorImg} alt={p.authorName} />}
                        <span>{isCurrentUser && user?.name ? user.name : p.authorName}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Unified Borderless Toolbar (Tabs + Places + Search + View Switcher) ── */}
        <div className="journal-toolbar">
          <div className="journal-toolbar-left">
            <div className="journal-tabs" role="tablist" aria-label={t('journal.tabsLabel')}>
              {tabs.map(tb => (
                <button
                  key={tb.id}
                  role="tab"
                  aria-selected={tab === tb.id}
                  className={`journal-tab ${tab === tb.id ? 'active' : ''}`}
                  onClick={() => setParam('tab', tb.id === 'latest' ? null : tb.id)}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            {places.length > 0 && (
              <nav className="journal-chips" aria-label={t('journal.placesLabel')}>
                <button
                  className={`journal-chip ${!locationFilter ? 'active' : ''}`}
                  onClick={() => setParam('location', null)}
                  aria-pressed={!locationFilter}
                >
                  {t('journal.allPlaces')}
                </button>
                {places.slice(0, 6).map(place => (
                  <button
                    key={place.name}
                    className={`journal-chip ${locationFilter === place.name ? 'active' : ''}`}
                    onClick={() => setParam('location', locationFilter === place.name ? null : place.name)}
                    aria-pressed={locationFilter === place.name}
                  >
                    {place.name}
                  </button>
                ))}
              </nav>
            )}
          </div>

          <div className="journal-toolbar-right">
            <div className="journal-search">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search stories, authors, or places..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="journal-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="journal-view-toggle" role="group" aria-label="View layout">
              <button
                type="button"
                className={`journal-view-btn ${viewMode === 'feed' ? 'active' : ''}`}
                onClick={() => setViewMode('feed')}
                title="Editorial Feed"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="6" rx="1.5" />
                  <rect x="3" y="14" width="18" height="6" rx="1.5" />
                </svg>
                <span>Stories</span>
              </button>
              <button
                type="button"
                className={`journal-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Visual Gallery Grid"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
                <span>Gallery</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Content Grid + Sticky Editorial Rail ── */}
        <div className="journal-layout">
          <main className="journal-main">
            {locationFilter && (
              <div className="journal-filter">
                <span>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                    <circle cx="12" cy="9.5" r="2.5" />
                  </svg>
                  {t('journal.showingPlace', { place: locationFilter })}
                </span>
                <button onClick={() => setParam('location', null)}>{t('journal.clear')}</button>
              </div>
            )}

            {loading ? (
              <div className="journal-skeleton" aria-label={t('journal.loading')} role="status">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="journal-skeleton-card">
                    <div className="sk-head">
                      <span className="sk-avatar" />
                      <span className="sk-line" />
                    </div>
                    <div className="sk-media" />
                  </div>
                ))}
              </div>
            ) : feed.length > 0 ? (
              viewMode === 'feed' ? (
                <div className="journal-feed">
                  {feed.map((post, idx) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onUpdate={handlePostUpdate}
                      onDelete={handlePostDelete}
                      onTagClick={tag => setParam('location', tag)}
                      onOpen={photo => {
                        setViewerPhoto(photo ?? 0);
                        setViewerIndex(idx);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="journal-gallery-grid">
                  {feed.map((post, idx) => {
                    const cover = (post.images && post.images[0]) || post.imageUrl;
                    const isCurrentUser = user && post.userId === user.id;
                    const authorImg = isCurrentUser
                      ? userAvatar
                      : post.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || 'T')}&background=2C4C3B&color=fff`;

                    return (
                      <article
                        key={post.id}
                        className="journal-gallery-card"
                        onClick={() => {
                          setViewerPhoto(0);
                          setViewerIndex(idx);
                        }}
                      >
                        <div className="journal-gallery-media">
                          {cover ? (
                            <img src={cover} alt={post.content || post.authorName} loading="lazy" />
                          ) : (
                            <div className="journal-gallery-text-only">
                              <p>{post.content}</p>
                            </div>
                          )}
                          {post.locationTag && (
                            <span className="journal-gallery-place">{post.locationTag}</span>
                          )}
                        </div>
                        <div className="journal-gallery-body">
                          <div className="journal-gallery-author">
                            {authorImg && <img src={authorImg} alt="" />}
                            <span>{isCurrentUser && user?.name ? user.name : post.authorName}</span>
                          </div>
                          {post.content && <p className="journal-gallery-excerpt">{post.content}</p>}
                          <div className="journal-gallery-stats">
                            <span>{(post.likes || []).length} likes</span>
                            <span>{(post.comments || []).length} comments</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="journal-empty">
                <h2>
                  {locationFilter || tab !== 'latest' || searchQuery
                    ? t('journal.emptyFilteredTitle')
                    : t('journal.emptyTitle')}
                </h2>
                <p>
                  {locationFilter || tab !== 'latest' || searchQuery
                    ? t('journal.emptyFilteredBody')
                    : t('journal.emptyBody')}
                </p>
                <button className="journal-primary-btn" onClick={handleCreateClick}>
                  {t('journal.sharePost')}
                </button>
              </div>
            )}
          </main>

          {/* ── Right Sticky Editorial Rail ── */}
          <aside className="journal-rail">
            {user && userAvatar && (
              <div className="rail-passport">
                <div className="rail-passport-top">
                  <img src={userAvatar} alt={user.name} />
                  <div className="rail-passport-id">
                    <strong>{user.name}</strong>
                    <span>Community Contributor</span>
                  </div>
                </div>

                <div className="rail-passport-stats">
                  <div>
                    <strong>{myPostsCount}</strong>
                    <span>Journals</span>
                  </div>
                  <div>
                    <strong>{myLikesCount}</strong>
                    <span>Appreciations</span>
                  </div>
                </div>

                <div className="rail-passport-actions">
                  <button className="journal-primary-btn rail-cta" onClick={handleCreateClick}>
                    {t('journal.sharePost')}
                  </button>
                  <Link to="/profile" className="rail-profile-link">
                    View Profile
                  </Link>
                </div>
              </div>
            )}

            {spotlightPosts.length > 0 && (
              <section className="rail-block">
                <h2>{t('journal.potw')}</h2>
                <ol className="rail-potw">
                  {spotlightPosts.slice(0, 3).map((p, i) => {
                    const thumb = (p.images && p.images[0]) || p.imageUrl;
                    const isCurrentUser = user && p.userId === user.id;
                    return (
                      <li key={p.id}>
                        <button onClick={() => openPostById(p.id)}>
                          <span className="rail-potw-rank" aria-hidden="true">
                            {i + 1}
                          </span>
                          {thumb && <img src={thumb} alt="" loading="lazy" />}
                          <span className="rail-potw-text">
                            <span className="rail-potw-name">
                              {isCurrentUser && user?.name ? user.name : p.authorName}
                            </span>
                            <span className="rail-potw-meta">
                              {p.locationTag && <>{p.locationTag} · </>}
                              {t('post.likes', { count: (p.likes || []).length })}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {places.length > 0 && (
              <section className="rail-block">
                <h2>{t('journal.topPlaces')}</h2>
                <ul className="rail-places">
                  {places.slice(0, 6).map(place => (
                    <li key={place.name}>
                      <button
                        className={locationFilter === place.name ? 'active' : ''}
                        onClick={() =>
                          setParam('location', locationFilter === place.name ? null : place.name)
                        }
                      >
                        <span>{place.name}</span>
                        <span className="rail-places-count">
                          {t('journal.postsCount', { count: place.count })}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="rail-stays-card">
              <h3>Looking for a quiet retreat?</h3>
              <p>
                Browse verified homestays and mountain sanctuaries across Chiang Mai and Chiang Dao.
              </p>
              <Link to="/hotels" className="rail-stays-link">
                <span>Explore Verified Stays</span>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {isModalOpen && (
        <CreatePostModal
          onClose={() => setIsModalOpen(false)}
          onPostCreated={() => {
            setIsModalOpen(false);
            fetchPosts();
          }}
        />
      )}

      {viewerIndex !== null && feed[viewerIndex] && (
        <JournalModal
          posts={feed}
          index={viewerIndex}
          photoIndex={viewerPhoto}
          onClose={() => setViewerIndex(null)}
          onNavigate={i => {
            setViewerPhoto(0);
            setViewerIndex(i);
          }}
          onUpdate={handlePostUpdate}
        />
      )}
    </div>
  );
};

export default CommunityPage;
