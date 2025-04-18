

const path = require('path');
const axios = require("axios"); // ✅ Import axios

const { Pool } = require('pg');



const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

// Later in your code
const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath || '/usr/bin/google-chrome',
  headless: chromium.headless,
  ignoreHTTPSErrors: true
});



// DB Connection
const pool = new Pool({
  user: 'u3m7grklvtlo6',
  host: '35.209.89.182',
  database: 'dbzvtfeophlfnr',
  password: 'AekAds@24',
  port: 5432,
});

// Middleware





const admin = require('firebase-admin');
// Convert the environment variable back to a JSON object
const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
// Firebase Init
// const serviceAccount = require('./firebaseKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://aekads-88e11-default-rtdb.firebaseio.com/"
});
const db = admin.database();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public')); // Optional static folder for CSS/JS

const PORT = process.env.PORT || 3000;

async function scrapeAndPush() {


 // Directly query the row with id = 1
const id1Result = await pool.query('SELECT url FROM code WHERE id = 1');

// Extract the URL from the query result
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
        
        // Extract data and remove empty entries
        const filteredScores = Array.from(teams)
          .map(team => {
            const teamName = team.querySelector('span.score-name')?.innerText.trim() || '';
            const score = team.querySelector('h3')?.innerText.trim().split(' ')[0] || '';
            return { team: teamName, score };
          })
          .filter(item => item.team !== '' && item.score !== ''); // Remove empty entries
      
        // Reassign indexes to keep continuous order
        const reorderedScores = filteredScores.map(item=> ({
          // id: index + 1, // Ensure IDs are sequential starting from 1
          ...item
        }));
      
        return reorderedScores;
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

// Run scraper every 10 seconds
scrapeAndPush();
setInterval(scrapeAndPush, 10000);

// Route: Render EJS Page
app.get('/', (req, res) => {
  res.render('match-details'); // Renders views/match-details.ejs
});

// Route: Render EJS Page

// POST - update entry
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
    // Fetch data from Firebase
    const snapshot = await db.ref('Livematch/nmpl_2025_26_26th_match').once('value');
    const firebaseData = snapshot.val();

    // Fetch data from PostgreSQL
    const result = await pool.query('SELECT index, score FROM code WHERE id = 1');
    const codeData = result.rows[0]; // Assuming id = 1 exists

    // Combine both Firebase and PostgreSQL data in one response
    const responseData = {
      firebaseData,
      codeData
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching live match data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Connect DB then start server
pool.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('❌ DB connection error:', err));