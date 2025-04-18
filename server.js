import express from 'express';
import path from 'path';
import axios from 'axios';
import pkg from 'pg';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { Pool } = pkg;

// Required to use __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// PostgreSQL Connection
const pool = new Pool({
  user: 'u3m7grklvtlo6',
  host: '35.209.89.182',
  database: 'dbzvtfeophlfnr',
  password: 'AekAds@24',
  port: 5432,
});

// Firebase Admin Init
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://aekads-88e11-default-rtdb.firebaseio.com/"
});
const db = admin.database();

// Express Config
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Scraper
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
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : '';
      };

      const getScores = () => {
        const teams = document.querySelectorAll('div.d-flex.justify-content-center.text-white div.p-2');
        const filteredScores = Array.from(teams)
          .map(team => {
            const teamName = team.querySelector('span.score-name')?.innerText.trim() || '';
            const score = team.querySelector('h3')?.innerText.trim().split(' ')[0] || '';
            return { team: teamName, score };
          })
          .filter(item => item.team !== '' && item.score !== '');

        return filteredScores.map(item => ({ ...item }));
      };

      const getBatters = () => {
        const rows = document.querySelectorAll('.live-batsman:nth-of-type(1)  tbody tr');
        return Array.from(rows).map(row => {
          const cols = row.querySelectorAll('td');
          if (cols.length < 6) return null;
          const playerNameRaw = cols[0].innerText.trim();
          const isStriker = playerNameRaw.includes('*') ? '1' : '0';
          const name = playerNameRaw.replace(/[\.]/g, '').trim();
          return {
            name,
            runs: cols[1].innerText.trim(),
            balls: cols[2].innerText.trim(),
            fours: cols[3].innerText.trim(),
            sixes: cols[4].innerText.trim(),
            strikeRate: cols[5].innerText.trim(),
            isStriker
          };
        }).filter(item => item !== null);
      };

      const getBowlers = () => {
        const rows = document.querySelectorAll('.live-batsman:nth-of-type(2) tbody tr');
        return Array.from(rows).map(row => {
          const cols = row.querySelectorAll('td');
          if (cols.length < 6) return null;
          return {
            name: cols[0].innerText.trim(),
            overs: cols[1].innerText.trim(),
            maidens: cols[2].innerText.trim(),
            runs: cols[3].innerText.trim(),
            wickets: cols[4].innerText.trim(),
            economy: cols[5].innerText.trim()
          };
        }).filter(item => item !== null);
      };

      const getLastOver = () => {
        const overElement = document.querySelector('.live-batsman-ball.ball-run ul');
        return overElement ? overElement.innerText.replace(/\s+/g, ' ').trim() : '';
      };

      return {
        matchTitle: getText('li.active'),
        matchStatus: getText('.winning-run p'),
        currentScore: getScores(),
        batters: getBatters(),
        bowlers: getBowlers(),
        lastOver: getLastOver(),
        lastUpdated: new Date().toISOString()
      };
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

// Routes
app.get('/', (req, res) => {
  res.render('match-details');
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

app.get('/api/live-match', async (req, res) => {
  try {
    const snapshot = await db.ref('Livematch/nmpl_2025_26_26th_match').once('value');
    const firebaseData = snapshot.val();

    const result = await pool.query('SELECT index, score FROM code WHERE id = 1');
    const codeData = result.rows[0];

    res.json({ firebaseData, codeData });
  } catch (error) {
    console.error('Error fetching live match data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start Server
pool.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL');
    app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Server running at http://localhost:${process.env.PORT || 3000}`);
    });
  })
  .catch(err => console.error('❌ DB connection error:', err));
