const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite database
const db = new Database('apps.db');

// Create apps table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT,
    downloadLink TEXT NOT NULL,
    addedAt TEXT NOT NULL
  )
`);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: 'ntando-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Admin credentials
const ADMIN_USERNAME = 'Ntando';
const ADMIN_PASSWORD = 'Ntando';

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check auth status
app.get('/api/check-auth', (req, res) => {
  res.json({ isAdmin: req.session.isAdmin || false });
});

// Get all apps (public)
app.get('/api/apps', (req, res) => {
  try {
    const apps = db.prepare('SELECT * FROM apps ORDER BY addedAt DESC').all();
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read apps' });
  }
});

// Add new app (admin only)
app.post('/api/apps', requireAuth, (req, res) => {
  try {
    const { name, icon, downloadLink } = req.body;
    
    if (!name || !downloadLink) {
      return res.status(400).json({ error: 'Name and download link are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO apps (name, icon, downloadLink, addedAt)
      VALUES (?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      name,
      icon || 'https://via.placeholder.com/150?text=App',
      downloadLink,
      new Date().toISOString()
    );

    const newApp = db.prepare('SELECT * FROM apps WHERE id = ?').get(info.lastInsertRowid);
    res.json(newApp);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add app' });
  }
});

// Delete app (admin only)
app.delete('/api/apps/:id', requireAuth, (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM apps WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete app' });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
