import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFollows } from '../hooks/useFollows';
import { supabase } from '../utils/supabase';
import { useTranslation } from 'react-i18next';
import { type Post } from '../types';
import { getPostPhotos } from '../utils/postPhotos';
import './JournalModal.css';

interface JournalModalProps {
  posts: Post[];
  index: number;
  /** Photo to open at, for multi-photo posts */
  photoIndex?: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onUpdate: (post: Post) => void;
}

type RawComment = {
  id: string;
  userId?: string;
  user_id?: string;
  authorName?: string;
  author_name?: string;
  authorAvatar?: string;
  author_avatar?: string;
  text: string;
  parentId?: string | null;
  parent_id?: string | null;
  likes?: string[];
  createdAt?: string;
  created_at?: string;
};

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return 'Just now';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 'Just now';
  const diffInSeconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatFullDate = (dateString?: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const fallbackAvatar = (name?: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Traveler')}&background=2C4C3B&color=fff`;

const JournalModal: React.FC<JournalModalProps> = ({
  posts,
  index,
  photoIndex = 0,
  onClose,
  onNavigate,
  onUpdate,
}) => {
  const { user, openAuthModal } = useAuth();
  const { isFollowing, toggleFollow, busyId } = useFollows();
  const { t } = useTranslation();
  const post = posts[index];
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photo, setPhoto] = useState(photoIndex);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const photos = post ? getPostPhotos(post) : [];
  const hasLiked = Boolean(user && post && (post.likes || []).includes(user.id));

  // Moving to another post starts at its first photo (or the requested one)
  useEffect(() => {
    setPhoto(photoIndex);
  }, [index, photoIndex]);

  // Keyboard: Esc closes, arrows step through photos, then through posts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        if (photo > 0) setPhoto(photo - 1);
        else if (index > 0) onNavigate(index - 1);
      }
      if (e.key === 'ArrowRight') {
        if (photo < photos.length - 1) setPhoto(photo + 1);
        else if (index < posts.length - 1) onNavigate(index + 1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, posts.length, photo, photos.length, onClose, onNavigate]);

  if (!post) return null;

  const isPostByCurrentUser = Boolean(user && post.userId === user.id);
  const displayPostAuthorName =
    isPostByCurrentUser && user?.name ? user.name : post.authorName || 'Traveler';
  const displayPostAuthorAvatar =
    isPostByCurrentUser && user?.avatar
      ? user.avatar
      : post.authorAvatar || fallbackAvatar(displayPostAuthorName);

  const handleLike = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setIsLiking(true);
    try {
      const { data, error } = await supabase.rpc('toggle_like', { target_post_id: post.id });
      if (error) throw error;

      onUpdate({ ...post, likes: (data as string[]) || [] });
    } catch (err) {
      console.error('Failed to like post', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleCommentLike = async (commentId: string, existingLikes: string[]) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    const alreadyLiked = existingLikes.includes(user.id);
    const optimistic = alreadyLiked
      ? existingLikes.filter(id => id !== user.id)
      : [...existingLikes, user.id];

    onUpdate({
      ...post,
      comments: (post.comments || []).map(c => (c.id === commentId ? { ...c, likes: optimistic } : c)),
    });

    try {
      const { data, error } = await supabase.rpc('toggle_comment_like', { target_comment_id: commentId });
      if (!error && Array.isArray(data)) {
        onUpdate({
          ...post,
          comments: (post.comments || []).map(c => (c.id === commentId ? { ...c, likes: data as string[] } : c)),
        });
      }
    } catch {
      // Keep optimistic update
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/community?post=${encodeURIComponent(post.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${displayPostAuthorName} · PakJaiTravel`,
          text: post.content || 'PakJaiTravel',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled share sheet
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!commentText.trim()) return;

    setIsCommenting(true);
    try {
      const avatarUrl = user.avatar || fallbackAvatar(user.name);
      const trimmed = commentText.trim();
      const payload: Record<string, any> = {
        post_id: post.id,
        user_id: user.id,
        author_name: user.name,
        author_avatar: avatarUrl,
        text: trimmed,
      };
      if (replyingTo) payload.parent_id = replyingTo.id;

      let { data, error } = await supabase.from('comments').insert(payload).select().single();

      if (error && replyingTo) {
        delete payload.parent_id;
        payload.text = `@${replyingTo.authorName} ${trimmed}`;
        const retry = await supabase.from('comments').insert(payload).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      if (data) {
        onUpdate({
          ...post,
          comments: [
            ...(post.comments || []),
            {
              id: data.id,
              userId: data.user_id,
              authorName: data.author_name,
              authorAvatar: data.author_avatar,
              text: data.text,
              parentId: data.parent_id || null,
              likes: data.likes || [],
              createdAt: data.created_at,
            },
          ],
        });
        setCommentText('');
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Failed to comment', err);
      alert(t('post.commentFailed'));
    } finally {
      setIsCommenting(false);
    }
  };

  const normalizedComments = ((post.comments || []) as RawComment[]).map(c => {
    const cUserId = c.userId || c.user_id || '';
    const isMe = Boolean(user && cUserId === user.id);
    const cName =
      (isMe && user?.name ? user.name : c.authorName || c.author_name) || 'Traveler';
    const cAvatar =
      (isMe && user?.avatar ? user.avatar : c.authorAvatar || c.author_avatar) ||
      fallbackAvatar(cName);
    const cCreatedAt = c.createdAt || c.created_at;

    return {
      id: c.id,
      userId: cUserId,
      authorName: cName,
      authorAvatar: cAvatar,
      text: c.text,
      parentId: c.parentId ?? c.parent_id ?? null,
      likes: c.likes || [],
      createdAt: cCreatedAt,
    };
  });

  const topComments = normalizedComments.filter(c => !c.parentId);
  const repliesByParent = new Map<string, typeof normalizedComments>();
  normalizedComments.forEach(c => {
    if (!c.parentId) return;
    const list = repliesByParent.get(c.parentId) || [];
    list.push(c);
    repliesByParent.set(c.parentId, list);
  });

  const followingAuthor = Boolean(post.userId && isFollowing(post.userId));
  const likesCount = (post.likes || []).length;
  const commentsCount = normalizedComments.length;

  return (
    <div className="journal-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      {/* Post-to-post navigation arrows */}
      {index > 0 && (
        <button
          className="journal-modal-nav journal-modal-nav-prev"
          aria-label="Previous story"
          onClick={e => {
            e.stopPropagation();
            onNavigate(index - 1);
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      {index < posts.length - 1 && (
        <button
          className="journal-modal-nav journal-modal-nav-next"
          aria-label="Next story"
          onClick={e => {
            e.stopPropagation();
            onNavigate(index + 1);
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      <div className="journal-modal" onClick={e => e.stopPropagation()}>
        {/* ── Left: Media Stage ── */}
        <div className="journal-modal-media">
          {photos.length > 0 ? (
            <>
              <img
                className="jm-main-photo"
                src={photos[Math.min(photo, photos.length - 1)]}
                alt={post.content ? post.content.slice(0, 120) : 'Journal photo'}
              />

              {photos.length > 1 && (
                <>
                  <span className="jm-photo-count" aria-live="polite">
                    {photo + 1} / {photos.length}
                  </span>

                  {photo > 0 && (
                    <button
                      className="jm-photo-nav jm-photo-prev"
                      onClick={() => setPhoto(photo - 1)}
                      aria-label={t('post.prevPhoto')}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                  )}
                  {photo < photos.length - 1 && (
                    <button
                      className="jm-photo-nav jm-photo-next"
                      onClick={() => setPhoto(photo + 1)}
                      aria-label={t('post.nextPhoto')}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  )}

                  {/* Thumbnail filmstrip for multi-photo posts */}
                  <div className="jm-thumbs" role="tablist" aria-label="Story photos">
                    {photos.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`jm-thumb ${i === photo ? 'active' : ''}`}
                        onClick={() => setPhoto(i)}
                        aria-label={`View photo ${i + 1}`}
                      >
                        <img src={src} alt="" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="journal-modal-noimg">
              <p>{post.content}</p>
            </div>
          )}
        </div>

        {/* ── Right: Editorial Story & Conversation Panel ── */}
        <div className="journal-modal-panel">
          {/* Author Header + Close Button */}
          <header className="jm-header">
            <div className="jm-header-author">
              <img
                src={displayPostAuthorAvatar}
                alt={displayPostAuthorName}
                className="jm-avatar"
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src = fallbackAvatar(displayPostAuthorName);
                }}
              />
              <div className="jm-author-meta">
                <span className="jm-author">{displayPostAuthorName}</span>
                <div className="jm-submeta">
                  {post.locationTag && (
                    <span className="jm-location">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                        <circle cx="12" cy="9.5" r="2.5" />
                      </svg>
                      {post.locationTag}
                    </span>
                  )}
                  {formatFullDate(post.createdAt) && (
                    <span className="jm-post-date">{formatFullDate(post.createdAt)}</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!isPostByCurrentUser && post.userId && (
                <button
                  type="button"
                  className={`pc-follow-pill${followingAuthor ? ' is-following' : ''}`}
                  onClick={() => toggleFollow(post.userId)}
                  disabled={busyId === post.userId}
                >
                  {followingAuthor ? t('social.following') : `+ ${t('social.follow')}`}
                </button>
              )}
              <button className="jm-close-btn" onClick={onClose} aria-label={t('createPost.close')}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </header>

          {/* Scrollable Story + Traveler Notes */}
          <div className="jm-scroll">
            {(post.content || post.rating || post.priceRating) && (
              <article className="jm-story-entry">
                {post.content && <p className="jm-story-text">{post.content}</p>}

                {(post.rating || post.priceRating) && (
                  <div className="jm-rating-row">
                    {post.rating && (
                      <span className="jm-rating-pill">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="#D99B26">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        {post.rating}.0 / 5
                      </span>
                    )}
                    {post.priceRating && (
                      <span className="jm-price-pill">{post.priceRating.replace(/\$/g, '฿')}</span>
                    )}
                  </div>
                )}
              </article>
            )}

            <div className="jm-comments-section">
              <div className="jm-comments-heading">
                <span>{t('post.comment')}</span>
                <span className="jm-comments-badge">{commentsCount}</span>
              </div>

              {topComments.length > 0 ? (
                <div className="jm-comments-list">
                  {topComments.map(c => {
                    const cLiked = Boolean(user && c.likes.includes(user.id));
                    const replies = repliesByParent.get(c.id) || [];
                    return (
                      <div key={c.id} className="jm-comment-thread">
                        <div className="jm-comment-card">
                          <Link to={user?.id === c.userId ? '/profile' : `/profile/${c.userId}`} onClick={onClose}>
                            <img
                              src={c.authorAvatar}
                              alt={c.authorName}
                              className="jm-comment-avatar"
                              onError={e => {
                                (e.currentTarget as HTMLImageElement).src = fallbackAvatar(c.authorName);
                              }}
                            />
                          </Link>
                          <div className="jm-comment-body">
                            <div className="jm-comment-top">
                              <Link to={user?.id === c.userId ? '/profile' : `/profile/${c.userId}`} onClick={onClose} className="jm-comment-author">
                                {c.authorName}
                              </Link>
                              <span className="jm-time">{formatTimeAgo(c.createdAt)}</span>
                            </div>
                            <p className="jm-comment-text">{c.text}</p>
                            <div className="jm-comment-actions">
                              <button
                                type="button"
                                className={`pc-comment-action${cLiked ? ' is-liked' : ''}`}
                                onClick={() => handleToggleCommentLike(c.id, c.likes)}
                              >
                                {t('post.like')}{c.likes.length > 0 ? ` (${c.likes.length})` : ''}
                              </button>
                              <button
                                type="button"
                                className="pc-comment-action"
                                onClick={() => {
                                  if (!user) {
                                    openAuthModal('login');
                                    return;
                                  }
                                  setReplyingTo({ id: c.id, authorName: c.authorName });
                                  setTimeout(() => commentInputRef.current?.focus(), 40);
                                }}
                              >
                                {t('post.reply')}
                              </button>
                            </div>
                          </div>
                        </div>

                        {replies.length > 0 && (
                          <div className="jm-replies-list">
                            {replies.map(r => {
                              const rLiked = Boolean(user && r.likes.includes(user.id));
                              return (
                                <div key={r.id} className="jm-comment-card jm-reply-card">
                                  <Link to={user?.id === r.userId ? '/profile' : `/profile/${r.userId}`} onClick={onClose}>
                                    <img
                                      src={r.authorAvatar}
                                      alt={r.authorName}
                                      className="jm-comment-avatar jm-reply-avatar"
                                      onError={e => {
                                        (e.currentTarget as HTMLImageElement).src = fallbackAvatar(r.authorName);
                                      }}
                                    />
                                  </Link>
                                  <div className="jm-comment-body">
                                    <div className="jm-comment-top">
                                      <Link to={user?.id === r.userId ? '/profile' : `/profile/${r.userId}`} onClick={onClose} className="jm-comment-author">
                                        {r.authorName}
                                      </Link>
                                      <span className="jm-time">{formatTimeAgo(r.createdAt)}</span>
                                    </div>
                                    <p className="jm-comment-text">{r.text}</p>
                                    <div className="jm-comment-actions">
                                      <button
                                        type="button"
                                        className={`pc-comment-action${rLiked ? ' is-liked' : ''}`}
                                        onClick={() => handleToggleCommentLike(r.id, r.likes)}
                                      >
                                        {t('post.like')}{r.likes.length > 0 ? ` (${r.likes.length})` : ''}
                                      </button>
                                      <button
                                        type="button"
                                        className="pc-comment-action"
                                        onClick={() => {
                                          if (!user) {
                                            openAuthModal('login');
                                            return;
                                          }
                                          setReplyingTo({ id: c.id, authorName: r.authorName });
                                          setTimeout(() => commentInputRef.current?.focus(), 40);
                                        }}
                                      >
                                        {t('post.reply')}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="jm-empty">
                  <p>{t('post.addComment')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Interactive Action Pills & Comment Composer */}
          <footer className="jm-footer">
            <div className="jm-actions-bar">
              <div className="jm-actions-left">
                <button
                  className={`jm-action-pill ${hasLiked ? 'liked' : ''}`}
                  onClick={handleLike}
                  disabled={isLiking}
                  aria-label={t('post.like')}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill={hasLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>
                    {likesCount} · {t('post.like')}
                  </span>
                </button>

                <button
                  className="jm-action-pill"
                  aria-label={t('post.comment')}
                  onClick={() => commentInputRef.current?.focus()}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <span>{commentsCount}</span>
                </button>
              </div>

              <button className="jm-action-pill" onClick={handleShare} aria-label={t('post.share')}>
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                <span>{copied ? t('post.linkCopied') : t('post.share')}</span>
              </button>
            </div>

            {user ? (
              <>
                {replyingTo && (
                  <div className="pc-replying-banner" style={{ marginBottom: '6px' }}>
                    <span>{t('post.replyingTo', { name: replyingTo.authorName })}</span>
                    <button type="button" onClick={() => setReplyingTo(null)}>
                      {t('post.cancelReply')}
                    </button>
                  </div>
                )}
                <form className="jm-comment-form" onSubmit={handleComment}>
                  <input
                    ref={commentInputRef}
                    type="text"
                    placeholder={
                      replyingTo
                        ? t('post.replyPlaceholder', { name: replyingTo.authorName })
                        : t('post.addComment')
                    }
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    disabled={isCommenting}
                  />
                  <button type="submit" disabled={isCommenting || !commentText.trim()}>
                    {isCommenting ? '...' : t('post.post')}
                  </button>
                </form>
              </>
            ) : (
              <div className="jm-login-hint">{t('post.loginToComment')}</div>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
};

export default JournalModal;
