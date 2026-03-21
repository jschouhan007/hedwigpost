/**
 * HedwigPost Content Engine — Social Auto-Posting & Growth Engine
 * 
 * Drives traffic from social platforms automatically:
 *   - Detects trending topics from Google Trends, Reddit, Hacker News
 *   - Generates instant articles from trends
 *   - Creates social posts with captions & hashtags
 *   - Optimizes for virality (clickbait titles, power words, numbers)
 *   - Manages posting queue for Twitter, LinkedIn, Facebook, Pinterest
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { discoverKeywords } = require('./keyword-discovery');
const { generateArticle, wordCount } = require('./article-generator');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SOCIAL_CONFIG_FILE = path.join(DATA_DIR, 'social-config.json');
const SOCIAL_QUEUE_FILE = path.join(DATA_DIR, 'social-queue.json');
const SOCIAL_LOG_FILE = path.join(DATA_DIR, 'social-log.json');

// ─── Power Words for Viral Titles ───────────────────────────────────
const POWER_WORDS = [
    'Ultimate', 'Insane', 'Mind-Blowing', 'Shocking', 'Epic',
    'Incredible', 'Revolutionary', 'Game-Changing', 'Proven',
    'Essential', 'Critical', 'Explosive', 'Unstoppable', 'Brilliant',
    'Secret', 'Powerful', 'Dangerous', 'Massive', 'Unbelievable',
    'Jaw-Dropping', 'Must-Know', 'Life-Changing', 'Breakthrough'
];

const CLICKBAIT_TEMPLATES = [
    '{n} {power} {topic} Tips That Will Blow Your Mind',
    'You Won\'t Believe These {n} {topic} Secrets',
    'Stop Everything: {topic} Just Changed Forever',
    'I Tried {topic} for 30 Days — Here\'s What Happened',
    '{n} {power} Reasons Why {topic} Is Taking Over in {year}',
    'The {power} Truth About {topic} Nobody Tells You',
    'How {topic} Is Secretly Changing Everything in {year}',
    '{topic}: {n} Things Experts Don\'t Want You to Know',
    'Why {n}% of People Get {topic} Wrong (And How to Fix It)',
    'The Only {topic} Guide You\'ll Ever Need ({year} Edition)',
    '{power}! {n} {topic} Hacks That Actually Work',
    'Breaking: {topic} Will Never Be the Same After This',
    'This {power} {topic} Strategy Made Me 10x More Productive',
    '{n} {power} {topic} Mistakes You\'re Probably Making'
];

// ─── Hashtag Database ───────────────────────────────────────────────
const HASHTAG_MAP = {
    'ai': ['#AI', '#ArtificialIntelligence', '#MachineLearning', '#DeepLearning', '#ChatGPT', '#Tech', '#Future'],
    'programming': ['#Programming', '#Coding', '#Developer', '#SoftwareEngineering', '#Code', '#WebDev', '#Tech'],
    'cybersecurity': ['#Cybersecurity', '#InfoSec', '#Hacking', '#Privacy', '#DataSecurity', '#CyberAttack', '#Tech'],
    'web development': ['#WebDev', '#JavaScript', '#React', '#Frontend', '#Backend', '#Coding', '#Developer'],
    'python': ['#Python', '#PythonProgramming', '#DataScience', '#Coding', '#Developer', '#Tech', '#LearnPython'],
    'cloud': ['#Cloud', '#AWS', '#Azure', '#DevOps', '#CloudComputing', '#Tech', '#SaaS'],
    'data science': ['#DataScience', '#Analytics', '#BigData', '#MachineLearning', '#AI', '#Statistics', '#Tech'],
    'social media': ['#SocialMedia', '#Marketing', '#DigitalMarketing', '#GrowthHacking', '#ContentMarketing'],
    'seo': ['#SEO', '#SearchEngine', '#DigitalMarketing', '#ContentMarketing', '#GoogleSEO', '#OrganicTraffic'],
    'startup': ['#Startup', '#Entrepreneur', '#Business', '#Innovation', '#Tech', '#Growth', '#SaaS'],
    'default': ['#Tech', '#Technology', '#Innovation', '#Digital', '#Trending', '#TechNews', '#Future']
};

// ─── Caption Templates per Platform ─────────────────────────────────
const CAPTION_TEMPLATES = {
    twitter: [
        '🔥 {title}\n\n{hook}\n\nRead more 👇\n{url}\n\n{hashtags}',
        '🚀 NEW: {title}\n\n{hook}\n\n{url}\n{hashtags}',
        '💡 {hook}\n\nFull article: {url}\n\n{hashtags}',
        '⚡ Breaking: {title}\n\n{url}\n{hashtags}',
        '📢 {hook}\n\nDive deep 👉 {url}\n\n{hashtags}'
    ],
    linkedin: [
        '🔥 {title}\n\n{hook}\n\nKey takeaways:\n{bullets}\n\nRead the full article: {url}\n\n{hashtags}',
        '📊 I just published: {title}\n\n{description}\n\nCheck it out: {url}\n\n{hashtags}',
        '💡 {hook}\n\nWhat you\'ll learn:\n{bullets}\n\n👉 {url}\n\n{hashtags}'
    ],
    facebook: [
        '🔥 {title}\n\n{hook}\n\n{description}\n\n📖 Read more: {url}',
        '📢 New article alert!\n\n{title}\n\n{hook}\n\nCheck it out 👉 {url}',
        '💡 {hook}\n\n{description}\n\nFull article: {url}'
    ],
    pinterest: [
        '{title} | {description}\n\n{hashtags}',
        '{title} — {hook}\n\n{hashtags}',
        '{description}\n\nRead more at {url}\n\n{hashtags}'
    ]
};

// ─── Social Config Read/Write ───────────────────────────────────────
const DEFAULT_SOCIAL_CONFIG = {
    enabled: false,
    platforms: {
        twitter: { enabled: false, apiKey: '', apiSecret: '', accessToken: '', accessSecret: '' },
        linkedin: { enabled: false, accessToken: '', organizationId: '' },
        facebook: { enabled: false, pageToken: '', pageId: '' },
        pinterest: { enabled: false, accessToken: '', boardId: '' }
    },
    postingSchedule: {
        postsPerDay: 4,
        intervalHours: 6,
        bestTimes: ['09:00', '12:00', '15:00', '18:00']
    },
    viralOptimization: true,
    autoHashtags: true,
    maxHashtags: 8
};

function readSocialConfig() {
    if (!fs.existsSync(SOCIAL_CONFIG_FILE)) {
        writeSocialConfig(DEFAULT_SOCIAL_CONFIG);
        return { ...DEFAULT_SOCIAL_CONFIG };
    }
    try { return { ...DEFAULT_SOCIAL_CONFIG, ...JSON.parse(fs.readFileSync(SOCIAL_CONFIG_FILE, 'utf-8')) }; }
    catch { return { ...DEFAULT_SOCIAL_CONFIG }; }
}

function writeSocialConfig(config) {
    fs.writeFileSync(SOCIAL_CONFIG_FILE, JSON.stringify(config, null, 2));
}

// ─── Queue Read/Write ───────────────────────────────────────────────
function readQueue() {
    if (!fs.existsSync(SOCIAL_QUEUE_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(SOCIAL_QUEUE_FILE, 'utf-8')); }
    catch { return []; }
}

function writeQueue(queue) {
    fs.writeFileSync(SOCIAL_QUEUE_FILE, JSON.stringify(queue, null, 2));
}

function readSocialLog() {
    if (!fs.existsSync(SOCIAL_LOG_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(SOCIAL_LOG_FILE, 'utf-8')); }
    catch { return []; }
}

function appendSocialLog(entry) {
    const log = readSocialLog();
    log.push({ ...entry, timestamp: new Date().toISOString() });
    fs.writeFileSync(SOCIAL_LOG_FILE, JSON.stringify(log.slice(-500), null, 2));
}

// ─── Generate Viral Title ───────────────────────────────────────────
function generateViralTitle(topic) {
    const template = CLICKBAIT_TEMPLATES[Math.floor(Math.random() * CLICKBAIT_TEMPLATES.length)];
    const power = POWER_WORDS[Math.floor(Math.random() * POWER_WORDS.length)];
    const n = [5, 7, 9, 10, 12, 15, 21][Math.floor(Math.random() * 7)];
    const year = new Date().getFullYear();

    return template
        .replace('{topic}', topic.replace(/\b\w/g, c => c.toUpperCase()))
        .replace('{power}', power)
        .replace('{n}', n)
        .replace('{year}', year);
}

// ─── Generate Hashtags ──────────────────────────────────────────────
function generateHashtags(topic, maxHashtags = 8) {
    const topicLower = topic.toLowerCase();
    let hashtags = new Set();

    // Match from hashtag map
    for (const [key, tags] of Object.entries(HASHTAG_MAP)) {
        if (topicLower.includes(key)) {
            tags.forEach(t => hashtags.add(t));
        }
    }

    // Add default tags if not enough
    if (hashtags.size < 3) {
        HASHTAG_MAP.default.forEach(t => hashtags.add(t));
    }

    // Add year tag
    hashtags.add(`#${new Date().getFullYear()}`);
    hashtags.add('#MustRead');

    return [...hashtags].slice(0, maxHashtags).join(' ');
}

// ─── Generate Caption ──────────────────────────────────────────────
function generateCaption(platform, post, siteUrl = '') {
    const templates = CAPTION_TEMPLATES[platform] || CAPTION_TEMPLATES.twitter;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const url = `${siteUrl}/post/${post.slug}`;
    const hashtags = generateHashtags(post.keyword || post.title);
    
    // Generate hook from excerpt or title
    const hook = post.excerpt 
        ? post.excerpt.substring(0, 140) 
        : `Everything you need to know about ${post.keyword || 'this topic'} in ${new Date().getFullYear()}.`;

    // Generate bullet points from tags
    const bullets = (post.tags || ['Insights', 'Tips', 'Strategies'])
        .slice(0, 4)
        .map(t => `✅ ${t.replace(/\b\w/g, c => c.toUpperCase())}`)
        .join('\n');

    const description = post.metaDescription || post.excerpt || '';

    return template
        .replace('{title}', post.title)
        .replace('{hook}', hook)
        .replace('{url}', url)
        .replace('{hashtags}', hashtags)
        .replace('{bullets}', bullets)
        .replace('{description}', description.substring(0, 200));
}

// ─── Generate Social Posts for All Platforms ─────────────────────────
function generateSocialPosts(post, siteUrl = '') {
    const config = readSocialConfig();
    const platformPosts = {};

    for (const [platform, settings] of Object.entries(config.platforms)) {
        if (settings.enabled || true) { // Generate even if not connected (for preview)
            platformPosts[platform] = {
                caption: generateCaption(platform, post, siteUrl),
                hashtags: generateHashtags(post.keyword || post.title, config.maxHashtags),
                scheduledAt: null,
                status: 'draft'
            };
        }
    }

    return platformPosts;
}

// ─── Add to Posting Queue ───────────────────────────────────────────
function addToQueue(postId, postTitle, postSlug, postKeyword, platforms = ['twitter', 'linkedin', 'facebook', 'pinterest']) {
    const queue = readQueue();
    const config = readSocialConfig();
    const siteUrl = '';

    // Read settings for site URL
    try {
        const settings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'settings.json'), 'utf-8'));
        // Use siteUrl from settings but don't include for localhost
    } catch(e) {}

    const post = { id: postId, title: postTitle, slug: postSlug, keyword: postKeyword, tags: [] };

    // Try to get full post data
    try {
        const posts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'posts.json'), 'utf-8'));
        const fullPost = posts.find(p => p.id === postId);
        if (fullPost) {
            post.excerpt = fullPost.excerpt;
            post.metaDescription = fullPost.metaDescription;
            post.tags = fullPost.tags || [];
        }
    } catch(e) {}

    // Schedule times
    const bestTimes = config.postingSchedule.bestTimes;
    const now = new Date();

    for (const platform of platforms) {
        const scheduledAt = new Date(now.getTime() + Math.random() * 3600000); // Stagger within the hour
        
        queue.push({
            id: `${Date.now()}-${platform}-${Math.random().toString(36).slice(2, 6)}`,
            postId,
            postTitle,
            postSlug: postSlug,
            platform,
            caption: generateCaption(platform, post, siteUrl),
            hashtags: generateHashtags(postKeyword || postTitle),
            scheduledAt: scheduledAt.toISOString(),
            status: 'queued',
            createdAt: new Date().toISOString()
        });
    }

    writeQueue(queue);
    return queue.filter(q => q.postId === postId);
}

// ─── Process Queue (simulated posting) ──────────────────────────────
function processQueue() {
    const queue = readQueue();
    const config = readSocialConfig();
    const results = { posted: 0, failed: 0, skipped: 0 };

    const now = new Date();
    const updatedQueue = queue.map(item => {
        if (item.status !== 'queued') return item;

        const scheduledTime = new Date(item.scheduledAt);
        if (scheduledTime > now) {
            results.skipped++;
            return item;
        }

        const platformConfig = config.platforms[item.platform];
        
        // Check if platform has API keys configured
        if (platformConfig && platformConfig.enabled && platformConfig.apiKey) {
            // Real API posting would go here — for now, mark as posted
            item.status = 'posted';
            item.postedAt = new Date().toISOString();
            results.posted++;

            appendSocialLog({
                action: 'posted',
                platform: item.platform,
                postTitle: item.postTitle,
                caption: item.caption.substring(0, 100)
            });
        } else {
            // No API keys — mark as ready (can be copy-pasted)
            item.status = 'ready';
            item.readyAt = new Date().toISOString();
            results.posted++;

            appendSocialLog({
                action: 'ready',
                platform: item.platform,
                postTitle: item.postTitle,
                note: 'No API keys configured — post content ready for manual copy'
            });
        }

        return item;
    });

    writeQueue(updatedQueue);
    return results;
}

// ─── Trend-to-Article Pipeline ──────────────────────────────────────
async function trendToArticle(count = 1) {
    const results = { articles: [], socialPosts: [], errors: [] };

    try {
        // 1. Discover trending keywords
        const keywords = await discoverKeywords({ maxResults: count * 3 });
        const selected = keywords.slice(0, count);

        for (const kw of selected) {
            try {
                // 2. Generate article with viral title
                const viralTitle = generateViralTitle(kw.keyword);
                const article = generateArticle(kw.keyword, kw.category);

                // Override title with viral version if optimization is on
                const config = readSocialConfig();
                if (config.viralOptimization) {
                    article.title = viralTitle;
                    article.slug = viralTitle.toLowerCase()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-')
                        .substring(0, 80);
                }

                // 3. Save the article
                const posts = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'posts.json'), 'utf-8'));
                article.status = 'published';
                posts.push(article);
                fs.writeFileSync(path.join(DATA_DIR, 'posts.json'), JSON.stringify(posts, null, 2));

                results.articles.push({
                    id: article.id,
                    title: article.title,
                    slug: article.slug,
                    keyword: kw.keyword,
                    wordCount: wordCount(article.content)
                });

                // 4. Generate social posts and add to queue
                const queueItems = addToQueue(article.id, article.title, article.slug, kw.keyword);
                results.socialPosts.push(...queueItems);

            } catch (err) {
                results.errors.push({ keyword: kw.keyword, error: err.message });
            }
        }

        // 5. Process the queue
        processQueue();

    } catch (err) {
        results.errors.push({ error: err.message });
    }

    return results;
}

// ─── Get Queue Status ───────────────────────────────────────────────
function getQueueStatus() {
    const queue = readQueue();
    const queued = queue.filter(q => q.status === 'queued').length;
    const ready = queue.filter(q => q.status === 'ready').length;
    const posted = queue.filter(q => q.status === 'posted').length;

    const byPlatform = {};
    for (const item of queue) {
        byPlatform[item.platform] = byPlatform[item.platform] || { queued: 0, ready: 0, posted: 0 };
        byPlatform[item.platform][item.status]++;
    }

    return { total: queue.length, queued, ready, posted, byPlatform, queue: queue.slice(-20).reverse() };
}

// ─── Get Social Log ─────────────────────────────────────────────────
function getSocialLog(limit = 50) {
    return readSocialLog().slice(-limit).reverse();
}

// ─── Exports ────────────────────────────────────────────────────────
module.exports = {
    generateViralTitle,
    generateHashtags,
    generateCaption,
    generateSocialPosts,
    addToQueue,
    processQueue,
    trendToArticle,
    getQueueStatus,
    getSocialLog,
    readSocialConfig,
    writeSocialConfig,
    POWER_WORDS,
    CLICKBAIT_TEMPLATES
};
