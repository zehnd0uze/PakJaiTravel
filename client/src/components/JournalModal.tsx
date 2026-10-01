import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { type Post } from '../types';
import './JournalModal.css';

interface JournalModalProps {
  posts: Post[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onUpdate: (post: Post) => void;
}

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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const JournalModal: React.FC<JournalModalProps> = ({ posts, index, onClose, onNavigate, onUpdate }) => {
  const { user } = useAuth();
  const post = posts[index];
  const [commentText, setCommentText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const hasLiked = Boolean(user && post && (post.likes || []).includes(user.id));

  // Keyboard: Esc closes, arrows navigate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && index < posts.length - 1) onNavigate(index + 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, posts.length, onClose, onNavigate]);

  if (!post) return null;

  const handleLike = async () => {
    if (!user) {
      alert('Please login to like this post.');
      return;
    }
    setIsLiking(true);
    try {
      const likes = post.likes || [];
      const updatedLikes = hasLiked
        ? likes.filter(id => id !== user.id)
        : [...likes, user.id];

      const { error } = await supabase
        .from('posts')
        .update({ likes: updatedLikes })
        .eq('id', post.id);
      if (error) throw error;

      onUpdate({ ...post, likes: updatedLikes });
    } catch (err) {
      console.error('Failed to like post', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to comment.');
      return;
    }
    if (!commentText.trim()) return;

    setIsCommenting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          author_name: user.name,
          author_avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2C4C3B&color=fff`,
          text: commentText.trim()
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onUpdate({
          ...post,
          comments: [...post.comments, {
            id: data.id,
            userId: data.user_id,
            authorName: data.author_name,
            authorAvatar: data.author_avatar,
            text: data.text,
            createdAt: data.created_at
          }]
        });
        setCommentText('');
      }
    } catch (err) {
      console.error('Failed to comment', err);
      alert('Failed to add comment.');
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="journal-modal-overlay" onClick={onClose}>
      <button className="journal-modal-close" onClick={onClose} aria-label="Close">&times;</button>

      {index > 0 && (
        <button
          className="journal-modal-nav journal-modal-nav-prev"
          aria-label="Previous post"
          onClick={(e) => { e.stopPropagation(); onNavigate(index - 1); }}
        >
          &#8249;
        </button>
      )}
      {index < posts.length - 1 && (
        <button
          className="journal-modal-nav journal-modal-nav-next"
          aria-label="Next post"
          onClick={(e) => { e.stopPropagation(); onNavigate(index + 1); }}
        >
          &#8250;
        </button>
      )}

      <div className="journal-modal" onClick={(e) => e.stopPropagation()}>
        {/* Left: picture */}
        <div className="journal-modal-media">
          {post.imageUrl ? (
            <img src={post.imageUrl} alt="Journal" />
          ) : (
            <p className="journal-modal-noimg">{post.content}</p>
          )}
        </div>

        {/* Right: author, caption, comments, actions */}
        <div className="journal-modal-panel">
          <div className="jm-header">
            <img src={post.authorAvatar} alt={post.authorName} className="jm-avatar" />
            <span className="jm-author">{post.authorName}</span>
            {post.locationTag && <span className="jm-location">{post.locationTag}</span>}
          </div>

          <div className="jm-scroll">
            {(post.content || post.rating || post.priceRating) && (
              <div className="jm-caption">
                <img src={post.authorAvatar} alt={post.authorName} className="jm-comment-avatar" />
                <p>
                  <strong>{post.authorName}</strong> {post.content}
                </p>
              </div>
            )}
            {(post.rating || post.priceRating) && (
              <div className="jm-caption jm-rating">
                <span className="jm-stars">{'★'.repeat(post.rating || 0)}{'☆'.repeat(5 - (post.rating || 0))}</span>
                {post.priceRating && <span className="jm-price">{post.priceRating.replace(/\$/g, '฿')}</span>}
              </div>
            )}

            {(post.comments || []).map(c => (
              <div key={c.id} className="jm-caption">
                <img src={c.authorAvatar} alt={c.authorName} className="jm-comment-avatar" />
                <div className="jm-caption-body">
                  <p><strong>{c.authorName}</strong> {c.text}</p>
                  <span className="jm-time">{formatTimeAgo(c.createdAt)}</span>
                </div>
              </div>
            ))}
            {(post.comments || []).length === 0 && (
              <div className="jm-empty">
                <h3>No comments yet</h3>
                <p>Start the conversation.</p>
              </div>
            )}
          </div>

          <div className="jm-actions-bar">
            <div className="jm-actions-left">
              <button
                className={`jm-action ${hasLiked ? 'liked' : ''}`}
                onClick={handleLike}
                disabled={isLiking}
                aria-label="Like"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </button>
              <button className="jm-action" aria-label="Comment" onClick={() => commentInputRef.current?.focus()}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </button>
              <button className="jm-action" aria-label="Share">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
            <span className="jm-likes">{(post.likes || []).length} likes</span>
          </div>

          <div className="jm-date">{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>

          {user ? (
            <form className="jm-comment-form" onSubmit={handleComment}>
              <input
                ref={commentInputRef}
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                disabled={isCommenting}
              />
              <button type="submit" disabled={isCommenting || !commentText.trim()}>Post</button>
            </form>
          ) : (
            <div className="jm-login-hint">Log in to comment.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalModal;
