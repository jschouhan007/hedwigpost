/**
 * HedwigPost Content Engine — Scheduler & Orchestrator
 * 
 * Orchestrates the full content pipeline:
 *   discoverKeywords → generateArticle → addInternalLinks → publish
 * 
 * Runs on configurable intervals for automated publishing.
 */

const fs = require('fs');
const path = require('path');
const { discoverKeywords, markKeywordUsed } = require('./keyword-discovery');
const { generateArticle, generateBulkArticles, wordCount } = require('./article-generator');
const { bulkGeneratePages, generateFromTemplate } = require('./template-engine');
const { addInternalLinks, relinkAllPosts } = require('./internal-linker');
const { autoRefreshAll, getStaleContent } = require('./content-refresh');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'automation-config.json');
const LOG_FILE = path.join(DATA_DIR, 'automation-log.json');

// ─── Default Configuration ──────────────────────────────────────────
const DEFAULT_CONFIG = {
    enabled: false,
    postsPerDay: 3,
    publishIntervalHours: 8,
    categories: ['AI & Machine Learning', 'Career & Jobs', 'Web Development', 'Cybersecurity', 'Tech Reviews', 'How-To Guides'],
    enableKeywordDiscovery: true,
    enableContentRefresh: true,
    refreshIntervalDays: 90,
    internalLinksPerPost: 7,
    minWordCount: 1500,
    maxWordCount: 3000,
    autoPublish: true
};

// ─── State ──────────────────────────────────────────────────────────
let schedulerInterval = null;
let refreshInterval = null;
let schedulerStatus = {
    running: false,
    startedAt: null,
    lastRun: null,
    nextRun: null,
    totalGenerated: 0,
    todayGenerated: 0,
    errors: []
};

// ─── Config Read/Write ──────────────────────────────────────────────
function readConfig() {
    if (!fs.existsSync(CONFIG_FILE)) {
        writeConfig(DEFAULT_CONFIG);
        return { ...DEFAULT_CONFIG };
    }
    try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) };
    } catch {
        return { ...DEFAULT_CONFIG };
    }
}

function writeConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// ─── Log Read/Write ─────────────────────────────────────────────────
function readLog() {
    if (!fs.existsSync(LOG_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')); }
    catch { return []; }
}

function appendLog(entry) {
    const log = readLog();
    log.push({
        ...entry,
        timestamp: new Date().toISOString()
    });
    // Keep last 1000 entries
    const trimmed = log.slice(-1000);
    fs.writeFileSync(LOG_FILE, JSON.stringify(trimmed, null, 2));
}

// ─── Read/Write Posts ───────────────────────────────────────────────
function readPosts() {
    const filePath = path.join(DATA_DIR, 'posts.json');
    if (!fs.existsSync(filePath)) return [];
    try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
    catch { return []; }
}

function writePosts(posts) {
    fs.writeFileSync(path.join(DATA_DIR, 'posts.json'), JSON.stringify(posts, null, 2));
}

// ─── Publish a Post ─────────────────────────────────────────────────
function publishPost(post) {
    const posts = readPosts();
    
    // Ensure unique slug
    let slug = post.slug;
    let counter = 1;
    while (posts.find(p => p.slug === slug)) {
        slug = `${post.slug}-${counter++}`;
    }
    post.slug = slug;
    
    // Add internal links
    const publishedPosts = posts.filter(p => p.status === 'published');
    post.content = addInternalLinks(post.content, post, publishedPosts, readConfig().internalLinksPerPost);
    
    posts.push(post);
    writePosts(posts);

    appendLog({
        action: 'published',
        postId: post.id,
        title: post.title,
        keyword: post.keyword,
        category: post.category,
        wordCount: wordCount(post.content),
        seoScore: post.seoScore
    });

    return post;
}

// ─── Run One Generation Cycle ───────────────────────────────────────
async function runOnce(options = {}) {
    const config = readConfig();
    const {
        count = 1,
        category = null,
        keyword = null
    } = options;

    const results = { generated: [], errors: [] };

    try {
        let keywords;

        if (keyword) {
            // Use provided keyword
            keywords = [{ keyword, category: category || 'AI & Machine Learning' }];
        } else {
            // Discover keywords
            const discovered = await discoverKeywords({
                maxResults: count * 3
            });

            // Filter by category if specified
            keywords = category
                ? discovered.filter(kw => kw.category === category).slice(0, count)
                : discovered.slice(0, count);

            // Fallback to seed keywords if discovery yields nothing
            if (keywords.length === 0) {
                const cats = config.categories;
                const cat = category || cats[Math.floor(Math.random() * cats.length)];
                keywords = [{ keyword: `${cat.toLowerCase()} guide`, category: cat }];
            }
        }

        // Generate articles
        for (const kw of keywords.slice(0, count)) {
            try {
                const article = generateArticle(kw.keyword, kw.category);
                
                // Verify word count meets minimum
                const wc = wordCount(article.content);
                if (wc < config.minWordCount) {
                    // Pad with additional content (add another section)
                    article.content += generateExtraSection(kw.keyword);
                }

                // Publish
                if (config.autoPublish) {
                    article.status = 'published';
                }
                
                const published = publishPost(article);
                results.generated.push({
                    id: published.id,
                    title: published.title,
                    slug: published.slug,
                    keyword: kw.keyword,
                    category: kw.category,
                    wordCount: wordCount(published.content),
                    seoScore: published.seoScore
                });

                schedulerStatus.totalGenerated++;
                schedulerStatus.todayGenerated++;
            } catch (err) {
                results.errors.push({ keyword: kw.keyword, error: err.message });
                appendLog({ action: 'error', keyword: kw.keyword, error: err.message });
            }
        }

        schedulerStatus.lastRun = new Date().toISOString();
        
    } catch (err) {
        results.errors.push({ error: err.message });
        appendLog({ action: 'error', error: err.message });
    }

    return results;
}

// ─── Generate Extra Section (to pad word count) ─────────────────────
function generateExtraSection(keyword) {
    return `
<h2>Additional Tips for ${keyword.replace(/\b\w/g, c => c.toUpperCase())}</h2>
<p>As the field continues to evolve in ${new Date().getFullYear()}, staying updated with the latest developments is crucial. Here are some additional tips to help you make the most of your knowledge:</p>
<ul>
<li><strong>Stay informed through industry newsletters</strong> — Subscribe to relevant newsletters that deliver curated content directly to your inbox. This saves time and keeps you updated without the need to actively search for new information.</li>
<li><strong>Practice regularly</strong> — Consistent practice is the key to mastery. Set aside dedicated time each day or week to work on projects, experiment with new tools, or solve challenges related to ${keyword}.</li>
<li><strong>Join professional communities</strong> — Online forums, Discord servers, Reddit communities, and LinkedIn groups provide valuable opportunities to learn from others, share your experiences, and stay connected with industry trends.</li>
<li><strong>Document your learning journey</strong> — Keep a journal or blog about what you're learning. This not only reinforces your knowledge but also helps others who are on a similar path.</li>
<li><strong>Attend virtual events and webinars</strong> — Many organizations host free webinars, conferences, and workshops that cover the latest trends and best practices. These events are excellent opportunities for learning and networking.</li>
</ul>
<p>Remember that expertise is built over time. Be patient with yourself, celebrate small wins, and keep pushing forward. The investment you make in understanding ${keyword} today will pay dividends in the months and years to come.</p>`;
}

// ─── Run Bulk Generation from Templates ─────────────────────────────
function runBulkFromTemplates(templateType, count = 10) {
    const results = { generated: [], errors: [] };
    
    try {
        let articles;
        if (templateType) {
            const keywords = generateFromTemplate(templateType, { maxTotal: count });
            articles = [];
            for (const kw of keywords.slice(0, count)) {
                try {
                    const article = generateArticle(kw.keyword, kw.category);
                    article.templateType = kw.templateType;
                    article.status = 'published';
                    const published = publishPost(article);
                    articles.push(published);
                    results.generated.push({
                        id: published.id,
                        title: published.title,
                        slug: published.slug,
                        keyword: kw.keyword,
                        wordCount: wordCount(published.content)
                    });
                } catch (err) {
                    results.errors.push({ keyword: kw.keyword, error: err.message });
                }
            }
        } else {
            articles = bulkGeneratePages(count);
            for (const article of articles) {
                try {
                    article.status = 'published';
                    const published = publishPost(article);
                    results.generated.push({
                        id: published.id,
                        title: published.title,
                        slug: published.slug,
                        wordCount: wordCount(published.content)
                    });
                } catch (err) {
                    results.errors.push({ error: err.message });
                }
            }
        }
    } catch (err) {
        results.errors.push({ error: err.message });
    }

    return results;
}

// ─── Start Scheduler ────────────────────────────────────────────────
function startScheduler() {
    const config = readConfig();
    
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
    }

    const intervalMs = config.publishIntervalHours * 3600000;

    // Reset daily counter at midnight
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    setTimeout(() => {
        schedulerStatus.todayGenerated = 0;
        setInterval(() => {
            schedulerStatus.todayGenerated = 0;
        }, 86400000);
    }, msUntilMidnight);

    // Content generation interval
    schedulerInterval = setInterval(async () => {
        const currentConfig = readConfig();
        if (!currentConfig.enabled) return;

        // Check daily limit
        if (schedulerStatus.todayGenerated >= currentConfig.postsPerDay) {
            appendLog({ action: 'skipped', reason: 'Daily limit reached' });
            return;
        }

        try {
            await runOnce({ count: 1 });
        } catch (err) {
            appendLog({ action: 'scheduler-error', error: err.message });
            schedulerStatus.errors.push({ time: new Date().toISOString(), error: err.message });
        }

        schedulerStatus.nextRun = new Date(Date.now() + intervalMs).toISOString();
    }, intervalMs);

    // Content refresh interval (check weekly)
    if (config.enableContentRefresh) {
        refreshInterval = setInterval(() => {
            try {
                const result = autoRefreshAll(config.refreshIntervalDays);
                if (result.refreshed > 0) {
                    appendLog({ action: 'content-refresh', refreshed: result.refreshed });
                }
            } catch (err) {
                appendLog({ action: 'refresh-error', error: err.message });
            }
        }, 7 * 86400000); // Every 7 days
    }

    // Update config and status
    config.enabled = true;
    writeConfig(config);

    schedulerStatus.running = true;
    schedulerStatus.startedAt = new Date().toISOString();
    schedulerStatus.nextRun = new Date(Date.now() + intervalMs).toISOString();

    appendLog({ action: 'scheduler-started', intervalHours: config.publishIntervalHours });

    // Run immediately on start
    runOnce({ count: 1 }).catch(err => {
        appendLog({ action: 'initial-run-error', error: err.message });
    });

    return getStatus();
}

// ─── Stop Scheduler ─────────────────────────────────────────────────
function stopScheduler() {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }

    const config = readConfig();
    config.enabled = false;
    writeConfig(config);

    schedulerStatus.running = false;
    schedulerStatus.nextRun = null;

    appendLog({ action: 'scheduler-stopped' });

    return getStatus();
}

// ─── Get Scheduler Status ───────────────────────────────────────────
function getStatus() {
    const config = readConfig();
    const posts = readPosts();
    const autoGenerated = posts.filter(p => p.autoGenerated);
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    const todayCount = autoGenerated.filter(p => p.publishDate && p.publishDate.startsWith(todayStr)).length;
    const weekCount = autoGenerated.filter(p => new Date(p.publishDate) >= weekAgo).length;
    const monthCount = autoGenerated.filter(p => new Date(p.publishDate) >= monthAgo).length;

    return {
        ...schedulerStatus,
        config,
        stats: {
            totalAutoGenerated: autoGenerated.length,
            totalPosts: posts.length,
            generatedToday: todayCount,
            generatedThisWeek: weekCount,
            generatedThisMonth: monthCount,
            staleContent: getStaleContent(config.refreshIntervalDays).length
        }
    };
}

// ─── Get Activity Log ───────────────────────────────────────────────
function getLog(limit = 50) {
    const log = readLog();
    return log.slice(-limit).reverse();
}

// ─── Exports ────────────────────────────────────────────────────────
module.exports = {
    startScheduler,
    stopScheduler,
    getStatus,
    getLog,
    runOnce,
    runBulkFromTemplates,
    readConfig,
    writeConfig,
    publishPost
};
