import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { chiangDaoProperties } from './chiangDao.js';
import authRoutes from './routes/auth.js';
import propertiesRoutes from './routes/properties.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'PakJaiTravel API is running' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Properties CRUD routes (admin)
app.use('/api/properties', propertiesRoutes);

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
