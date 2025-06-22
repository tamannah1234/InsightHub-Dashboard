// simple router that streams Data/data.json
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

const DATA_PATH = path.join(__dirname, '..', '..', 'Data', 'data.json');

router.get('/', (_req, res) => {
  fs.readFile(DATA_PATH, 'utf8', (err, json) => {
    if (err) return res.status(500).json({ error: 'Cannot read data file' });
    res.json(JSON.parse(json));
  });
});

module.exports = router;
