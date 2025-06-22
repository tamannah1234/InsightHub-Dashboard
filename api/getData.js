// api/getData.js

import { readFileSync } from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'Data', 'data.json');
    const jsonStr = readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(jsonStr);
  } catch (err) {
    console.error('getData error:', err);
    res.status(500).json({ error: 'Unable to load data' });
  }
}
