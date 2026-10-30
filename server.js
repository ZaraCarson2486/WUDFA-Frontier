require('dotenv').config();
const express = require('express');
const db = require('./db');
const app = express();
app.use(express.json());
app.use(express.static('public'));
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ server: 'ok', database: 'ok', result: rows[0].result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ server: 'ok', database: 'failed' });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));