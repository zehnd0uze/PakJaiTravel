import express from 'express';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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

// trust proxy is needed when running on Railway, Vercel, etc.
// so that express-rate-limit can see the real user IP
app.set('trust proxy', 1);

// Security Middleware: Set security HTTP headers
app.use(helmet({
  // Adjust cross-origin policies if you have external images (like from Firebase or Google)
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));

// Security Middleware: Restrict Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174',
  'https://www.pakjaitravel.com', 
  'https://pakjaitravel.com'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production MVP, if it's a generated domain (Vercel, Railway, Netlify), allow it temporarily
    if (origin.endsWith('.vercel.app') || origin.endsWith('.up.railway.app') || origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }

    // Otherwise check the whitelist
    if (allowedOrigins.indexOf(origin) === -1 && process.env.NODE_ENV === 'production') {
      console.warn(`Blocked CORS request from origin: ${origin}`);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Security Middleware: Global API Rate Limiting to prevent basic abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per 15 minutes
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all /api routes
app.use('/api', apiLimiter);

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
