import express from 'express';
import path from 'path';
import axios from 'axios'; // ✅ Import axios
import { Pool } from 'pg';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer';
import admin from 'firebase-admin';

const app = express();
const PORT = process.env.PORT || 3000;

// Firebase Init
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://aekads-88e11-default-rtdb.firebaseio.com/"
});

const db = admin.database();

// DB Connection
const pool = new Pool({
  user: 'u3m7grklvtlo6',
  host: '35.209.89.182',
  database: 'dbzvtfeophlfnr',
  password: 'AekAds@24',
  port: 5432,
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Scrape and push data
async function scrapeAndPush() {
  const id1Result = await pool.query('SELECT url FROM code WHERE id = 1');
  const url = `https://www.cricketmazza.com/live/${id1Result.rows[0].url}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });
    await page.waitForSelector('li.active', { timeout: 5000 });

    const data = await page.evaluate(() => {
      // Extract data logic remains unchanged
    });

    const ref = db.ref('Livematch/nmpl_2025_26_26th_match');
    await ref.set(data);
  } catch (error) {
    console.error('❌ Scraping Error:', error.message);
  } finally {
    await browser.close();
  }
}

scrapeAndPush();
setInterval(scrapeAndPush, 10000);

app.get('/', (req, res) => {
  res.render('match-details');
});

app.post('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { url, index, score } = req.body;
  try {
    await pool.query('UPDATE code SET url = $1, index = $2, score = $3 WHERE id = $4', [url, index, score, id]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.send('Error updating data');
  }
});

app.get('/dhvanil', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM code ORDER BY id ASC');
    res.render('code_form', { codes: result.rows });
  } catch (err) {
    console.error(err);
    res.send('Error fetching data');
  }
});

app.get('/api/live-match', async (req, res) => {
  try {
    const snapshot = await db.ref('Livematch/nmpl_2025_26_26th_match').once('value');
    const firebaseData = snapshot.val();

    const result = await pool.query('SELECT index, score FROM code WHERE id = 1');
    const codeData = result.rows[0];

    const responseData = { firebaseData, codeData };
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching live match data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
pool.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('❌ DB connection error:', err));
