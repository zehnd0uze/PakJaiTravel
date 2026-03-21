import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { chiangDaoProperties } from './chiangDao.js';
import authRoutes from './routes/auth.js';
import propertiesRoutes from './routes/properties.js';
import uploadRoutes from './routes/upload.js';
import postsRoutes from './routes/posts.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Traffic Logging Middleware
const TRAFFIC_FILE = path.resolve(__dirname, 'data/traffic.json');

app.use((req, res, next) => {
  // Log all requests that aren't obvious static files
  const isDoc = req.path === '/' || req.path.startsWith('/api') || !req.path.includes('.');
  
  if (isDoc) {
    try {
      let traffic = [];
      if (fs.existsSync(TRAFFIC_FILE)) {
        traffic = JSON.parse(fs.readFileSync(TRAFFIC_FILE, 'utf8') || '[]');
      }
      
      traffic.push({ 
        ts: Date.now(), 
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip', 
        p: req.path 
      });

      // Maintain last 24h
      const cutOff = Date.now() - (24 * 60 * 60 * 1000);
      const filtered = traffic.filter(t => t.ts > cutOff);
      
      fs.writeFileSync(TRAFFIC_FILE, JSON.stringify(filtered));
    } catch (err) {
      console.error('Traffic log failed:', err.message);
    }
  }
  next();
});

// Dedicated tracking hit (can be called by frontend)
app.post('/api/track', (req, res) => {
  res.status(204).end(); // Just to trigger the middleware above
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'PakJaiTravel API is running' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Properties CRUD routes (admin)
app.use('/api/properties', propertiesRoutes);

// File uploads
app.use('/api/upload', uploadRoutes);

// Community Posts
app.use('/api/posts', postsRoutes);

// Admin specific routes (stats/traffic)
app.use('/api/admin', adminRoutes);

// Serve static uploaded files from persistent data/uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'data/uploads')));

// Endpoint for Verified Chiang Dao Properties
app.get('/api/chiangdao/accommodations', (req, res) => {
  res.json(chiangDaoProperties);
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch-all route to serve the React app's index.html
app.get(/^(.*)$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
