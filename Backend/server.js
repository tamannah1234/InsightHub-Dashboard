const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = 5000;

/* middleware */
app.use(cors());
app.use(express.json());

/* static frontend */
const PUBLIC_DIR = path.join(__dirname, '..', 'Public');
app.use(express.static(PUBLIC_DIR));

/* api route */
const dataRoute = require('./routes/dataRoutes');
app.use('/api/data', dataRoute);

/* start */
app.listen(PORT, () => {
  console.log(`🚀 InsightHub running on http://localhost:${PORT}`);
});
