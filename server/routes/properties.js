import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'pakjai-secret-key-change-in-production';

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../data/properties.json');

// Auth Middleware
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Helper to read properties
function getProperties() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper to save properties
function saveProperties(properties) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(properties, null, 2));
}

// GET /api/properties — list all
router.get('/', (req, res) => {
  const properties = getProperties();
  res.json(properties);
});

// GET /api/properties/owned — list only for current host
router.get('/owned', authenticate, (req, res) => {
  const properties = getProperties();
  const owned = properties.filter(p => p.ownerId === req.user.id);
  res.json(owned);
});

// GET /api/properties/:id — get one
router.get('/:id', (req, res) => {
  const properties = getProperties();
  const property = properties.find(p => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ error: 'Property not found.' });
  }
  res.json(property);
});

// POST /api/properties — create new
router.post('/', authenticate, (req, res) => {
  const properties = getProperties();
  const newProperty = {
    id: 'cd-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
    ...req.body,
    ownerId: req.user.id, // Auto-assign owner from token
    status: req.body.status || 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  properties.push(newProperty);
  saveProperties(properties);
  res.status(201).json(newProperty);
});

// PUT /api/properties/:id — update
router.put('/:id', authenticate, (req, res) => {
  const properties = getProperties();
  const index = properties.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Property not found.' });
  }

  // Verify ownership (unless admin, but we'll stick to host for now)
  if (properties[index].ownerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized. You do not own this property.' });
  }

  properties[index] = {
    ...properties[index],
    ...req.body,
    id: properties[index].id, // Prevent ID changes
    ownerId: properties[index].ownerId, // Prevent ownerId changes
    updatedAt: new Date().toISOString()
  };
  saveProperties(properties);
  res.json(properties[index]);
});

// DELETE /api/properties/:id — delete
router.delete('/:id', authenticate, (req, res) => {
  let properties = getProperties();
  const index = properties.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Property not found.' });
  }

  // Verify ownership
  if (properties[index].ownerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized. You do not own this property.' });
  }

  const deleted = properties.splice(index, 1)[0];
  saveProperties(properties);
  res.json({ message: 'Property deleted.', property: deleted });
});

export default router;
