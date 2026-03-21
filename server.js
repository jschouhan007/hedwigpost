const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_VERCEL = process.env.VERCEL || process.env.VERCEL_ENV;
global.dataDir = IS_VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, 'data');

// MongoDB Cloud Sync Setup (Hybrid Storage)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:nb123@cluster0.heyciqo.mongodb.net/hedwigpost?retryWrites=true&w=majority&appName=Cluster0';
const JsonFileSchema = new mongoose.Schema({
    filename: { type: String, unique: true },
    data: mongoose.Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now }
});
const JsonFile = mongoose.model('JsonFile', JsonFileSchema);

// MongoDB Image Storage Schema
const ImageSchema = new mongoose.Schema({
    filename: { type: String, unique: true },
    data: Buffer,
    mimetype: String,
    uploadedAt: { type: Date, default: Date.now }
});
const MongoImage = mongoose.model('MongoImage', ImageSchema);

// ==================== SECURITY: Active Admin Tokens (Persistent Store) ====================
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function generateSecureToken() {
    return crypto.randomBytes(48).toString('hex');
}

function isValidToken(token) {
    if (!token) return false;
    let sessions = readJSON('sessions.json');
    if (!Array.isArray(sessions)) sessions = [];
    
    const sessionIndex = sessions.findIndex(s => s.token === token);
    if (sessionIndex === -1) return false;
    
    if (Date.now() > sessions[sessionIndex].expiresAt) {
        sessions.splice(sessionIndex, 1);
        writeJSON('sessions.json', sessions);
        return false;
    }
    return true;
}

// Auth middleware — protects all admin write endpoints
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!isValidToken(token)) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    next();
}

// ==================== SECURITY: Sanitization Helpers ====================
const sanitizeOpts = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure', 'figcaption',
        'video', 'audio', 'source', 'iframe', 'picture', 'mark', 'del', 'ins',
        'sub', 'sup', 'details', 'summary', 'abbr', 'time', 'ruby', 'rt', 'rp',
        'section', 'article', 'aside', 'nav', 'header', 'footer', 'main',
        'span', 'div', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
        'caption', 'colgroup', 'col', 'hr', 'br', 'wbr'
    ]),
    allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['id', 'class', 'style', 'data-*', 'title', 'aria-*', 'role'],
        'img': ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
        'a': ['href', 'target', 'rel', 'title'],
        'iframe': ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'loading', 'title'],
        'video': ['src', 'controls', 'width', 'height', 'poster', 'preload'],
        'audio': ['src', 'controls', 'preload'],
        'source': ['src', 'type'],
        'td': ['colspan', 'rowspan'],
        'th': ['colspan', 'rowspan', 'scope'],
        'time': ['datetime']
    },
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'player.vimeo.com', 'www.dailymotion.com', 'codepen.io'],
    allowedSchemes: ['http', 'https', 'mailto', 'data'],
    allowVulnerableTags: false
};

function sanitizeContent(html) {
    if (!html) return '';
    return sanitizeHtml(html, sanitizeOpts);
}

function sanitizePlainText(text, maxLength = 500) {
    if (!text) return '';
    return sanitizeHtml(text.substring(0, maxLength), { allowedTags: [], allowedAttributes: {} });
}

// ==================== SECURITY: Middleware Stack ====================
// Helmet sets secure HTTP headers (X-Frame-Options, X-Content-Type-Options, HSTS, etc.)
// CSP disabled — site uses inline onclick/onsubmit handlers (cookie banner, exit popup, forms)
const helmetMiddleware = helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
});
app.use((req, res, next) => {
    if (req.path.startsWith('/admin')) return next();
    helmetMiddleware(req, res, next);
});

// Rate limiter for login endpoint (Patch 4)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // max 20 attempts per window
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve public HTML pages with analytics/ads/custom CSS injection
function servePageWithAnalytics(filePath, res, statusCode = 200, extraHead = '') {
    if (!fs.existsSync(filePath)) return res.status(404).send('Page not found');
    let html = fs.readFileSync(filePath, 'utf-8');
    const settings = readSettings();
    let inject = '';

    if (extraHead) inject += extraHead + '\n';

    // Google Analytics (GA4)
    if (settings.analyticsId) {
        inject += `<!-- Google Analytics -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=${settings.analyticsId}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.analyticsId}');</script>\n`;
    }
    // Google Search Console verification
    if (settings.searchConsoleVerification) {
        inject += `<meta name="google-site-verification" content="${settings.searchConsoleVerification}">\n`;
    }
    // Google AdSense
    if (settings.adsenseId) {
        inject += `<!-- Google AdSense -->\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsenseId}" crossorigin="anonymous"></script>\n`;
    }
    // Custom CSS injection
    if (settings.customCSS) {
        inject += `<style>${settings.customCSS}</style>\n`;
    }
    // Custom head code injection
    if (settings.customHeadCode) {
        inject += settings.customHeadCode + '\n';
    }

    if (inject) {
        html = html.replace('</head>', inject + '</head>');
    }
    res.status(statusCode).type('html').send(html);
}

// Intercept public HTML pages before express.static
app.get('/', (req, res) => {
    servePageWithAnalytics(path.join(__dirname, 'public', 'index.html'), res);
});
app.get(/^\/(?!admin|api|uploads).*\.html$/, (req, res, next) => {
    const filePath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(filePath)) {
        servePageWithAnalytics(filePath, res);
    } else {
        next();
    }
});

// Static files (CSS, JS, images, etc. — HTML handled above)
app.use(express.static(path.join(__dirname, 'public')));
// Dynamic GridFS-style image serving from MongoDB
app.get('/uploads/:filename', async (req, res) => {
    try {
        const img = await MongoImage.findOne({ filename: req.params.filename });
        if (!img) {
            const localPath = path.join(__dirname, 'uploads', req.params.filename);
            if (fs.existsSync(localPath)) return res.sendFile(localPath);
            return res.status(404).send('Image not found');
        }
        res.set('Content-Type', img.mimetype);
        res.set('Cache-Control', 'public, max-age=31536000');
        res.send(img.data);
    } catch(e) { res.status(500).send('Error'); }
});

// Ensure directories exist (Only locally, skip for Vercel)
if (!IS_VERCEL) {
    ['data', 'uploads'].forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    });
}

// Image upload config (Memory Storage to support Vercel Serverless)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        // Patch 3: SVG blocked — SVGs can contain embedded <script> tags (Stored XSS)
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (path.extname(file.originalname).toLowerCase() === '.svg') {
            return cb(new Error('SVG uploads are not allowed for security reasons'), false);
        }
        cb(ext && mime ? null : new Error('Only image files allowed (jpg, png, gif, webp)'), ext && mime);
    }
});

// Helper: read/write JSON
function readJSON(filename) {
    const filePath = path.join(global.dataDir, filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}
function writeJSON(filename, data) {
    fs.writeFileSync(path.join(global.dataDir, filename), JSON.stringify(data, null, 2));
    JsonFile.updateOne({ filename }, { $set: { data, updatedAt: new Date() } }, { upsert: true }).catch(err => console.error(`[Mongo Sync Failed] ${filename}:`, err));
}
function readSettings() {
    const filePath = path.join(global.dataDir, 'settings.json');
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// Generate slug
function slugify(text) {
    return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
}

// Calculate reading time
function calcReadingTime(content) {
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
}

// ==================== API ROUTES ====================

// --- POSTS ---
app.get('/api/posts', (req, res) => {
    let posts = readJSON('posts.json');
    const { status, category, search, limit, page } = req.query;
    if (status) posts = posts.filter(p => p.status === status);
    if (category) posts = posts.filter(p => p.category === category);
    if (search) {
        const q = search.toLowerCase();
        posts = posts.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || (p.tags && p.tags.some(t => t.toLowerCase().includes(q))));
    }
    posts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    const total = posts.length;
    const pageNum = parseInt(page) || 1;
    const lim = parseInt(limit) || 10;
    const start = (pageNum - 1) * lim;
    res.json({ posts: posts.slice(start, start + lim), total, page: pageNum, totalPages: Math.ceil(total / lim) });
});

app.get('/api/posts/:slug', (req, res) => {
    const posts = readJSON('posts.json');
    const post = posts.find(p => p.slug === req.params.slug);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
});

app.post('/api/posts', requireAuth, (req, res) => {
    const posts = readJSON('posts.json');
    const post = {
        id: Date.now().toString(),
        title: sanitizePlainText(req.body.title, 200) || 'Untitled',
        slug: req.body.slug || slugify(req.body.title || 'untitled'),
        content: sanitizeContent(req.body.content || ''),
        excerpt: sanitizePlainText(req.body.excerpt, 500),
        category: sanitizePlainText(req.body.category, 100) || 'Uncategorized',
        tags: req.body.tags || [],
        author: sanitizePlainText(req.body.author, 100) || 'HedwigPost',
        featuredImage: req.body.featuredImage || '',
        featuredImageAlt: sanitizePlainText(req.body.featuredImageAlt, 200),
        metaTitle: sanitizePlainText(req.body.metaTitle || req.body.title || '', 200),
        metaDescription: sanitizePlainText(req.body.metaDescription, 500),
        status: req.body.status || 'draft',
        publishDate: req.body.publishDate || new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        readingTime: calcReadingTime(req.body.content || ''),
        seoScore: req.body.seoScore || 0
    };
    // Ensure unique slug
    let slugBase = post.slug;
    let counter = 1;
    while (posts.find(p => p.slug === post.slug)) {
        post.slug = `${slugBase}-${counter++}`;
    }
    posts.push(post);
    writeJSON('posts.json', posts);
    updateSitemap();
    res.status(201).json(post);
});

app.put('/api/posts/:id', requireAuth, (req, res) => {
    const posts = readJSON('posts.json');
    const idx = posts.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Post not found' });
    // Sanitize mutable fields
    const safeBody = { ...req.body };
    if (safeBody.title) safeBody.title = sanitizePlainText(safeBody.title, 200);
    if (safeBody.content) safeBody.content = sanitizeContent(safeBody.content);
    if (safeBody.excerpt) safeBody.excerpt = sanitizePlainText(safeBody.excerpt, 500);
    if (safeBody.metaTitle) safeBody.metaTitle = sanitizePlainText(safeBody.metaTitle, 200);
    if (safeBody.metaDescription) safeBody.metaDescription = sanitizePlainText(safeBody.metaDescription, 500);
    const updated = { ...posts[idx], ...safeBody, updatedDate: new Date().toISOString() };
    if (req.body.content) updated.readingTime = calcReadingTime(req.body.content);
    posts[idx] = updated;
    writeJSON('posts.json', posts);
    updateSitemap();
    res.json(updated);
});

app.delete('/api/posts/:id', requireAuth, (req, res) => {
    let posts = readJSON('posts.json');
    posts = posts.filter(p => p.id !== req.params.id);
    writeJSON('posts.json', posts);
    updateSitemap();
    res.json({ success: true });
});

// --- CATEGORIES ---
app.get('/api/categories', (req, res) => {
    const cats = readJSON('categories.json');
    const posts = readJSON('posts.json').filter(p => p.status === 'published');
    // Compute real post counts from posts.json
    const counts = {};
    posts.forEach(p => {
        const cat = p.category || 'Uncategorized';
        counts[cat] = (counts[cat] || 0) + 1;
    });
    cats.forEach(c => { c.postCount = counts[c.name] || 0; });
    res.json(cats);
});

app.post('/api/categories', requireAuth, (req, res) => {
    const cats = readJSON('categories.json');
    const cat = {
        id: Date.now().toString(),
        name: sanitizePlainText(req.body.name, 100),
        slug: slugify(req.body.name),
        description: sanitizePlainText(req.body.description, 500),
        postCount: 0
    };
    cats.push(cat);
    writeJSON('categories.json', cats);
    res.status(201).json(cat);
});

app.put('/api/categories/:id', requireAuth, (req, res) => {
    const cats = readJSON('categories.json');
    const idx = cats.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Category not found' });
    cats[idx] = { ...cats[idx], ...req.body };
    writeJSON('categories.json', cats);
    res.json(cats[idx]);
});

app.delete('/api/categories/:id', requireAuth, (req, res) => {
    let cats = readJSON('categories.json');
    cats = cats.filter(c => c.id !== req.params.id);
    writeJSON('categories.json', cats);
    res.json({ success: true });
});

// --- SETTINGS ---
app.get('/api/settings', (req, res) => {
    res.json(readSettings());
});

app.put('/api/settings', requireAuth, (req, res) => {
    const settings = { ...readSettings(), ...req.body };
    writeJSON('settings.json', settings);
    res.json(settings);
});

// --- IMAGE UPLOAD ---
app.post('/api/upload', requireAuth, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    try {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(req.file.originalname);
        await MongoImage.create({
            filename: uniqueName,
            data: req.file.buffer,
            mimetype: req.file.mimetype
        });
        res.json({ url: `/uploads/${uniqueName}`, filename: uniqueName });
    } catch(err) {
        console.error('Image Upload Error:', err);
        res.status(500).json({ error: 'Failed to save image to cloud' });
    }
});

// --- SITEMAP (enhanced: categories, tags, static pages) ---
function updateSitemap() {} // No-op for legacy calls

app.get('/sitemap.xml', (req, res) => {
    const posts = readJSON('posts.json').filter(p => p.status === 'published');
    const cats = readJSON('categories.json');
    const settings = readSettings();
    const baseUrl = settings.siteUrl || 'https://HedwigPost.com';
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
    // Static pages
    ['about', 'contact', 'privacy', 'terms', 'disclaimer', 'archive', 'search', 'advertise'].forEach(pg => {
        xml += `  <url><loc>${baseUrl}/${pg}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
    });
    // Category pages
    cats.forEach(c => {
        xml += `  <url><loc>${baseUrl}/category/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
    });
    // Tag pages
    const allTags = new Set();
    posts.forEach(p => (p.tags || []).forEach(t => allTags.add(t)));
    allTags.forEach(t => {
        xml += `  <url><loc>${baseUrl}/tag/${encodeURIComponent(t)}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
    });
    // Post pages + AMP
    posts.forEach(p => {
        xml += `  <url><loc>${baseUrl}/post/${p.slug}</loc><lastmod>${p.updatedDate || p.publishDate}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
        xml += `  <url><loc>${baseUrl}/blog/${p.slug}/amp</loc><lastmod>${p.updatedDate || p.publishDate}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    });
    // Deals pages
    const dealCats = readJSON('deal-categories.json');
    xml += `  <url><loc>${baseUrl}/deals</loc><changefreq>weekly</changefreq><priority>0.85</priority></url>\n`;
    dealCats.forEach(dc => {
        xml += `  <url><loc>${baseUrl}/deals/${dc.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
    });
    xml += '</urlset>';
    res.type('application/xml').send(xml);
});

// --- RSS FEED (auto-generated) ---
function updateRSS() {}

app.get('/rss.xml', (req, res) => {
    const posts = readJSON('posts.json').filter(p => p.status === 'published');
    const settings = readSettings();
    const baseUrl = settings.siteUrl || 'https://HedwigPost.com';
    const escXml = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    let rss = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    rss += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n`;
    rss += `<channel>\n`;
    rss += `  <title>${escXml(settings.blogName || 'HedwigPost')}</title>\n`;
    rss += `  <link>${baseUrl}</link>\n`;
    rss += `  <description>${escXml(settings.tagline || 'Tech Blog')}</description>\n`;
    rss += `  <language>en-us</language>\n`;
    rss += `  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
    rss += `  <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>\n`;
    rss += `  <image>\n    <url>${baseUrl}/favicon.png</url>\n    <title>${escXml(settings.blogName)}</title>\n    <link>${baseUrl}</link>\n  </image>\n`;

    posts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate)).slice(0, 50).forEach(p => {
        rss += `  <item>\n`;
        rss += `    <title>${escXml(p.title)}</title>\n`;
        rss += `    <link>${baseUrl}/post/${p.slug}</link>\n`;
        rss += `    <guid isPermaLink="true">${baseUrl}/post/${p.slug}</guid>\n`;
        rss += `    <pubDate>${new Date(p.publishDate).toUTCString()}</pubDate>\n`;
        rss += `    <description>${escXml(p.metaDescription || p.excerpt || '')}</description>\n`;
        if (p.category) rss += `    <category>${escXml(p.category)}</category>\n`;
        if (p.author) rss += `    <author>${escXml(p.author)}</author>\n`;
        rss += `  </item>\n`;
    });

    rss += `</channel>\n</rss>`;
    res.type('application/rss+xml').send(rss);
});

app.get('/feed', (req, res) => res.redirect(301, '/rss.xml'));

// --- ROBOTS.TXT ---
app.get('/robots.txt', (req, res) => {
    const settings = readSettings();
    const baseUrl = settings.siteUrl || 'https://HedwigPost.com';
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${baseUrl}/sitemap.xml`);
});

// --- NEWSLETTER SUBSCRIBERS ---
app.post('/api/newsletter/subscribe', (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const subscribers = readJSON('subscribers.json');
    if (subscribers.find(s => s.email === email)) {
        return res.status(409).json({ error: 'This email is already subscribed!' });
    }
    const subscriber = {
        id: Date.now().toString(),
        email,
        subscribedAt: new Date().toISOString()
    };
    subscribers.push(subscriber);
    writeJSON('subscribers.json', subscribers);
    res.status(201).json({ success: true, message: 'Successfully subscribed!' });
});

app.get('/api/newsletter/subscribers', (req, res) => {
    const subscribers = readJSON('subscribers.json');
    subscribers.sort((a, b) => new Date(b.subscribedAt) - new Date(a.subscribedAt));
    res.json({ subscribers, total: subscribers.length });
});

app.delete('/api/newsletter/subscribers/:id', (req, res) => {
    let subscribers = readJSON('subscribers.json');
    const before = subscribers.length;
    subscribers = subscribers.filter(s => s.id !== req.params.id);
    if (subscribers.length === before) {
        return res.status(404).json({ error: 'Subscriber not found' });
    }
    writeJSON('subscribers.json', subscribers);
    res.json({ success: true });
});

// --- STATS ---
app.get('/api/stats', (req, res) => {
    const posts = readJSON('posts.json');
    const cats = readJSON('categories.json');
    const subscribers = readJSON('subscribers.json');
    const comments = readJSON('comments.json');

    const published = posts.filter(p => p.status === 'published');
    const drafts = posts.filter(p => p.status === 'draft');

    const avgSeoScore = posts.length
        ? Math.round(posts.reduce((s, p) => s + (p.seoScore || 0), 0) / posts.length)
        : 0;

    const totalWords = posts.reduce((sum, p) => {
        const text = (p.content || '').replace(/<[^>]*>/g, '');
        return sum + text.split(/\s+/).filter(w => w).length;
    }, 0);

    const categoryCounts = {};
    posts.forEach(p => {
        const cat = p.category || 'Uncategorized';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];
    const categoryDistribution = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count], i) => ({ name, count, color: colors[i % colors.length] }));

    const now = new Date();
    const activity = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const count = posts.filter(p => {
            const pd = new Date(p.publishDate || p.updatedDate).toISOString().split('T')[0];
            return pd === dateStr;
        }).length;
        activity.push({ date: dateStr, label, count });
    }

    res.json({
        totalPosts: posts.length,
        published: published.length,
        drafts: drafts.length,
        categories: cats.length,
        subscribers: subscribers.length,
        totalComments: comments.length,
        pendingComments: comments.filter(c => c.status === 'pending').length,
        approvedComments: comments.filter(c => c.status === 'approved').length,
        avgSeoScore,
        totalWords,
        categoryCounts,
        categoryDistribution,
        recentActivity: activity
    });
});

// --- COMMENTS ---
app.post('/api/comments', (req, res) => {
    const { name, email, comment, postSlug } = req.body;
    if (!name || !comment || !postSlug) {
        return res.status(400).json({ error: 'Name, comment, and post are required.' });
    }
    const comments = readJSON('comments.json');
    const newComment = {
        id: Date.now().toString(),
        name: sanitizePlainText(name, 100),
        email: sanitizePlainText(email, 200),
        comment: sanitizePlainText(comment, 2000),
        postSlug: sanitizePlainText(postSlug, 200),
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    comments.push(newComment);
    writeJSON('comments.json', comments);
    res.status(201).json({ success: true, message: 'Comment submitted! It will appear after review.' });
});

app.get('/api/comments', (req, res) => {
    let comments = readJSON('comments.json');
    const { status, postSlug, search } = req.query;
    if (status) comments = comments.filter(c => c.status === status);
    if (postSlug) comments = comments.filter(c => c.postSlug === postSlug);
    if (search) {
        const q = search.toLowerCase();
        comments = comments.filter(c => c.name.toLowerCase().includes(q) || c.comment.toLowerCase().includes(q));
    }
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // Attach post titles
    const posts = readJSON('posts.json');
    comments = comments.map(c => {
        const post = posts.find(p => p.slug === c.postSlug);
        return { ...c, postTitle: post ? post.title : c.postSlug };
    });
    res.json({ comments, total: comments.length });
});

app.get('/api/comments/:postSlug', (req, res) => {
    const comments = readJSON('comments.json')
        .filter(c => c.postSlug === req.params.postSlug && c.status === 'approved')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ comments, total: comments.length });
});

app.put('/api/comments/:id', requireAuth, (req, res) => {
    const comments = readJSON('comments.json');
    const idx = comments.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Comment not found' });
    comments[idx] = { ...comments[idx], ...req.body };
    writeJSON('comments.json', comments);
    res.json(comments[idx]);
});

app.delete('/api/comments/:id', requireAuth, (req, res) => {
    let comments = readJSON('comments.json');
    comments = comments.filter(c => c.id !== req.params.id);
    writeJSON('comments.json', comments);
    res.json({ success: true });
});

// --- SIDEBAR LINKS ---
app.get('/api/sidebar-links', (req, res) => {
    const links = readJSON('sidebar-links.json');
    links.sort((a, b) => (a.position || 0) - (b.position || 0));
    res.json(links);
});

app.post('/api/sidebar-links', requireAuth, (req, res) => {
    const links = readJSON('sidebar-links.json');
    const link = {
        id: Date.now().toString(),
        label: sanitizePlainText(req.body.label, 100) || 'Link',
        url: req.body.url || '#',
        icon: req.body.icon || '🔗',
        position: links.length,
        openNewTab: req.body.openNewTab || false
    };
    links.push(link);
    writeJSON('sidebar-links.json', links);
    res.status(201).json(link);
});

app.put('/api/sidebar-links/:id', requireAuth, (req, res) => {
    const links = readJSON('sidebar-links.json');
    const idx = links.findIndex(l => l.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Link not found' });
    links[idx] = { ...links[idx], ...req.body };
    writeJSON('sidebar-links.json', links);
    res.json(links[idx]);
});

app.delete('/api/sidebar-links/:id', requireAuth, (req, res) => {
    let links = readJSON('sidebar-links.json');
    links = links.filter(l => l.id !== req.params.id);
    writeJSON('sidebar-links.json', links);
    res.json({ success: true });
});

app.put('/api/sidebar-links-reorder', requireAuth, (req, res) => {
    const { orderedIds } = req.body;
    if (!orderedIds) return res.status(400).json({ error: 'orderedIds required' });
    const links = readJSON('sidebar-links.json');
    orderedIds.forEach((id, i) => {
        const link = links.find(l => l.id === id);
        if (link) link.position = i;
    });
    writeJSON('sidebar-links.json', links);
    res.json({ success: true });
});

// --- AUTH (secured with rate limiting + crypto tokens) ---
app.post('/api/auth/login', loginLimiter, (req, res) => {
    const settings = readSettings();
    const adminPass = settings.adminPassword || 'nb123';
    if (req.body.password === adminPass) {
        const token = generateSecureToken();
        
        let sessions = readJSON('sessions.json');
        if (!Array.isArray(sessions)) sessions = [];
        sessions.push({ token, createdAt: Date.now(), expiresAt: Date.now() + TOKEN_EXPIRY_MS });
        
        // Clean up expired tokens periodically
        sessions = sessions.filter(s => Date.now() <= s.expiresAt);
        writeJSON('sessions.json', sessions);
        
        res.json({ success: true, token });
    } else {
        // Generic error message — never reveal if username/password specifically is wrong
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Token verification endpoint — used by login page to check if stored token is still valid
app.get('/api/auth/verify', requireAuth, (req, res) => {
    res.json({ valid: true });
});

app.get('/post/:slug', (req, res) => {
    const ampLink = `<link rel="amphtml" href="/blog/${req.params.slug}/amp">`;
    servePageWithAnalytics(path.join(__dirname, 'public', 'post.html'), res, 200, ampLink);
});
app.get('/blog/:slug', (req, res) => {
    const ampLink = `<link rel="amphtml" href="/blog/${req.params.slug}/amp">`;
    servePageWithAnalytics(path.join(__dirname, 'public', 'post.html'), res, 200, ampLink);
});
app.get('/category/:slug', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'category.html'), res));
app.get('/search', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'search.html'), res));
app.get('/about', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'about.html'), res));
app.get('/contact', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'contact.html'), res));
app.get('/privacy', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'privacy.html'), res));
app.get('/terms', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'terms.html'), res));
app.get('/disclaimer', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'disclaimer.html'), res));

// New page routes
app.get('/blogs', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'blogs.html'), res));
app.get('/tag/:tag', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'tag.html'), res));
app.get('/author/:name', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'author.html'), res));
app.get('/archive', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'archive.html'), res));
app.get('/sitemap-page', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'sitemap-page.html'), res));
app.get('/advertise', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'advertise.html'), res));
app.get('/cookie-policy', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'cookie-policy.html'), res));
app.get('/newsletter-thanks', (req, res) => servePageWithAnalytics(path.join(__dirname, 'public', 'newsletter-thanks.html'), res));

// ==================== CONTENT AUTOMATION API ====================
const scheduler = require('./content-engine/scheduler');
const keywordDiscovery = require('./content-engine/keyword-discovery');
const { relinkAllPosts } = require('./content-engine/internal-linker');
const contentRefresh = require('./content-engine/content-refresh');
const templateEngine = require('./content-engine/template-engine');

// Automation status
app.get('/api/automation/status', (req, res) => {
    res.json(scheduler.getStatus());
});

// Start scheduler
app.post('/api/automation/start', requireAuth, (req, res) => {
    const status = scheduler.startScheduler();
    res.json({ success: true, status });
});

// Stop scheduler
app.post('/api/automation/stop', requireAuth, (req, res) => {
    const status = scheduler.stopScheduler();
    res.json({ success: true, status });
});

// Generate single article
app.post('/api/automation/generate', requireAuth, async (req, res) => {
    try {
        const { keyword, category } = req.body || {};
        const result = await scheduler.runOnce({ count: 1, keyword, category });
        updateSitemap();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bulk generate articles
app.post('/api/automation/generate-bulk', requireAuth, async (req, res) => {
    try {
        const { count = 5, category } = req.body || {};
        const result = await scheduler.runOnce({ count: Math.min(count, 50), category });
        updateSitemap();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate from templates
app.post('/api/automation/templates/generate', requireAuth, (req, res) => {
    try {
        const { template, count = 10 } = req.body || {};
        const result = scheduler.runBulkFromTemplates(template, Math.min(count, 100));
        updateSitemap();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get template info
app.get('/api/automation/templates', (req, res) => {
    res.json(templateEngine.getTemplateInfo());
});

// Discover keywords
app.get('/api/automation/keywords', async (req, res) => {
    try {
        const { category, count = 50 } = req.query;
        const keywords = category
            ? await keywordDiscovery.discoverKeywordsByCategory(category, parseInt(count))
            : await keywordDiscovery.discoverKeywords({ maxResults: parseInt(count) });
        res.json({ keywords, total: keywords.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Relink all posts
app.post('/api/automation/relink', requireAuth, (req, res) => {
    try {
        const result = relinkAllPosts();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Content refresh
app.get('/api/automation/stale', (req, res) => {
    const { days = 90 } = req.query;
    res.json(contentRefresh.getStaleContent(parseInt(days)));
});

app.post('/api/automation/refresh', requireAuth, (req, res) => {
    try {
        const { postId, days = 90 } = req.body || {};
        if (postId) {
            const result = contentRefresh.refreshPost(postId);
            res.json(result);
        } else {
            const result = contentRefresh.autoRefreshAll(parseInt(days));
            res.json(result);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Activity log
app.get('/api/automation/log', (req, res) => {
    const { limit = 50 } = req.query;
    res.json(scheduler.getLog(parseInt(limit)));
});

// Config
app.get('/api/automation/config', (req, res) => {
    res.json(scheduler.readConfig());
});

app.put('/api/automation/config', requireAuth, (req, res) => {
    const config = { ...scheduler.readConfig(), ...req.body };
    scheduler.writeConfig(config);
    res.json(config);
});

// ==================== TOPIC CLUSTERING & AUTHORITY API ====================
const topicClusters = require('./content-engine/topic-clusters');

app.get('/api/clusters', (req, res) => {
    res.json(topicClusters.getClusterSummary());
});

app.post('/api/clusters/auto', requireAuth, (req, res) => {
    try {
        const clusters = topicClusters.autoClusterPosts();
        res.json({ success: true, summary: topicClusters.getClusterSummary() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/clusters/pillar', requireAuth, (req, res) => {
    try {
        const { topicId } = req.body || {};
        if (!topicId) return res.status(400).json({ error: 'topicId required' });
        const pillar = topicClusters.generatePillarPage(topicId);
        updateSitemap();
        res.json({ success: true, pillar: { id: pillar.id, title: pillar.title, slug: pillar.slug } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/clusters/enforce-links', requireAuth, (req, res) => {
    try {
        const { min = 5, max = 10 } = req.body || {};
        const result = topicClusters.enforceLinkDensity(min, max);
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/clusters/backlinks', requireAuth, (req, res) => {
    try {
        const result = topicClusters.addPillarBacklinks();
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==================== SOCIAL AUTO-POSTING API ====================
const socialPoster = require('./content-engine/social-poster');

app.get('/api/social/status', (req, res) => {
    res.json(socialPoster.getQueueStatus());
});

app.get('/api/social/config', (req, res) => {
    res.json(socialPoster.readSocialConfig());
});

app.put('/api/social/config', requireAuth, (req, res) => {
    const config = { ...socialPoster.readSocialConfig(), ...req.body };
    socialPoster.writeSocialConfig(config);
    res.json(config);
});

app.post('/api/social/viral-title', requireAuth, (req, res) => {
    const { topic } = req.body || {};
    if (!topic) return res.status(400).json({ error: 'topic required' });
    const titles = [];
    for (let i = 0; i < 5; i++) titles.push(socialPoster.generateViralTitle(topic));
    res.json({ titles });
});

app.post('/api/social/caption', requireAuth, (req, res) => {
    const { platform = 'twitter', postId } = req.body || {};
    const posts = readJSON('posts.json');
    const post = postId ? posts.find(p => p.id === postId) : posts[posts.length - 1];
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const caption = socialPoster.generateCaption(platform, post);
    const hashtags = socialPoster.generateHashtags(post.keyword || post.title);
    res.json({ caption, hashtags });
});

app.post('/api/social/queue', requireAuth, (req, res) => {
    const { postId, platforms } = req.body || {};
    if (!postId) return res.status(400).json({ error: 'postId required' });
    const posts = readJSON('posts.json');
    const post = posts.find(p => p.id === postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const items = socialPoster.addToQueue(postId, post.title, post.slug, post.keyword, platforms);
    res.json({ success: true, queued: items.length, items });
});

app.post('/api/social/process', requireAuth, (req, res) => {
    const result = socialPoster.processQueue();
    res.json(result);
});

app.post('/api/social/trend-to-article', requireAuth, async (req, res) => {
    try {
        const { count = 1 } = req.body || {};
        const result = await socialPoster.trendToArticle(Math.min(count, 10));
        updateSitemap();
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/social/log', (req, res) => {
    const { limit = 50 } = req.query;
    res.json(socialPoster.getSocialLog(parseInt(limit)));
});

// ==================== AFFILIATE PRODUCTS API ====================

// --- PRODUCTS CRUD ---
app.get('/api/products', (req, res) => {
    let products = readJSON('products.json');
    const { category, featured, sort } = req.query;
    if (category) products = products.filter(p => p.category === category);
    if (featured === 'true') products = products.filter(p => p.featured);
    if (sort === 'latest') products.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    else if (sort === 'price') products.sort((a, b) => parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, '')));
    else products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || new Date(b.dateAdded) - new Date(a.dateAdded));
    res.json(products);
});

app.post('/api/products', requireAuth, (req, res) => {
    const products = readJSON('products.json');
    const product = {
        id: 'prod_' + Date.now(),
        name: sanitizePlainText(req.body.name, 200) || '',
        slug: slugify(req.body.name || 'product'),
        image: req.body.image || '',
        description: sanitizePlainText(req.body.description, 2000),
        price: sanitizePlainText(req.body.price, 50),
        originalPrice: sanitizePlainText(req.body.originalPrice, 50),
        category: req.body.category || 'general',
        affiliateLink: (req.body.affiliateLink || '#').replace(/^javascript:/i, '#'),
        badge: sanitizePlainText(req.body.badge, 50),
        rating: req.body.rating || 0,
        featured: req.body.featured || false,
        dateAdded: new Date().toISOString().split('T')[0]
    };
    products.push(product);
    writeJSON('products.json', products);
    updateSitemap();
    res.status(201).json(product);
});

app.put('/api/products/:id', requireAuth, (req, res) => {
    const products = readJSON('products.json');
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    // Block javascript: protocol in affiliate links
    if (req.body.affiliateLink) req.body.affiliateLink = req.body.affiliateLink.replace(/^javascript:/i, '#');
    products[idx] = { ...products[idx], ...req.body };
    writeJSON('products.json', products);
    res.json(products[idx]);
});

app.delete('/api/products/:id', requireAuth, (req, res) => {
    let products = readJSON('products.json');
    products = products.filter(p => p.id !== req.params.id);
    writeJSON('products.json', products);
    res.json({ success: true });
});

// --- DEAL CATEGORIES ---
app.get('/api/deal-categories', (req, res) => {
    const cats = readJSON('deal-categories.json');
    const products = readJSON('products.json');
    cats.forEach(c => { c.productCount = products.filter(p => p.category === c.slug).length; });
    res.json(cats);
});

app.post('/api/deal-categories', requireAuth, (req, res) => {
    const cats = readJSON('deal-categories.json');
    const cat = {
        slug: slugify(req.body.name || 'category'),
        name: req.body.name || '',
        metaTitle: req.body.metaTitle || '',
        metaDescription: req.body.metaDescription || '',
        introHTML: req.body.introHTML || '',
        keywords: req.body.keywords || []
    };
    cats.push(cat);
    writeJSON('deal-categories.json', cats);
    updateSitemap();
    res.status(201).json(cat);
});

// --- DEALS PAGE SERVING (with dynamic SEO head injection) ---
app.get('/deals', (req, res) => {
    const extraHead = `
    <title>Best Deals & Recommendations 2026 — HedwigPost</title>
    <meta name="description" content="Handpicked deals on the best tech, software, gadgets, and AI tools. Curated recommendations you can trust from HedwigPost.">
    <meta property="og:title" content="Best Deals & Recommendations 2026 — HedwigPost">
    <meta property="og:description" content="Handpicked deals on the best tech, software, gadgets, and AI tools.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${(readSettings().siteUrl || 'https://HedwigPost.com')}/deals">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Best Deals & Recommendations 2026 — HedwigPost">`;
    servePageWithAnalytics(path.join(__dirname, 'public', 'deals.html'), res, 200, extraHead);
});

app.get('/deals/:slug', (req, res) => {
    const dealCats = readJSON('deal-categories.json');
    const cat = dealCats.find(c => c.slug === req.params.slug);
    const settings = readSettings();
    const baseUrl = settings.siteUrl || 'https://HedwigPost.com';
    let extraHead = '';
    if (cat) {
        extraHead = `
    <title>${cat.metaTitle || cat.name + ' — Deals | HedwigPost'}</title>
    <meta name="description" content="${cat.metaDescription || ''}">
    <meta name="keywords" content="${(cat.keywords || []).join(', ')}">
    <meta property="og:title" content="${cat.metaTitle || cat.name}">
    <meta property="og:description" content="${cat.metaDescription || ''}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${baseUrl}/deals/${cat.slug}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${cat.metaTitle || cat.name}">`;
    } else {
        extraHead = `<title>Deals — HedwigPost</title>`;
    }
    servePageWithAnalytics(path.join(__dirname, 'public', 'deals.html'), res, 200, extraHead);
});

// --- AMP INTEGRATION ---
const { generateAmpPage } = require('./amp-generator');
function serveAmpPage(req, res) {
    const posts = readJSON('posts.json');
    const post = posts.find(p => p.slug === req.params.slug);
    if (!post) return res.status(404).send('Post not found');
    const settings = readSettings();
    const ampHtml = generateAmpPage(post, settings, path.join(__dirname, 'public'));
    res.type('html').send(ampHtml);
}
app.get('/post/:slug/amp', serveAmpPage);
app.get('/blog/:slug/amp', serveAmpPage);

// Custom 404 handler (must be last)
app.use((req, res) => {
    servePageWithAnalytics(path.join(__dirname, 'public', '404.html'), res, 404);
});

// Boot Sequence with MongoDB Cloud Sync Restore
let isDBReady = false;
let dbInitPromise = null;

async function awaitDatabaseSync() {
    if (isDBReady) return;
    if (dbInitPromise) return dbInitPromise;
    
    dbInitPromise = (async () => {
        try {
            console.log('Connecting to MongoDB Cloud Storage...');
            await mongoose.connect(MONGODB_URI);
            console.log('MongoDB Connected ✅');

            // Restore all JSON files from Cloud to ephemeral disk
            if (!fs.existsSync(global.dataDir)) fs.mkdirSync(global.dataDir, { recursive: true });
            
            const allFiles = await JsonFile.find({});
            for (let fileDoc of allFiles) {
                fs.writeFileSync(path.join(global.dataDir, fileDoc.filename), JSON.stringify(fileDoc.data, null, 2));
            }
            if (allFiles.length > 0) console.log(`Restored ${allFiles.length} files from MongoDB ✅`);

            // Upload any local files that don't exist in Cloud yet (initial setup push)
            const localFiles = fs.readdirSync(global.dataDir).filter(f => f.endsWith('.json'));
            let uploaded = 0;
            for (let file of localFiles) {
                const exists = allFiles.find(f => f.filename === file);
                if (!exists) {
                    const localData = JSON.parse(fs.readFileSync(path.join(global.dataDir, file), 'utf8'));
                    await JsonFile.updateOne({ filename: file }, { data: localData }, { upsert: true });
                    uploaded++;
                }
            }
            if (uploaded > 0) console.log(`Uploaded ${uploaded} local files to MongoDB ✅`);
            
            isDBReady = true;
        } catch (err) {
            console.error('Failed to initialize MongoDB:', err);
            isDBReady = true; // Fallback to local mode if mongo fails
        }
    })();
    return dbInitPromise;
}

if (!IS_VERCEL) {
    app.listen(PORT, async () => {
        await awaitDatabaseSync();
        console.log(`\n⚡ HedwigPost is running at http://localhost:${PORT}`);
        console.log(`📝 Admin Panel: http://localhost:${PORT}/admin/`);
        console.log(`📰 Blog: http://localhost:${PORT}`);
        console.log(`🛒 Deals: http://localhost:${PORT}/deals\n`);
        try { updateSitemap(); } catch (e) { console.log('Sitemap initial skip'); }
    });
}

// Vercel Serverless Export Wrapper
module.exports = async (req, res) => {
    await awaitDatabaseSync();
    return app(req, res);
};

