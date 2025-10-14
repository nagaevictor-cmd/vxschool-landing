// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
        this.loadDashboard();
    }

    checkAuth() {
        const token = localStorage.getItem('adminToken');
        if (token) {
            this.verifyToken(token);
        }
    }

    async verifyToken(token) {
        try {
            const response = await fetch('/admin/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.isAuthenticated = true;
                this.currentUser = data.user;
                this.showAdminPanel();
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            this.showLogin();
        }
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Navigation
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchSection(e.target.dataset.section));
        });

        // Settings checkboxes
        const settingsInputs = document.querySelectorAll('#settings input');
        settingsInputs.forEach(input => {
            input.addEventListener('change', () => this.updateSettingsPreview());
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        try {
            const response = await fetch('/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.token);
                this.isAuthenticated = true;
                this.currentUser = data.user;
                this.showAdminPanel();
                errorDiv.style.display = 'none';
            } else {
                errorDiv.textContent = data.error || 'Ошибка входа';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Ошибка соединения с сервером';
            errorDiv.style.display = 'block';
        }
    }

    handleLogout() {
        localStorage.removeItem('adminToken');
        this.isAuthenticated = false;
        this.currentUser = null;
        this.showLogin();
    }

    showLogin() {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
    }

    showAdminPanel() {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'flex';
        document.getElementById('adminUser').textContent = this.currentUser?.username || 'Admin';
        this.loadDashboard();
    }

    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        document.getElementById(sectionName).classList.add('active');

        // Load section data
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'contacts':
                this.loadContacts();
                break;
            case 'settings':
                this.loadSettings();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }

    async loadDashboard() {
        try {
            const response = await fetch('/admin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateDashboardStats(data);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
    }

    updateDashboardStats(data) {
        document.getElementById('totalContacts').textContent = data.totalContacts || 0;
        document.getElementById('todayContacts').textContent = data.todayContacts || 0;
        document.getElementById('weekContacts').textContent = data.weekContacts || 0;
        document.getElementById('todayVisits').textContent = data.todayVisits || 0;

        // Update quick action buttons
        this.updateQuickActionButtons(data.settings);
    }

    updateQuickActionButtons(settings) {
        const discountBtn = document.getElementById('discountStatus');
        const basicBtn = document.getElementById('basicStatus');
        const groupBtn = document.getElementById('groupStatus');
        const individualBtn = document.getElementById('individualStatus');

        if (settings) {
            discountBtn.textContent = settings.discountEnabled ? 'Отключить скидку' : 'Включить скидку';
            basicBtn.textContent = settings.basicAvailable ? 'Отключить Базовый' : 'Включить Базовый';
            groupBtn.textContent = settings.groupAvailable ? 'Отключить Групповой' : 'Включить Групповой';
            individualBtn.textContent = settings.individualAvailable ? 'Отключить Индивидуальный' : 'Включить Индивидуальный';
        }
    }

    async loadContacts() {
        try {
            const response = await fetch('/admin/contacts', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const contacts = await response.json();
                this.renderContactsTable(contacts);
            }
        } catch (error) {
            console.error('Failed to load contacts:', error);
        }
    }

    renderContactsTable(contacts) {
        this.allContacts = contacts; // Store all contacts for filtering
        this.filteredContacts = contacts; // Store filtered contacts
        this.updateContactsTable();
    }

    updateContactsTable() {
        const tbody = document.getElementById('contactsTableBody');
        tbody.innerHTML = '';

        this.filteredContacts.forEach(contact => {
            const row = document.createElement('tr');
            const date = new Date(contact.createdAt).toLocaleString('ru-RU');
            
            row.innerHTML = `
                <td>${date}</td>
                <td>${this.escapeHtml(contact.name)}</td>
                <td>${this.escapeHtml(contact.telegram)}</td>
                <td>${contact.tariff || '-'}</td>
                <td>${contact.message ? this.escapeHtml(contact.message.substring(0, 50)) + '...' : '-'}</td>
                <td>${contact.ip || '-'}</td>
                <td>
                    <div class="contact-actions">
                        <button class="action-btn-small reply-btn" onclick="replyToContact('${contact.telegram}')">Ответить</button>
                        <button class="action-btn-small delete-btn" onclick="deleteContact('${contact.id}')">Удалить</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Update counter
        const countElement = document.getElementById('contactsCount');
        if (countElement) {
            countElement.textContent = `Показано: ${this.filteredContacts.length} из ${this.allContacts.length}`;
        }
    }

    filterContacts() {
        if (!this.allContacts) return;

        const dateFilter = document.getElementById('dateFilter').value;
        const tariffFilter = document.getElementById('tariffFilter').value;
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();

        this.filteredContacts = this.allContacts.filter(contact => {
            // Date filter
            if (dateFilter !== 'all') {
                const contactDate = new Date(contact.createdAt);
                const now = new Date();
                
                switch (dateFilter) {
                    case 'today':
                        if (contactDate.toDateString() !== now.toDateString()) return false;
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        if (contactDate < weekAgo) return false;
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        if (contactDate < monthAgo) return false;
                        break;
                }
            }

            // Tariff filter
            if (tariffFilter !== 'all' && contact.tariff !== tariffFilter) {
                return false;
            }

            // Search filter
            if (searchFilter) {
                const searchText = `${contact.name} ${contact.telegram}`.toLowerCase();
                if (!searchText.includes(searchFilter)) return false;
            }

            return true;
        });

        this.updateContactsTable();
    }

    sortContacts(field) {
        if (!this.filteredContacts) return;

        this.filteredContacts.sort((a, b) => {
            let aVal, bVal;
            
            switch (field) {
                case 'date':
                    aVal = new Date(a.createdAt);
                    bVal = new Date(b.createdAt);
                    break;
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'telegram':
                    aVal = a.telegram.toLowerCase();
                    bVal = b.telegram.toLowerCase();
                    break;
                case 'tariff':
                    aVal = a.tariff || '';
                    bVal = b.tariff || '';
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
            return 0;
        });

        this.updateContactsTable();
    }

    async clearAllContacts() {
        if (!confirm('Вы уверены, что хотите удалить ВСЕ заявки? Это действие нельзя отменить!')) {
            return;
        }

        try {
            const response = await fetch('/admin/contacts/clear', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                this.showSuccessMessage('Все заявки удалены');
                this.loadContacts();
            } else {
                this.showErrorMessage('Ошибка при удалении заявок');
            }
        } catch (error) {
            console.error('Failed to clear contacts:', error);
            this.showErrorMessage('Ошибка соединения с сервером');
        }
    }

    async loadSettings() {
        try {
            const response = await fetch('/admin/settings', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const settings = await response.json();
                this.populateSettingsForm(settings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    populateSettingsForm(settings) {
        // Discount settings
        document.getElementById('discountEnabled').checked = settings.discountEnabled || false;
        document.getElementById('discountPercent').value = settings.discountPercent || '';
        document.getElementById('discountText').value = settings.discountText || '';

        // Package availability
        document.getElementById('basicAvailable').checked = settings.basicAvailable !== false;
        document.getElementById('groupAvailable').checked = settings.groupAvailable !== false;
        document.getElementById('individualAvailable').checked = settings.individualAvailable !== false;
        document.getElementById('consultationAvailable').checked = settings.consultationAvailable !== false;

        // Prices
        document.getElementById('basicPrice').value = settings.basicPrice || 10000;
        document.getElementById('groupPrice').value = settings.groupPrice || 30000;
        document.getElementById('individualPrice').value = settings.individualPrice || 'По запросу';

        // Contact info
        document.getElementById('contactTelegram').value = settings.contactTelegram || '';
        document.getElementById('contactEmail').value = settings.contactEmail || '';
    }

    async saveSettings() {
        const settings = {
            discountEnabled: document.getElementById('discountEnabled').checked,
            discountPercent: parseInt(document.getElementById('discountPercent').value) || 0,
            discountText: document.getElementById('discountText').value,
            basicAvailable: document.getElementById('basicAvailable').checked,
            groupAvailable: document.getElementById('groupAvailable').checked,
            individualAvailable: document.getElementById('individualAvailable').checked,
            consultationAvailable: document.getElementById('consultationAvailable').checked,
            basicPrice: parseInt(document.getElementById('basicPrice').value) || 10000,
            groupPrice: parseInt(document.getElementById('groupPrice').value) || 30000,
            individualPrice: document.getElementById('individualPrice').value || 'По запросу',
            contactTelegram: document.getElementById('contactTelegram').value,
            contactEmail: document.getElementById('contactEmail').value
        };

        try {
            const response = await fetch('/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                this.showSuccessMessage('Настройки сохранены!');
                this.loadDashboard(); // Refresh dashboard
                
                // Refresh main site settings
                if (window.opener && window.opener.settingsIntegration) {
                    window.opener.settingsIntegration.forceRefresh();
                }
            } else {
                this.showErrorMessage('Ошибка сохранения настроек');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Ошибка соединения с сервером');
        }
    }

    async loadAnalytics() {
        const range = document.getElementById('analyticsRange').value;
        
        try {
            const response = await fetch(`/admin/analytics?range=${range}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                const analytics = await response.json();
                this.renderAnalytics(analytics);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    }

    renderAnalytics(analytics) {
        // Simple chart rendering (you can integrate Chart.js later)
        const chartContainer = document.getElementById('visitsChart');
        
        if (analytics.visits.length === 0) {
            chartContainer.innerHTML = '<div class="no-data">Нет данных о посещениях</div>';
        } else {
            const maxVisits = Math.max(...analytics.visits.map(d => d.count));
            chartContainer.innerHTML = `
                <div class="simple-chart">
                    ${analytics.visits.map(day => {
                        const date = new Date(day.date);
                        const shortDate = `${date.getDate()}.${date.getMonth() + 1}`;
                        return `
                            <div class="chart-bar" style="height: ${maxVisits > 0 ? (day.count / maxVisits) * 100 : 10}%">
                                <span class="bar-label">${shortDate}</span>
                                <span class="bar-value">${day.count}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="chart-info">
                    <small>Показаны уникальные посетители за выбранный период</small>
                </div>
            `;
        }

        // Update traffic sources
        const trafficSources = document.getElementById('trafficSources');
        if (analytics.sources.length === 0) {
            trafficSources.innerHTML = '<div class="no-data">Нет данных об источниках трафика</div>';
        } else {
            const totalSources = analytics.sources.reduce((sum, source) => sum + source.count, 0);
            trafficSources.innerHTML = analytics.sources
                .sort((a, b) => b.count - a.count) // Sort by count descending
                .map(source => {
                    const percentage = totalSources > 0 ? Math.round((source.count / totalSources) * 100) : 0;
                    return `
                        <div class="stat-item">
                            <span>${source.name}</span>
                            <span class="stat-value">${source.count} (${percentage}%)</span>
                        </div>
                    `;
                }).join('');
        }
    }

    async toggleDiscount() {
        try {
            const response = await fetch('/admin/toggle-discount', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (response.ok) {
                this.loadDashboard();
            }
        } catch (error) {
            console.error('Failed to toggle discount:', error);
        }
    }

    async togglePackage(packageName) {
        try {
            const response = await fetch('/admin/toggle-package', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ package: packageName })
            });

            if (response.ok) {
                this.loadDashboard();
            }
        } catch (error) {
            console.error('Failed to toggle package:', error);
        }
    }

    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
                <span class="notification-text">${message}</span>
            </div>
        `;

        // Add notification styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    padding: 16px 20px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    z-index: 10000;
                    animation: slideIn 0.3s ease-out;
                    max-width: 300px;
                }
                
                .notification-success {
                    border-left: 4px solid #4CAF50;
                }
                
                .notification-error {
                    border-left: 4px solid #f44336;
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .notification-icon {
                    font-size: 1.2em;
                }
                
                .notification-text {
                    color: #333;
                    font-weight: 500;
                    flex: 1;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global functions for HTML onclick handlers
function saveSettings() {
    window.adminPanel.saveSettings();
}

function refreshContacts() {
    window.adminPanel.loadContacts();
}

function loadAnalytics() {
    window.adminPanel.loadAnalytics();
}

function toggleDiscount() {
    window.adminPanel.toggleDiscount();
}

function togglePackage(packageName) {
    window.adminPanel.togglePackage(packageName);
}

function filterContacts() {
    window.adminPanel.filterContacts();
}

function sortContacts(field) {
    window.adminPanel.sortContacts(field);
}

function clearAllContacts() {
    window.adminPanel.clearAllContacts();
}

function replyToContact(telegram) {
    const telegramUrl = `https://t.me/${telegram.replace('@', '')}`;
    window.open(telegramUrl, '_blank');
}

function deleteContact(contactId) {
    if (confirm('Удалить эту заявку?')) {
        // TODO: Implement individual contact deletion
        window.adminPanel.showErrorMessage('Функция в разработке');
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Add simple chart styles
const chartStyles = `
<style>
.simple-chart {
    display: flex;
    align-items: end;
    justify-content: space-around;
    height: 150px;
    padding: 20px 0;
    gap: 4px;
}

.chart-bar {
    background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
    width: 30px;
    min-height: 10px;
    border-radius: 4px 4px 0 0;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: end;
    align-items: center;
    transition: all 0.3s ease;
}

.chart-bar:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.bar-label {
    position: absolute;
    bottom: -25px;
    font-size: 0.7rem;
    opacity: 0.7;
    white-space: nowrap;
}

.bar-value {
    position: absolute;
    top: -25px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #333;
}

.chart-info {
    text-align: center;
    margin-top: 10px;
    color: #666;
}

.no-data {
    text-align: center;
    color: #999;
    font-style: italic;
    padding: 40px 20px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
}

.stat-item:last-child {
    border-bottom: none;
}

.stat-value {
    font-weight: 600;
    color: #ff6b35;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', chartStyles);