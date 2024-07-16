const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from 'reg' directory
app.use('/reg', express.static(path.join(__dirname, 'reg')));

// Path to your credentials JSON file
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const SPREADSHEET_ID = '1v4QSvfRHzAPuh4xVoO6ubkIvjSPg9d7dKeRHaiaL7xg'; // Update with your SPREADSHEET_ID

const auth = new google.auth.GoogleAuth({
  keyFile: CREDENTIALS_PATH,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Handle user registration and save to Google Sheet
app.post('/register', async (req, res) => {
  const { user_name, password, email } = req.body;
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'USER_DATA!A:C',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[user_name, password, email]],
      },
    });

    console.log('Registered user:', user_name);
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Handle login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'USER_DATA!A:B',
    });

    const rows = response.data.values;
    const user = rows.find(row => row[0] === username && row[1] === password);

    if (user) {
      res.json({ status: 'ok' });
    } else {
      res.json({ status: 'no' });
    }
  } catch (error) {
    console.error('Error accessing Google Sheets:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to serve GET requests to '/'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
