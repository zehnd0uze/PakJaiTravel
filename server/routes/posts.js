import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
const POSTS_FILE = path.join(__dirname, '../data/posts.json');
const USERS_FILE = path.join(__dirname, '../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'pakjai-secret-key-change-in-production';

// Helpers
const getPosts = () => {
  try {
    if (!fs.existsSync(POSTS_FILE)) return [];
    const data = fs.readFileSync(POSTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading posts:', err);
    return [];
  }
};

const savePosts = (posts) => {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
};

const getUsers = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// GET /api/posts
router.get('/', (req, res) => {
  const posts = getPosts();
  // Return newest first
  res.json(posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// POST /api/posts
router.post('/', authenticate, (req, res) => {
  try {
    const { content, imageUrl, locationTag, rating, priceRating } = req.body;
    
    if (!content && !imageUrl) {
      return res.status(400).json({ error: 'Post must contain text or an image.' });
    }

    const users = getUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newPost = {
      id: uuidv4(),
      userId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
      content: content || '',
      imageUrl: imageUrl || null,
      locationTag: locationTag || null,
      rating: rating || null,
      priceRating: priceRating || null,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString()
    };

    const posts = getPosts();
    posts.push(newPost);
    savePosts(posts);

    res.status(201).json(newPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/posts/:id/like
router.post('/:id/like', authenticate, (req, res) => {
  try {
    const posts = getPosts();
    const postIndex = posts.findIndex(p => p.id === req.params.id);
    
    if (postIndex === -1) return res.status(404).json({ error: 'Post not found' });
    
    const post = posts[postIndex];
    const userId = req.user.id;
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id !== userId);
    } else {
      // Like
      post.likes.push(userId);
    }

    savePosts(posts);
    res.json({ message: hasLiked ? 'Post unliked' : 'Post liked', likes: post.likes });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/posts/:id/comment
router.post('/:id/comment', authenticate, (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') return res.status(400).json({ error: 'Comment text is required' });

    const posts = getPosts();
    const postIndex = posts.findIndex(p => p.id === req.params.id);
    
    if (postIndex === -1) return res.status(404).json({ error: 'Post not found' });

    const users = getUsers();
    const user = users.find(u => u.id === req.user.id);

    const newComment = {
      id: uuidv4(),
      userId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    posts[postIndex].comments.push(newComment);
    savePosts(posts);

    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
