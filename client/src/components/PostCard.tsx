import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useFollows } from '../hooks/useFollows';
import CreatePostModal from './CreatePostModal';
import { supabase } from '../utils/supabase';
import { type Post, type Comment } from '../types';
import { getPostPhotos } from '../utils/postPhotos';
import './PostCard.css';

interface PostCardProps {
  post: Post;
  onUpdate: (updatedPost: Post) => void;
  onDelete?: (postId: string) => void;
  onTagClick?: (tag: string) => void;
  /** Opens the full post viewer (photos + all comments), optionally at a given photo */
  onOpen?: (photoIndex?: number) => void;
}

const HeartIcon: React.FC<{ filled?: boolean; size?: number }> = ({ filled, size = 24 }) => (
  filled ? (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
  ) : (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true"><path d="M12 20.3l-1.2-1.1C6 14.9 3 12.2 3 8.9 3 6.2 5.1 4 7.7 4c1.6 0 3.2.8 4.3 2 1.1-1.2 2.7-2 4.3-2C18.9 4 21 6.2 21 8.9c0 3.3-3 6-7.8 10.3L12 20.3z"/></svg>
  )
);

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>
  </svg>
);

const formatTimeAgo = (dateString: string) => {
  const d = new Date(dateString);
  const diffInSeconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffInSeconds < 60) return 'now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const PostCard: React.FC<PostCardProps> = ({ post, onUpdate, onDelete, onTagClick, onOpen }) => {
  const { user, openAuthModal } = useAuth();
  const { isFollowing, toggleFollow, busyId } = useFollows();
  const { t } = useTranslation();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const isOwner = Boolean(user && post.userId === user.id);
  const followingAuthor = Boolean(post.userId && isFollowing(post.userId));
  const hasLiked = Boolean(user && (post.likes || []).includes(user.id));
  const likeCount = (post.likes || []).length;
  const comments = post.comments || [];
  const isReview = Boolean(post.rating || post.priceRating);
  const photos = getPostPhotos(post);
  const photoAlt = post.content ? post.content.slice(0, 120) : `${post.authorName} — ${post.locationTag || ''}`;
  const isLongCaption = (post.content || '').length > (photos.length > 0 ? 180 : 420);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setLiked = async (like: boolean) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (like === hasLiked || isLiking) return;
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

  const handleToggleCommentLike = async (comment: Comment) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    const existingLikes = comment.likes || [];
    const alreadyLiked = existingLikes.includes(user.id);
    const optimisticLikes = alreadyLiked
      ? existingLikes.filter((id) => id !== user.id)
      : [...existingLikes, user.id];

    // Optimistic update
    onUpdate({
      ...post,
      comments: comments.map((c) => (c.id === comment.id ? { ...c, likes: optimisticLikes } : c)),
    });

    try {
      const { data, error } = await supabase.rpc('toggle_comment_like', { target_comment_id: comment.id });
      if (!error && Array.isArray(data)) {
        onUpdate({
          ...post,
          comments: comments.map((c) => (c.id === comment.id ? { ...c, likes: data as string[] } : c)),
        });
      }
    } catch {
      // Keep optimistic state if RPC not migrated yet
    }
  };

  const startReply = (comment: Comment) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setShowComments(true);
    setReplyingTo({ id: comment.parentId || comment.id, authorName: comment.authorName });
    setTimeout(() => commentInputRef.current?.focus(), 40);
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
      const avatarUrl =
        user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2C4C3B&color=fff`;
      const trimmed = commentText.trim();
      const payload: Record<string, any> = {
        post_id: post.id,
        user_id: user.id,
        author_name: user.name,
        author_avatar: avatarUrl,
        text: trimmed,
      };
      if (replyingTo) {
        payload.parent_id = replyingTo.id;
      }

      let { data, error } = await supabase.from('comments').insert(payload).select().single();

      // Fallback if parent_id column hasn't been added via social_features.sql yet
      if (error && replyingTo) {
        delete payload.parent_id;
        payload.text = `@${replyingTo.authorName} ${trimmed}`;
        const retry = await supabase.from('comments').insert(payload).select().single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      if (data) {
        const newComment: Comment = {
          id: data.id,
          userId: data.user_id,
          authorName: data.author_name,
          authorAvatar: data.author_avatar,
          text: data.text,
          parentId: data.parent_id || null,
          likes: data.likes || [],
          createdAt: data.created_at,
        };
        onUpdate({ ...post, comments: [...comments, newComment] });
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

  const handleDelete = async () => {
    if (!window.confirm(t('post.confirmDelete'))) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      if (onDelete) onDelete(post.id);
    } catch {
      alert(t('post.deleteFailed'));
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const shareUrl = `${window.location.origin}/community?post=${encodeURIComponent(post.id)}`;
  const shareText = post.content ? post.content.slice(0, 120) : `${post.authorName} · PakJaiTravel`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setShowShareMenu(false);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleNativeShare = async () => {
    setShowShareMenu(false);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'PakJaiTravel', text: shareText, url: shareUrl });
      }
    } catch {
      // dismissed
    }
  };

  const handleShareLine = () => {
    setShowShareMenu(false);
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleShareFacebook = () => {
    setShowShareMenu(false);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleCommentsClick = () => {
    if (onOpen) onOpen();
    else setShowComments(s => !s);
  };

  const mapUrl = post.lat && post.lng
    ? `https://www.google.com/maps/search/?api=1&query=${post.lat},${post.lng}`
    : post.locationTag
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.locationTag)}`
      : null;

  const ratingBlock = post.rating ? (
    <span className="pc-review-stars" aria-label={t('post.ratingLabel', { rating: post.rating })}>
      {[1, 2, 3, 4, 5].map(n => <StarIcon key={n} filled={n <= (post.rating || 0)} />)}
    </span>
  ) : null;

  // Organize top-level comments and nested replies
  const topLevelComments = comments.filter(c => !c.parentId);
  const repliesByParent = new Map<string, Comment[]>();
  comments.forEach(c => {
    if (!c.parentId) return;
    const list = repliesByParent.get(c.parentId) || [];
    list.push(c);
    repliesByParent.set(c.parentId, list);
  });
  const visibleTopComments = showComments ? topLevelComments : topLevelComments.slice(-2);

  const authorProfilePath = isOwner ? '/profile' : `/profile/${post.userId}`;
  const myAvatar = user
    ? user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2C4C3B&color=fff`
    : '';
  const displayAuthorAvatar =
    isOwner && user?.avatar
      ? user.avatar
      : post.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || 'U')}&background=2C4C3B&color=fff`;

  return (
    <article className={`pc-post ${isDeleting ? 'deleting' : ''}`}>
      <header className="pc-post-head">
        <Link to={authorProfilePath} className="pc-avatar-link">
          <img src={displayAuthorAvatar} alt="" className="pc-avatar" />
        </Link>
        <div className="pc-post-who">
          <div className="pc-author-row">
            <Link to={authorProfilePath} className="pc-author pc-author-link">{post.authorName}</Link>
            {!isOwner && post.userId && (
              <button
                type="button"
                className={`pc-follow-pill${followingAuthor ? ' is-following' : ''}`}
                onClick={() => toggleFollow(post.userId)}
                disabled={busyId === post.userId}
              >
                {followingAuthor ? t('social.following') : `+ ${t('social.follow')}`}
              </button>
            )}
          </div>
          <div className="pc-post-line">
            <time className="pc-time" dateTime={post.createdAt}>{formatTimeAgo(post.createdAt)}</time>
            {post.locationTag && (
              <>
                <span className="pc-dot" aria-hidden="true">·</span>
                {onTagClick ? (
                  <button className="pc-place" onClick={() => onTagClick(post.locationTag!)}>
                    {post.locationTag}
                  </button>
                ) : (
                  <span className="pc-place">{post.locationTag}</span>
                )}
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pc-map"
                    aria-label={t('post.openMap')}
                    title={t('post.openMap')}
                  >
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>
                  </a>
                )}
              </>
            )}
          </div>
        </div>

        {isOwner && (
          <div className="pc-menu" ref={menuRef}>
            <button
              className="pc-icon-btn"
              onClick={() => setShowMenu(!showMenu)}
              aria-label={t('post.options')}
              aria-expanded={showMenu}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                <circle cx="6" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="18" cy="12" r="1.6" />
              </svg>
            </button>
            {showMenu && (
              <div className="pc-menu-list" role="menu">
                <button role="menuitem" onClick={() => { setIsEditModalOpen(true); setShowMenu(false); }}>
                  {t('post.edit')}
                </button>
                <button role="menuitem" className="danger" onClick={handleDelete}>
                  {t('post.delete')}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Caption first, like a Facebook post */}
      {post.content && (
        <div className={`pc-caption ${photos.length > 0 ? '' : 'pc-caption--status'}`}>
          <p className={captionOpen || !isLongCaption ? 'open' : ''}>{post.content}</p>
          {isLongCaption && !captionOpen && (
            <button className="pc-more" onClick={() => setCaptionOpen(true)}>{t('post.more')}</button>
          )}
        </div>
      )}

      {(isReview || post.propertyId) && (
        <div className="pc-review">
          {ratingBlock}
          {post.priceRating && <span className="pc-review-price">{post.priceRating.replace(/\$/g, '฿')}</span>}
          {post.propertyId && (
            <Link to={`/hotels/${post.propertyId}`} className="pc-stay-link">
              {t('post.viewStay')}
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
            </Link>
          )}
        </div>
      )}

      {/* Photos — one at its own shape; several as a Facebook grid:
          2 side by side, 3 = one big + two, 4 = 2×2, 5+ = 2 over 3 with "+N" */}
      {photos.length > 0 && (
        <div className={`pc-media ${photos.length > 1 ? `pc-grid pc-grid--${Math.min(photos.length, 5)}` : ''}`}>
          {photos.slice(0, 5).map((src, i) => {
            const hidden = photos.length - 5;
            const showMore = i === 4 && hidden > 0;
            const label = showMore
              ? t('post.morePhotos', { count: hidden })
              : t('post.photoN', { n: i + 1, total: photos.length });
            const img = <img src={src} alt={photos.length === 1 ? photoAlt : ''} loading="lazy" />;
            return onOpen ? (
              <button
                key={`${src}-${i}`}
                type="button"
                className="pc-grid-cell"
                onClick={() => onOpen(i)}
                aria-label={label}
              >
                {img}
                {showMore && <span className="pc-grid-more" aria-hidden="true">+{hidden}</span>}
              </button>
            ) : (
              <div key={`${src}-${i}`} className="pc-grid-cell">
                {img}
                {showMore && <span className="pc-grid-more" aria-hidden="true">+{hidden}</span>}
              </div>
            );
          })}
        </div>
      )}

      <div className="pc-actions">
        <button
          className={`pc-action pc-like ${hasLiked ? 'liked' : ''}`}
          onClick={() => setLiked(!hasLiked)}
          disabled={isLiking}
          aria-pressed={hasLiked}
        >
          <HeartIcon filled={hasLiked} size={18} />
          <span>{likeCount > 0 ? `${likeCount} · ${t('post.like')}` : t('post.like')}</span>
        </button>
        <button className="pc-action" onClick={() => commentInputRef.current ? commentInputRef.current.focus() : handleCommentsClick()}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 11.6a8.4 8.4 0 0 1-12.3 7.5L3.5 20.5l1.4-4.6A8.4 8.4 0 1 1 20.5 11.6z"/></svg>
          <span>{comments.length > 0 ? `${comments.length} · ${t('post.comment')}` : t('post.comment')}</span>
        </button>
        <div className="pc-share-wrap" ref={shareRef}>
          <button className="pc-action" type="button" onClick={() => setShowShareMenu(v => !v)} aria-expanded={showShareMenu}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true"><path d="M21.5 3 10 14.5M21.5 3l-7 18-4.5-6.5L3 10z"/></svg>
            <span>{copied ? t('post.linkCopied') : t('post.share')}</span>
          </button>
          {showShareMenu && (
            <div className="pc-share-popover" role="menu">
              <button type="button" role="menuitem" onClick={handleCopyLink}>{t('post.copyLink')}</button>
              <button type="button" role="menuitem" onClick={handleShareLine}>{t('post.shareLine')}</button>
              <button type="button" role="menuitem" onClick={handleShareFacebook}>{t('post.shareFacebook')}</button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button type="button" role="menuitem" onClick={handleNativeShare}>{t('post.shareMore')}</button>
              )}
            </div>
          )}
        </div>
      </div>

      {(visibleTopComments.length > 0 || user) && (
        <div className="pc-comments-area">
          {topLevelComments.length > 2 && !showComments && (
            <button className="pc-view-all" onClick={handleCommentsClick}>
              {t('post.viewAll', { count: comments.length })}
            </button>
          )}

          {visibleTopComments.length > 0 && (
            <ul className="pc-comments">
              {visibleTopComments.map(c => {
                const cLikes = c.likes || [];
                const cLiked = Boolean(user && cLikes.includes(user.id));
                const replies = repliesByParent.get(c.id) || [];
                return (
                  <li key={c.id} className="pc-comment-thread">
                    <div className="pc-comment-row">
                      <Link to={user?.id === c.userId ? '/profile' : `/profile/${c.userId}`}>
                        <img src={c.authorAvatar} alt="" className="pc-comment-avatar" />
                      </Link>
                      <div className="pc-comment-col">
                        <div className="pc-bubble">
                          <Link to={user?.id === c.userId ? '/profile' : `/profile/${c.userId}`} className="pc-author pc-author-link">
                            {c.authorName}
                          </Link>
                          <p>{c.text}</p>
                        </div>
                        <div className="pc-comment-meta">
                          <span>{formatTimeAgo(c.createdAt)}</span>
                          <button
                            type="button"
                            className={`pc-comment-action${cLiked ? ' is-liked' : ''}`}
                            onClick={() => handleToggleCommentLike(c)}
                          >
                            {t('post.like')}{cLikes.length > 0 ? ` (${cLikes.length})` : ''}
                          </button>
                          <button
                            type="button"
                            className="pc-comment-action"
                            onClick={() => startReply(c)}
                          >
                            {t('post.reply')}
                          </button>
                        </div>
                      </div>
                    </div>

                    {replies.length > 0 && (
                      <ul className="pc-replies">
                        {replies.map(r => {
                          const rLikes = r.likes || [];
                          const rLiked = Boolean(user && rLikes.includes(user.id));
                          return (
                            <li key={r.id} className="pc-comment-row">
                              <Link to={user?.id === r.userId ? '/profile' : `/profile/${r.userId}`}>
                                <img src={r.authorAvatar} alt="" className="pc-comment-avatar pc-reply-avatar" />
                              </Link>
                              <div className="pc-comment-col">
                                <div className="pc-bubble">
                                  <Link to={user?.id === r.userId ? '/profile' : `/profile/${r.userId}`} className="pc-author pc-author-link">
                                    {r.authorName}
                                  </Link>
                                  <p>{r.text}</p>
                                </div>
                                <div className="pc-comment-meta">
                                  <span>{formatTimeAgo(r.createdAt)}</span>
                                  <button
                                    type="button"
                                    className={`pc-comment-action${rLiked ? ' is-liked' : ''}`}
                                    onClick={() => handleToggleCommentLike(r)}
                                  >
                                    {t('post.like')}{rLikes.length > 0 ? ` (${rLikes.length})` : ''}
                                  </button>
                                  <button
                                    type="button"
                                    className="pc-comment-action"
                                    onClick={() => startReply(r)}
                                  >
                                    {t('post.reply')}
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {user && (
            <div className="pc-comment-composer">
              {replyingTo && (
                <div className="pc-replying-banner">
                  <span>{t('post.replyingTo', { name: replyingTo.authorName })}</span>
                  <button type="button" onClick={() => setReplyingTo(null)}>
                    {t('post.cancelReply')}
                  </button>
                </div>
              )}
              <form className="pc-comment-form" onSubmit={handleComment}>
                <img src={myAvatar} alt="" className="pc-comment-avatar" />
                <div className="pc-comment-field">
                  <input
                    ref={commentInputRef}
                    type="text"
                    placeholder={
                      replyingTo
                        ? t('post.replyPlaceholder', { name: replyingTo.authorName })
                        : t('post.addComment')
                    }
                    aria-label={t('post.addComment')}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    disabled={isCommenting}
                  />
                  {commentText.trim() && (
                    <button type="submit" disabled={isCommenting}>{t('post.post')}</button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {isEditModalOpen && (
        <CreatePostModal
          onClose={() => setIsEditModalOpen(false)}
          onPostCreated={() => {
            setIsEditModalOpen(false);
            window.location.reload(); // Quickest way to see updates across the app for now
          }}
          postToEdit={post}
        />
      )}
    </article>
  );
};

export default PostCard;
