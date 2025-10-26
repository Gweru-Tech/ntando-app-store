const API_URL = '/api/apps';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
});

// Check if user is authenticated
async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (data.isAdmin) {
            showAdminContent();
            loadApps();
        } else {
            showLoginForm();
        }
    } catch (error) {
        showLoginForm();
    }
}

// Show login form
function showLoginForm() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('adminContent').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
}

// Show admin content
function showAdminContent() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'inline-block';
}

// Handle login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            errorElement.textContent = '';
            showAdminContent();
            loadApps();
        } else {
            errorElement.textContent = 'Invalid username or password';
        }
    } catch (error) {
        errorElement.textContent = 'Login failed. Please try again.';
    }
});

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await fetch('/api/logout', { method: 'POST' });
        showLoginForm();
        document.getElementById('loginForm').reset();
    } catch (error) {
        alert('Logout failed');
    }
});

// Handle form submission
document.getElementById('addAppForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('appName').value;
    const icon = document.getElementById('appIcon').value;
    const downloadLink = document.getElementById('downloadLink').value;
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, icon, downloadLink })
        });
        
        if (response.ok) {
            document.getElementById('addAppForm').reset();
            loadApps();
        } else if (response.status === 401) {
            alert('Session expired. Please login again.');
            showLoginForm();
        } else {
            alert('Failed to add app');
        }
    } catch (error) {
        alert('Error adding app');
    }
});

// Load and display apps
async function loadApps() {
    try {
        const response = await fetch(API_URL);
        const apps = await response.json();
        
        const appsGrid = document.getElementById('appsGrid');
        
        if (apps.length === 0) {
            appsGrid.innerHTML = '<p class="no-apps">No apps available yet. Add one above!</p>';
            return;
        }
        
        appsGrid.innerHTML = apps.map(app => `
            <div class="app-card">
                <img src="${app.icon}" alt="${app.name}" class="app-icon" onerror="this.src='https://via.placeholder.com/150?text=App'">
                <div class="app-name">${app.name}</div>
                <div class="app-actions">
                    <a href="${app.downloadLink}" class="download-btn" target="_blank">Download</a>
                    <button class="delete-btn" onclick="deleteApp(${app.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('appsGrid').innerHTML = '<p class="loading">Error loading apps</p>';
    }
}

// Delete app
async function deleteApp(id) {
    if (!confirm('Are you sure you want to delete this app?')) {
        return;
    }
    
    try {
        const response = await fetch(`$${API_URL}/$$ {id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadApps();
        } else if (response.status === 401) {
            alert('Session expired. Please login again.');
            showLoginForm();
        } else {
            alert('Failed to delete app');
        }
    } catch (error) {
        alert('Error deleting app');
    }
}
