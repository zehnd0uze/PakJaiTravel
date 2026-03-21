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

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <img src={post.authorAvatar} alt={post.authorName} className="post-avatar" />
        <div className="post-header-info">
          <h3>{post.authorName}</h3>
          <span className="post-date">{formatDate(post.createdAt)}</span>
        </div>
      </div>

      {(post.rating || post.priceRating || post.locationTag) && (
        <div className="post-rating-bar">
          {post.locationTag && <span className="post-location">📍 {post.locationTag}</span>}
          {post.rating && (
            <span className="post-stars">
              {'★'.repeat(post.rating)}{'☆'.repeat(5 - post.rating)}
            </span>
          )}
          {post.priceRating && <span className="post-price">{post.priceRating}</span>}
        </div>
      )}

      {post.imageUrl && (
        <div className="post-image-container">
          <img src={post.imageUrl} alt="Travel Post" className="post-image" />
        </div>
      )}

      {post.content && (
        <div className="post-content">
          <p>{post.content}</p>
        </div>
      )}

      <div className="post-actions">
        <button 
          className={`action-btn like-btn ${hasLiked ? 'liked' : ''}`} 
          onClick={handleLike}
          disabled={isLiking}
        >
          {hasLiked ? '❤️' : '🤍'} {post.likes.length}
        </button>
        <button 
          className="action-btn comment-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 {post.comments.length}
        </button>
      </div>

      {showComments && (
        <div className="post-comments-section">
          {post.comments.length > 0 ? (
            <div className="comments-list">
              {post.comments.map(c => (
                <div key={c.id} className="comment-item">
                  <img src={c.authorAvatar} alt={c.authorName} className="comment-avatar" />
                  <div className="comment-body">
                    <strong>{c.authorName}</strong>
                    <p>{c.text}</p>
                    <span className="comment-date">{formatDate(c.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-comments">No comments yet. Be the first!</p>
          )}

          {user && (
            <form className="comment-form" onSubmit={handleComment}>
              <img src={(user as any).avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} className="comment-avatar" />
              <input 
                type="text" 
                placeholder="Write a comment..." 
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
