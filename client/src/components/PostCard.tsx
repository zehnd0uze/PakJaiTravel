import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './PostCard.css';

interface Comment {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  imageUrl: string | null;
  locationTag: string | null;
  rating: number | null;
  priceRating: string | null;
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

interface PostCardProps {
  post: Post;
  onUpdate: (updatedPost: Post) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onUpdate }) => {
  const { user, token } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const hasLiked = user && post.likes.includes(user.id);

  const handleLike = async () => {
    if (!user || !token) {
      alert("Please login to like this post.");
      return;
    }
    setIsLiking(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate({ ...post, likes: data.likes });
      }
    } catch (err) {
      console.error('Failed to like post', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) {
      alert("Please login to comment.");
      return;
    }
    if (!commentText.trim()) return;

    setIsCommenting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: commentText })
      });
      if (res.ok) {
        const newComment = await res.json();
        onUpdate({ ...post, comments: [...post.comments, newComment] });
        setCommentText('');
      } else {
        alert("Failed to add comment.");
      }
    } catch (err) {
      console.error('Failed to comment', err);
    } finally {
      setIsCommenting(false);
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
    <div className="post-card ig-style">
      {/* IG-style Header */}
      <div className="post-header">
        <div className="avatar-wrapper">
          <div className="ig-ring"></div>
          <img src={post.authorAvatar} alt={post.authorName} className="post-avatar" />
        </div>
        <div className="post-header-info">
          <div className="name-row">
            <h3>{post.authorName}</h3>
            {/* Blue checkmark icon (verified placeholder) */}
            <svg className="verified-icon-small" viewBox="0 0 24 24" fill="#0095f6" width="14" height="14">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z"/>
            </svg>
            <span className="dot-sep">•</span>
            <span className="post-date">{formatTimeAgo(post.createdAt)}</span>
          </div>
          {post.locationTag && (
            <div className="location-row">{post.locationTag}</div>
          )}
        </div>
        <button className="post-menu-btn">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <circle cx="12" cy="12" r="1.5"></circle>
            <circle cx="6" cy="12" r="1.5"></circle>
            <circle cx="18" cy="12" r="1.5"></circle>
          </svg>
        </button>
      </div>

      {/* Content Text - Above Image */}
      {post.content && (
        <div className="post-content">
          <p>{post.content}</p>
        </div>
      )}

      {/* Post Media - Full Width */}
      {post.imageUrl && (
        <div className="post-image-container">
          <img src={post.imageUrl} alt="Post Content" className="post-image" />
        </div>
      )}

      {/* Metadata Bar - Ratings (Keep this for the travel app functionality) */}
      {(post.rating || post.priceRating) && (
        <div className="post-rating-bar">
          {post.rating && (
            <span className="post-stars">
              {'★'.repeat(post.rating)}{'☆'.repeat(5 - post.rating)}
            </span>
          )}
          {post.priceRating && (
            <span className="post-price">{post.priceRating}</span>
          )}
        </div>
      )}

      {/* Action Bar - Like and Comment */}
      <div className="post-actions">
        <button 
          className={`action-btn like-btn ${hasLiked ? 'liked' : ''}`} 
          onClick={handleLike}
          disabled={isLiking}
        >
          {hasLiked ? '❤️' : '🤍'} <span>{post.likes.length}</span>
        </button>
        <button 
          className="action-btn comment-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 <span>{post.comments.length}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="post-comments-section">
          {post.comments.length > 0 && (
            <div className="comments-list">
              {post.comments.map(c => (
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
    </div>
  );
};

export default PostCard;
