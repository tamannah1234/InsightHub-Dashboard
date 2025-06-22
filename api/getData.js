// api/getData.js   – CommonJS version
const fs   = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'Data', 'data.json');
    const jsonStr  = fs.readFileSync(filePath, 'utf8');

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(jsonStr);
  } catch (err) {
    console.error('getData error:', err);
    res.status(500).json({ error: 'Unable to load data' });
  }
};
