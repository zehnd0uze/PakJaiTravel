import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../data/properties.json');

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
router.post('/', (req, res) => {
  const properties = getProperties();
  const newProperty = {
    id: 'cd-' + Date.now(),
    ...req.body,
    status: req.body.status || 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  properties.push(newProperty);
  saveProperties(properties);
  res.status(201).json(newProperty);
});

// PUT /api/properties/:id — update
router.put('/:id', (req, res) => {
  const properties = getProperties();
  const index = properties.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Property not found.' });
  }
  properties[index] = {
    ...properties[index],
    ...req.body,
    id: properties[index].id, // Prevent ID changes
    updatedAt: new Date().toISOString()
  };
  saveProperties(properties);
  res.json(properties[index]);
});

// DELETE /api/properties/:id — delete
router.delete('/:id', (req, res) => {
  let properties = getProperties();
  const index = properties.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Property not found.' });
  }
  const deleted = properties.splice(index, 1)[0];
  saveProperties(properties);
  res.json({ message: 'Property deleted.', property: deleted });
});

export default router;
