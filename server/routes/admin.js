import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
const TRAFFIC_FILE = path.join(__dirname, '../data/traffic.json');

// GET /api/admin/traffic
router.get('/traffic', (req, res) => {
  try {
    if (!fs.existsSync(TRAFFIC_FILE)) {
      return res.json({ active5m: 0, total24h: 0, chartData: [] });
    }
    
    const traffic = JSON.parse(fs.readFileSync(TRAFFIC_FILE, 'utf8') || '[]');
    const now = Date.now();
    
    const fiveMinsAgo = now - (5 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Active users (unique IPs in last 5 mins)
    const activeIps = new Set(
      traffic.filter(t => t.ts > fiveMinsAgo).map(t => t.ip)
    );

    // Total hits in 24h
    const hits24h = traffic.filter(t => t.ts > oneDayAgo);
    const totalHits = hits24h.length;

    // Aggregate into 24 hourly buckets
    const chartData = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = now - (i * 60 * 60 * 1000);
      const hourEnd = now - ((i - 1) * 60 * 60 * 1000);
      const hourLabel = new Date(hourStart).getHours() + ":00";
      
      const count = hits24h.filter(t => t.ts >= hourStart && t.ts < hourEnd).length;
      chartData.push({ label: hourLabel, value: count });
    }

    res.json({
      active5m: activeIps.size,
      total24h: totalHits,
      chartData: chartData,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch traffic stats' });
  }
});

export default router;
