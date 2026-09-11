import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreatePostModal from './CreatePostModal';
import { supabase } from '../utils/supabase';
import { type Post } from '../types';
import './PostCard.css';

interface PostCardProps {
  post: Post;
  onUpdate: (updatedPost: Post) => void;
  onDelete?: (postId: string) => void;
  onTagClick?: (tag: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onUpdate, onDelete, onTagClick }) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = user && post.userId === user.id;
  const hasLiked = user && (post.likes || []).includes(user.id);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = async () => {
    if (!user) {
      alert("Please login to like this post.");
      return;
    }
    setIsLiking(true);
    try {
      const likes = post.likes || [];
      const hasLiked = likes.includes(user.id);
      const updatedLikes = hasLiked
        ? likes.filter(id => id !== user.id)
        : [...likes, user.id];

      const { error } = await supabase
        .from('posts')
        .update({ likes: updatedLikes })
        .eq('id', post.id);

      if (error) throw error;

      onUpdate({ ...post, likes: updatedLikes });
    } catch (err: any) {
      console.error('Failed to like post', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to comment.");
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
        const newComment = {
          id: data.id,
          userId: data.user_id,
          authorName: data.author_name,
          authorAvatar: data.author_avatar,
          text: data.text,
          createdAt: data.created_at
        };
        onUpdate({ ...post, comments: [...post.comments, newComment] });
        setCommentText('');
      }
    } catch (err: any) {
      console.error('Failed to comment', err);
      alert("Failed to add comment.");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      if (onDelete) onDelete(post.id);
    } catch (err: any) {
      alert("Error deleting post");
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} d`;
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`post-card luxury-post-card ${isDeleting ? 'deleting' : ''}`}>
      {/* IG-style Header */}
      <div className="post-header">
        <div className="avatar-wrapper">
          <img src={post.authorAvatar} alt={post.authorName} className="post-avatar" />
        </div>
        <div className="post-header-info">
          <div className="name-row">
            <h3>{post.authorName}</h3>
            <svg className="verified-icon-small" viewBox="0 0 24 24" fill="var(--accent-color)" width="14" height="14">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/>
            </svg>
            <span className="dot-sep">•</span>
            <span className="post-date">{formatTimeAgo(post.createdAt)}</span>
          </div>
          {post.locationTag && (
            <div className="location-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span 
                className="location-tag-link" 
                onClick={() => onTagClick && onTagClick(post.locationTag!)}
                style={{ cursor: 'pointer', color: 'var(--accent-color)', fontWeight: 500 }}
                title="View all reviews for this location"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style={{ marginRight: '4px' }}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                {post.locationTag}
              </span>
              <a 
                href={post.lat && post.lng ? `https://www.google.com/maps/search/?api=1&query=${post.lat},${post.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.locationTag)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="map-external-link"
                style={{ fontSize: '0.75rem', color: '#6b7280', border: '1px solid #e5e7eb', padding: '2px 8px', borderRadius: '12px', textDecoration: 'none', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={(e) => e.stopPropagation()}
                title="View on Google Maps"
              >
                Map ↗
              </a>
            </div>
          )}
        </div>
        
        {isOwner && (
          <div className="post-menu-container" ref={menuRef}>
            <button className="post-menu-btn" onClick={() => setShowMenu(!showMenu)}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <circle cx="12" cy="12" r="1.5"></circle>
                <circle cx="6" cy="12" r="1.5"></circle>
                <circle cx="18" cy="12" r="1.5"></circle>
              </svg>
            </button>
            {showMenu && (
              <div className="post-dropdown-menu">
                <button onClick={() => { setIsEditModalOpen(true); setShowMenu(false); }}>
                  Edit Post
                </button>
                <button className="delete-option" onClick={handleDelete}>
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {post.content && (
        <div className="post-content">
          <p>{post.content}</p>
        </div>
      )}

      {post.imageUrl && (
        <div className="post-image-container">
          <img src={post.imageUrl} alt="Post Content" className="post-image" />
        </div>
      )}

      {(post.rating || post.priceRating) && (
        <div className="post-rating-bar">
          {post.rating && (
            <span className="post-stars">
              {'★'.repeat(post.rating)}{'☆'.repeat(5 - post.rating)}
            </span>
          )}
          {post.priceRating && (
            <span className="post-price">{post.priceRating.replace(/\$/g, '฿')}</span>
          )}
          {post.propertyId && (
            <button 
              className="view-listing-link"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/hotels/${post.propertyId}`;
              }}
              style={{
                background: 'var(--primary-color)',
                color: '#fff',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Book Now ↗
            </button>
          )}
        </div>
      )}

      <div className="post-actions">
        <button 
          className={`action-btn like-btn ${hasLiked ? 'liked' : ''}`} 
          onClick={handleLike}
          disabled={isLiking}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          {hasLiked ? 'Liked' : 'Like'} <span>{(post.likes || []).length}</span>
        </button>
        <button className="action-btn" onClick={() => setShowComments(!showComments)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
          Comment <span>{(post.comments || []).length}</span>
        </button>
        <button className="action-btn" onClick={() => {}}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
          Share
        </button>
      </div>

      {showComments && (
        <div className="post-comments-section">
          {(post.comments || []).length > 0 && (
            <div className="comments-list">
              {(post.comments || []).map(c => (
                <div key={c.id} className="comment-item">
                  <div className="comment-body">
                    <strong>{c.authorName}</strong> {c.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {user && (
            <form className="comment-form" onSubmit={handleComment}>
              <input 
                type="text" 
                placeholder="Add a comment..." 
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                disabled={isCommenting}
              />
              <button type="submit" disabled={isCommenting || !commentText.trim()}>Post</button>
            </form>
          )}
        </div>
      )}

      {isEditModalOpen && (
        <CreatePostModal 
          onClose={() => setIsEditModalOpen(false)}
          onPostCreated={() => {
            // Re-trigger post update (the parent will fetch or update state)
            // For now we'll just refresh the specific post if we have the data
            // But usually the parent handles this via onUpdate
            setIsEditModalOpen(false);
            // The submitPost in modal will call onPostCreated, which we should link to onUpdate/refresh
            window.location.reload(); // Quickest way to see updates across the app for now
          }}
          postToEdit={post}
        />
      )}
    </div>
  );
};

export default PostCard;
