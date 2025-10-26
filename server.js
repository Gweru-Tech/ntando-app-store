const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Data file path
const DATA_DIR = path.join(__dirname, 'data');
const APPS_FILE = path.join(DATA_DIR, 'apps.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(APPS_FILE)) {
  fs.writeFileSync(APPS_FILE, JSON.stringify([]));
}

// Helper functions for file operations
const readApps = () => {
  try {
    const data = fs.readFileSync(APPS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading apps:', error);
    return [];
  }
};

const writeApps = (apps) => {
  try {
    fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing apps:', error);
    return false;
  }
};

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'ntando-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
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
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed' });
    } else {
      res.json({ success: true });
    }
  });
});

// Check auth status
app.get('/api/check-auth', (req, res) => {
  res.json({ isAdmin: req.session.isAdmin || false });
});

// Get all apps (public)
app.get('/api/apps', (req, res) => {
  try {
    const apps = readApps();
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

    const apps = readApps();
    const newApp = {
      id: Date.now().toString(),
      name: name.trim(),
      icon: icon || 'https://via.placeholder.com/150?text=App',
      downloadLink: downloadLink.trim(),
      addedAt: new Date().toISOString()
    };

    apps.push(newApp);
    
    if (writeApps(apps)) {
      res.json(newApp);
    } else {
      res.status(500).json({ error: 'Failed to save app' });
    }
  } catch (error) {
    console.error('Error adding app:', error);
    res.status(500).json({ error: 'Failed to add app' });
  }
});

// Delete app (admin only)
app.delete('/api/apps/:id', requireAuth, (req, res) => {
  try {
    const apps = readApps();
    const filteredApps = apps.filter(app => app.id !== req.params.id);
    
    if (writeApps(filteredApps)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to delete app' });
    }
  } catch (error) {
    console.error('Error deleting app:', error);
    res.status(500).json({ error: 'Failed to delete app' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`Apps file: ${APPS_FILE}`);
});
