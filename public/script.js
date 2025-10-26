const API_URL = '/api/apps';

// Load apps on page load
document.addEventListener('DOMContentLoaded', () => {
    loadApps();
});

// Load and display apps
async function loadApps() {
    try {
        const response = await fetch(API_URL);
        const apps = await response.json();
        
        const appsGrid = document.getElementById('appsGrid');
        
        if (apps.length === 0) {
            appsGrid.innerHTML = '<p class="no-apps">No apps available yet.</p>';
            return;
        }
        
        appsGrid.innerHTML = apps.map(app => `
            <div class="app-card">
                <img src="${app.icon}" alt="${app.name}" class="app-icon" onerror="this.src='https://via.placeholder.com/150?text=App'">
                <div class="app-name">${app.name}</div>
                <div class="app-actions">
                    <a href="${app.downloadLink}" class="download-btn" target="_blank">Download</a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('appsGrid').innerHTML = '<p class="loading">Error loading apps</p>';
    }
}
