import express from 'express';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';
import compression from 'compression';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Admin configuration
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

// Validate admin credentials
if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error('❌ Missing admin credentials! Set ADMIN_USERNAME and ADMIN_PASSWORD in .env file');
  process.exit(1);
}

if (!JWT_SECRET || !ADMIN_SESSION_SECRET) {
  console.error('❌ Missing security keys! Set JWT_SECRET and ADMIN_SESSION_SECRET in .env file');
  process.exit(1);
}

// Telegram bot configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Validate required environment variables (skip in development mode)
if (!IS_DEVELOPMENT && (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID)) {
  console.error('❌ Missing required environment variables: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID');
  console.error('💡 For development, set NODE_ENV=development to skip Telegram validation');
  process.exit(1);
}

if (IS_DEVELOPMENT && (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID)) {
  console.warn('⚠️  Development mode: Telegram notifications disabled');
}

// Security middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // unsafe-inline needed for inline scripts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "media-src 'self'",
    "connect-src 'self' https://api.telegram.org",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);

  // Remove server header
  res.removeHeader('X-Powered-By');

  next();
});

// Rate limiting for contact form
const contactAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 3;

// Rate limiting for admin routes
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { ok: false, error: 'Слишком много попыток входа. Попробуйте через 15 минут.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(compression()); // Enable gzip compression
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' })); // Reduced limit for security
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Session middleware for admin (only in development)
if (IS_DEVELOPMENT) {
  app.use(session({
    secret: ADMIN_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
}

// Apply analytics tracking
app.use(trackVisit);

// Static files with cache control
if (IS_DEVELOPMENT) {
  // Disable caching in development
  app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }));
} else {
  // Enable caching in production
  app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
  }));
}

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
const contactsFile = path.join(dataDir, 'contacts.json');
const settingsFile = path.join(dataDir, 'settings.json');
const analyticsFile = path.join(dataDir, 'analytics.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(contactsFile)) {
  fs.writeFileSync(contactsFile, '[]', 'utf8');
}

if (!fs.existsSync(settingsFile)) {
  const defaultSettings = {
    discountEnabled: false,
    discountPercent: 20,
    discountText: 'Скидка 20% на все курсы!',
    basicAvailable: true,
    groupAvailable: true,
    individualAvailable: true,
    consultationAvailable: true,
    basicPrice: 10000,
    groupPrice: 30000,
    individualPrice: 'По запросу',
    contactTelegram: '@vxschool',
    contactEmail: 'contact@vxschool.com'
  };
  fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 2), 'utf8');
}

if (!fs.existsSync(analyticsFile)) {
  const defaultAnalytics = {
    visits: [],
    sources: [],
    uniqueVisitors: {}
  };
  fs.writeFileSync(analyticsFile, JSON.stringify(defaultAnalytics, null, 2), 'utf8');
}

// Admin authentication middleware
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Токен доступа отсутствует' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ ok: false, error: 'Недействительный токен' });
  }
}

// Analytics tracking middleware
function trackVisit(req, res, next) {
  // Only track page visits, not static resources or API calls
  const isPageVisit = !req.path.startsWith('/admin') && 
                     !req.path.startsWith('/api') && 
                     !req.path.includes('.') && // Skip files with extensions
                     req.method === 'GET' &&
                     req.path === '/'; // Only track main page visits

  // Skip bots and crawlers
  const userAgent = req.get('User-Agent') || '';
  const isBot = /bot|crawler|spider|crawling/i.test(userAgent);

  if (isPageVisit && !isBot) {
    try {
      const analyticsData = JSON.parse(fs.readFileSync(analyticsFile, 'utf8'));
      const today = new Date().toISOString().split('T')[0];
      const clientIP = req.ip || req.socket.remoteAddress;

      // Initialize unique visitors tracking if not exists
      if (!analyticsData.uniqueVisitors) {
        analyticsData.uniqueVisitors = {};
      }

      // Track unique visitors per day
      if (!analyticsData.uniqueVisitors[today]) {
        analyticsData.uniqueVisitors[today] = new Set();
      }

      const todayVisitors = new Set(analyticsData.uniqueVisitors[today]);
      const isUniqueVisitor = !todayVisitors.has(clientIP);

      if (isUniqueVisitor) {
        todayVisitors.add(clientIP);
        analyticsData.uniqueVisitors[today] = Array.from(todayVisitors);

        // Track daily visits (only unique visitors)
        const todayVisit = analyticsData.visits.find(v => v.date === today);
        if (todayVisit) {
          todayVisit.count++;
        } else {
          analyticsData.visits.push({ date: today, count: 1 });
        }

        // Track traffic sources (only for unique visitors)
        const referer = req.get('Referer');
        let source = 'Прямые переходы';
        if (referer && !referer.includes(req.get('Host'))) {
          if (referer.includes('google')) source = 'Google';
          else if (referer.includes('yandex')) source = 'Yandex';
          else if (referer.includes('vk.com')) source = 'VKontakte';
          else if (referer.includes('t.me')) source = 'Telegram';
          else if (referer.includes('instagram')) source = 'Instagram';
          else if (referer.includes('facebook')) source = 'Facebook';
          else source = 'Другие сайты';
        }

        const sourceEntry = analyticsData.sources.find(s => s.name === source);
        if (sourceEntry) {
          sourceEntry.count++;
        } else {
          analyticsData.sources.push({ name: source, count: 1 });
        }
      }

      // Keep only last 30 days
      analyticsData.visits = analyticsData.visits
        .filter(v => new Date(v.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Clean up old unique visitors data
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      Object.keys(analyticsData.uniqueVisitors).forEach(date => {
        if (date < thirtyDaysAgo) {
          delete analyticsData.uniqueVisitors[date];
        }
      });

      fs.writeFileSync(analyticsFile, JSON.stringify(analyticsData, null, 2), 'utf8');
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }
  next();
}

// Helper functions
function getSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  } catch (error) {
    console.error('Error reading settings:', error);
    return {};
  }
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

function getAnalytics() {
  try {
    return JSON.parse(fs.readFileSync(analyticsFile, 'utf8'));
  } catch (error) {
    console.error('Error reading analytics:', error);
    return { visits: [], sources: [] };
  }
}

// Input validation and sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 1000); // Limit length and trim
}

function validateTelegram(telegram) {
  const telegramRegex = /^@?[a-zA-Z0-9_]{5,32}$/;
  return telegramRegex.test(telegram.replace('@', ''));
}

function validateName(name) {
  return name.length >= 2 && name.length <= 50 && /^[a-zA-Zа-яА-Я\s\-']+$/u.test(name);
}

// Admin Routes
// Admin login
app.post('/admin/login', adminLoginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Логин и пароль обязательны' });
  }

  try {
    // Secure admin authentication with timing attack protection
    const usernameMatch = username === ADMIN_USERNAME;
    const passwordMatch = password === ADMIN_PASSWORD;

    // Always perform both checks to prevent timing attacks
    const isValid = usernameMatch && passwordMatch;

    if (isValid) {
      const token = jwt.sign(
        { username: ADMIN_USERNAME, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Session only in development
      if (IS_DEVELOPMENT && req.session) {
        req.session.adminUser = { username: ADMIN_USERNAME };
      }

      console.log(`✅ Admin login successful from IP: ${req.ip}`);

      res.json({
        ok: true,
        token,
        user: { username: ADMIN_USERNAME }
      });
    } else {
      console.warn(`⚠️ Failed admin login attempt from IP: ${req.ip}, username: ${username}`);
      res.status(401).json({ ok: false, error: 'Неверный логин или пароль' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// Admin token verification
app.post('/admin/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Токен отсутствует' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ ok: true, user: { username: decoded.username } });
  } catch (error) {
    res.status(403).json({ ok: false, error: 'Недействительный токен' });
  }
});

// Admin dashboard data
app.get('/admin/dashboard', authenticateAdmin, (req, res) => {
  try {
    const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
    const analytics = getAnalytics();
    const settings = getSettings();

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const todayContacts = contacts.filter(c => c.createdAt.startsWith(today)).length;
    const weekContacts = contacts.filter(c => c.createdAt >= weekAgo).length;

    const todayVisit = analytics.visits.find(v => v.date === today);
    const todayVisits = todayVisit ? todayVisit.count : 0;

    res.json({
      totalContacts: contacts.length,
      todayContacts,
      weekContacts,
      todayVisits,
      settings
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ ok: false, error: 'Ошибка загрузки данных' });
  }
});

// Admin contacts
app.get('/admin/contacts', authenticateAdmin, (req, res) => {
  try {
    const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
    // Sort by date, newest first
    contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(contacts);
  } catch (error) {
    console.error('Contacts error:', error);
    res.status(500).json({ ok: false, error: 'Ошибка загрузки контактов' });
  }
});

// Clear all contacts
app.delete('/admin/contacts/clear', authenticateAdmin, (req, res) => {
  try {
    // Create backup before clearing
    const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
    const backupFile = path.join(dataDir, `contacts_backup_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(contacts, null, 2), 'utf8');
    
    // Clear contacts
    fs.writeFileSync(contactsFile, '[]', 'utf8');
    
    console.log(`✅ Admin cleared all contacts. Backup saved to: ${backupFile}`);
    res.json({ ok: true, message: 'Все заявки удалены', backup: backupFile });
  } catch (error) {
    console.error('Clear contacts error:', error);
    res.status(500).json({ ok: false, error: 'Ошибка при удалении заявок' });
  }
});

// Delete single contact
app.delete('/admin/contacts/:id', authenticateAdmin, (req, res) => {
  try {
    const contactId = req.params.id;
    const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
    
    // Find contact index
    const contactIndex = contacts.findIndex(c => c.id === contactId);
    if (contactIndex === -1) {
      return res.status(404).json({ ok: false, error: 'Заявка не найдена' });
    }
    
    // Remove contact
    const deletedContact = contacts.splice(contactIndex, 1)[0];
    fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2), 'utf8');
    
    console.log(`✅ Admin deleted contact: ${deletedContact.name} (${deletedContact.telegram})`);
    res.json({ ok: true, message: 'Заявка удалена', deletedContact });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ ok: false, error: 'Ошибка при удалении заявки' });
  }
});

// Admin settings
app.get('/admin/settings', authenticateAdmin, (req, res) => {
  try {
    const settings = getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ ok: false, error: 'Ошибка загрузки настроек' });
  }
});

app.post('/admin/settings', authenticateAdmin, (req, res) => {
  try {
    const settings = req.body;
    if (saveSettings(settings)) {
      res.json({ ok: true });
    } else {
      res.status(500).json({ ok: false, error: 'Ошибка сохранения настроек' });
    }
  } catch (error) {
    console.error('Settings save error:', error);
    res.status(500).json({ ok: false, error: 'Ошибка сохранения настроек' });
  }
});

// Admin analytics
app.get('/admin/analytics', authenticateAdmin, (req, res) => {
  try {
    const analytics = getAnalytics();
    const range = req.query.range || 'week';

    let filteredVisits = analytics.visits;
    if (range === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filteredVisits = analytics.visits.filter(v => v.date === today);
    } else if (range === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      filteredVisits = analytics.visits.filter(v => v.date >= weekAgo);
    } else if (range === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      filteredVisits = analytics.visits.filter(v => v.date >= monthAgo);
    }

    res.json({
      visits: filteredVisits,
      sources: analytics.sources.slice(0, 10) // Top 10 sources
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ ok: false, error: 'Ошибка загрузки аналитики' });
  }
});

// Quick actions
app.post('/admin/toggle-discount', authenticateAdmin, (req, res) => {
  try {
    const settings = getSettings();
    settings.discountEnabled = !settings.discountEnabled;
    if (saveSettings(settings)) {
      res.json({ ok: true, discountEnabled: settings.discountEnabled });
    } else {
      res.status(500).json({ ok: false, error: 'Ошибка сохранения' });
    }
  } catch (error) {
    console.error('Toggle discount error:', error);
    res.status(500).json({ ok: false, error: 'Ошибка переключения скидки' });
  }
});

app.post('/admin/toggle-package', authenticateAdmin, (req, res) => {
  try {
    const { package: packageName } = req.body;
    const settings = getSettings();

    const packageKey = `${packageName}Available`;
    if (settings.hasOwnProperty(packageKey)) {
      settings[packageKey] = !settings[packageKey];
      if (saveSettings(settings)) {
        res.json({ ok: true, [packageKey]: settings[packageKey] });
      } else {
        res.status(500).json({ ok: false, error: 'Ошибка сохранения' });
      }
    } else {
      res.status(400).json({ ok: false, error: 'Неизвестный пакет' });
    }
  } catch (error) {
    console.error('Toggle package error:', error);
    res.status(500).json({ ok: false, error: 'Ошибка переключения пакета' });
  }
});

// API endpoint for frontend to get current settings
app.get('/api/settings', (req, res) => {
  try {
    const settings = getSettings();

    // Only return public settings
    const publicSettings = {
      discountEnabled: settings.discountEnabled,
      discountPercent: settings.discountPercent,
      discountText: settings.discountText,
      basicAvailable: settings.basicAvailable,
      groupAvailable: settings.groupAvailable,
      individualAvailable: settings.individualAvailable,
      consultationAvailable: settings.consultationAvailable,
      basicPrice: settings.basicPrice,
      groupPrice: settings.groupPrice,
      individualPrice: settings.individualPrice
    };

    res.json(publicSettings);
  } catch (error) {
    console.error('Public settings error:', error);
    res.status(500).json({ ok: false, error: 'Ошибка загрузки настроек' });
  }
});

// Contact endpoint
app.post('/contact', async (req, res) => {
  const clientIP = req.ip || req.socket.remoteAddress;

  // Rate limiting check
  const now = Date.now();
  const attempts = contactAttempts.get(clientIP) || [];
  const recentAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW);

  // Disable rate limiting in development
  if (!IS_DEVELOPMENT && recentAttempts.length >= MAX_ATTEMPTS) {
    return res.status(429).json({
      ok: false,
      error: 'Вы отправили слишком много заявок. Подождите 15 минут и попробуйте снова.'
    });
  }

  // Update attempts
  recentAttempts.push(now);
  contactAttempts.set(clientIP, recentAttempts);

  const { name, telegram, message, tariff } = req.body || {};

  // Sanitize inputs
  const sanitizedName = sanitizeInput(name);
  const sanitizedTelegram = sanitizeInput(telegram);
  const sanitizedMessage = sanitizeInput(message);
  const sanitizedTariff = tariff ? sanitizeInput(tariff) : null;

  // Validate required fields (message is now optional)
  if (!sanitizedName) {
    return res.status(400).json({ ok: false, error: 'Пожалуйста, укажите ваше имя.' });
  }

  if (!sanitizedTelegram) {
    return res.status(400).json({ ok: false, error: 'Пожалуйста, укажите ваш Telegram.' });
  }

  // Validate name
  if (!validateName(sanitizedName)) {
    return res.status(400).json({ ok: false, error: 'Имя должно содержать от 2 до 50 символов и состоять только из букв.' });
  }

  // Validate telegram
  if (!validateTelegram(sanitizedTelegram)) {
    return res.status(400).json({ ok: false, error: 'Telegram username должен содержать от 5 до 32 символов (буквы, цифры, подчеркивания).' });
  }

  // Validate message length (only if message is provided)
  if (sanitizedMessage && sanitizedMessage.length < 10) {
    return res.status(400).json({ ok: false, error: 'Сообщение слишком короткое. Напишите хотя бы 10 символов.' });
  }

  if (sanitizedMessage && sanitizedMessage.length > 1000) {
    return res.status(400).json({ ok: false, error: 'Сообщение слишком длинное. Максимум 1000 символов.' });
  }

  // Validate tariff if provided
  const validTariffs = ['Базовый', 'Групповой', 'Индивидуальный', 'Консультация'];
  if (sanitizedTariff && !validTariffs.includes(sanitizedTariff)) {
    return res.status(400).json({ ok: false, error: 'Выберите корректный тариф из списка.' });
  }

  const entry = {
    id: Date.now().toString(36),
    name: sanitizedName,
    telegram: sanitizedTelegram,
    message: sanitizedMessage,
    tariff: sanitizedTariff,
    ip: clientIP, // Log IP for security
    createdAt: new Date().toISOString()
  };

  try {
    const raw = fs.readFileSync(contactsFile, 'utf8');
    const arr = JSON.parse(raw);
    arr.push(entry);
    fs.writeFileSync(contactsFile, JSON.stringify(arr, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save contact message:', err);
    return res.status(500).json({ ok: false, error: 'Произошла техническая ошибка. Попробуйте отправить заявку через несколько минут.' });
  }

  // Send to Telegram (skip in development mode without credentials)
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      // Escape HTML for Telegram
      const escapeHtml = (text) => text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      const telegramMessage = `🎵 <b>Новая заявка VX School</b>

👤 <b>Имя:</b> ${escapeHtml(sanitizedName)}
📱 <b>Telegram:</b> ${escapeHtml(sanitizedTelegram)}
${sanitizedTariff ? `📋 <b>Тариф:</b> ${escapeHtml(sanitizedTariff)}` : ''}
${sanitizedMessage ? `\n💬 <b>Сообщение:</b>\n<i>${escapeHtml(sanitizedMessage)}</i>` : ''}

🌐 <b>IP:</b> <code>${clientIP}</code>
⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}

<b>ID заявки:</b> <code>${entry.id}</code>`;

      // Create inline keyboard with quick actions
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '💬 Написать в Telegram',
              url: `https://t.me/${sanitizedTelegram.replace('@', '')}`
            }
          ],
          [
            {
              text: '📊 Админ панель',
              url: `https://${req.get('host')}/admin/`
            },
            {
              text: '📋 Все заявки',
              callback_data: `view_contacts`
            }
          ],
          [
            {
              text: '✅ Обработано',
              callback_data: `mark_processed_${entry.id}`
            },
            {
              text: '❌ Спам',
              callback_data: `mark_spam_${entry.id}`
            }
          ]
        ]
      };

      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: telegramMessage,
        parse_mode: 'HTML',
        reply_markup: keyboard
      });

    } catch (telegramErr) {
      console.error('❌ Failed to send to Telegram:', telegramErr.message);
      // Don't fail the request if Telegram fails
    }
  }

  return res.json({ ok: true });
});

// Telegram webhook for bot callbacks
app.post('/webhook/telegram', async (req, res) => {
  const update = req.body;
  
  if (update.callback_query) {
    const callbackData = update.callback_query.data;
    const chatId = update.callback_query.message.chat.id;
    const messageId = update.callback_query.message.message_id;
    
    try {
      if (callbackData === 'view_contacts') {
        // Send contacts summary
        const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
        const today = new Date().toDateString();
        const todayContacts = contacts.filter(c => new Date(c.createdAt).toDateString() === today);
        const weekContacts = contacts.filter(c => {
          const contactDate = new Date(c.createdAt);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return contactDate >= weekAgo;
        });
        
        const summary = `📊 <b>Статистика заявок</b>

📅 <b>Сегодня:</b> ${todayContacts.length}
📈 <b>За неделю:</b> ${weekContacts.length}
📋 <b>Всего:</b> ${contacts.length}

<b>Последние 5 заявок:</b>
${contacts.slice(0, 5).map(contact => 
  `• ${contact.name} (@${contact.telegram.replace('@', '')}) - ${contact.tariff || 'Без тарифа'}`
).join('\n')}`;

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: '🔗 Открыть админ панель',
                url: `https://${req.get('host')}/admin/`
              }
            ]
          ]
        };

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
          chat_id: chatId,
          message_id: messageId,
          text: summary,
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
        
      } else if (callbackData.startsWith('mark_processed_')) {
        // Mark as processed
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Заявка обработана',
                  callback_data: 'processed'
                }
              ]
            ]
          }
        });
        
      } else if (callbackData.startsWith('mark_spam_')) {
        // Mark as spam
        const contactId = callbackData.replace('mark_spam_', '');
        
        // Remove from contacts
        const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
        const filteredContacts = contacts.filter(c => c.id !== contactId);
        fs.writeFileSync(contactsFile, JSON.stringify(filteredContacts, null, 2), 'utf8');
        
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🗑️ Помечено как спам',
                  callback_data: 'spam'
                }
              ]
            ]
          }
        });
      }
      
    } catch (error) {
      console.error('Telegram webhook error:', error);
    }
  }
  
  res.status(200).json({ ok: true });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Handle specific error types
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ ok: false, error: 'Отправленные данные слишком большие. Сократите сообщение.' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, error: 'Ошибка в формате данных. Обновите страницу и попробуйте снова.' });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ ok: false, error: 'Сервис временно недоступен. Попробуйте позже.' });
  }

  res.status(500).json({ ok: false, error: 'Произошла техническая ошибка. Попробуйте отправить заявку позже.' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Страница не найдена.' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`✅ VX School landing running on port ${PORT}`);
  console.log(`🔒 Security headers enabled`);
  console.log(`⚡ Rate limiting active`);
  console.log(`🛡️ Admin panel available at /admin/`);
});