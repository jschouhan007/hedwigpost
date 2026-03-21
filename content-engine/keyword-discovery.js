/**
 * HedwigPost Content Engine — Keyword Discovery
 * 
 * Automatically discovers trending and high-potential keywords from:
 *   - Google Trends RSS
 *   - Reddit (technology, programming, AI subreddits)
 *   - Hacker News top stories
 *   - Built-in seed keyword database
 * 
 * Generates long-tail variations and filters for high traffic potential.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ─── Paths ───────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '..', 'data');
const USED_KEYWORDS_FILE = path.join(DATA_DIR, 'used-keywords.json');

// ─── Seed Keyword Database ──────────────────────────────────────────
const SEED_KEYWORDS = {
    'AI & Machine Learning': [
        'artificial intelligence', 'machine learning', 'deep learning', 'neural networks',
        'natural language processing', 'computer vision', 'chatgpt', 'google gemini',
        'ai tools', 'ai chatbot', 'generative ai', 'ai image generator', 'ai writing tools',
        'ai for business', 'ai automation', 'ai coding assistant', 'openai', 'claude ai',
        'midjourney', 'stable diffusion', 'ai video generator', 'ai voice generator',
        'ai productivity tools', 'ai content creation', 'ai marketing tools',
        'large language models', 'ai agents', 'ai search engine', 'ai trends',
        'prompt engineering', 'rag ai', 'ai safety', 'ai ethics', 'ai regulation',
        'ai in healthcare', 'ai in education', 'ai in finance', 'ai startups'
    ],
    'Programming': [
        'python', 'javascript', 'typescript', 'react', 'nextjs', 'nodejs',
        'web development', 'frontend development', 'backend development', 'full stack',
        'api development', 'rest api', 'graphql', 'database design', 'sql',
        'git', 'github', 'docker', 'kubernetes', 'devops', 'ci cd',
        'coding interview', 'data structures', 'algorithms', 'system design',
        'rust programming', 'go programming', 'kotlin', 'swift', 'flutter',
        'react native', 'tailwind css', 'css frameworks', 'html5', 'pwa',
        'serverless', 'microservices', 'cloud computing', 'aws', 'azure',
        'firebase', 'supabase', 'mongodb', 'postgresql', 'redis',
        'vscode extensions', 'coding tools', 'developer productivity',
        'open source', 'linux', 'command line', 'terminal', 'bash scripting'
    ],
    'Cybersecurity': [
        'cybersecurity', 'ethical hacking', 'penetration testing', 'network security',
        'data privacy', 'vpn', 'password manager', 'two factor authentication',
        'phishing', 'ransomware', 'malware', 'encryption', 'ssl certificate',
        'firewall', 'antivirus', 'data breach', 'dark web', 'identity theft',
        'cyber attack', 'security audit', 'bug bounty', 'kali linux',
        'wifi security', 'mobile security', 'cloud security', 'zero trust',
        'soc analyst', 'incident response', 'digital forensics', 'osint',
        'cybersecurity career', 'cybersecurity certifications', 'comptia', 'cissp'
    ],
    'How-To Guides': [
        'how to speed up pc', 'how to build a website', 'how to learn coding',
        'how to use chatgpt', 'how to protect privacy online', 'how to start a blog',
        'how to make money online', 'how to use linux', 'how to set up vpn',
        'how to backup data', 'how to remove malware', 'how to optimize seo',
        'how to build an app', 'how to use git', 'how to deploy website',
        'how to use docker', 'how to learn python', 'how to create api',
        'how to use ai tools', 'how to automate tasks', 'how to use notion',
        'how to improve wifi', 'how to clean install windows', 'how to dual boot'
    ],
    'Reviews': [
        'laptop review', 'smartphone review', 'tablet review', 'smartwatch review',
        'wireless earbuds review', 'mechanical keyboard review', 'gaming mouse review',
        'monitor review', 'webcam review', 'microphone review', 'speaker review',
        'antivirus review', 'vpn review', 'hosting review', 'website builder review',
        'code editor review', 'ide review', 'project management tool review',
        'cloud storage review', 'email service review', 'crm review',
        'ai tool review', 'productivity app review', 'note taking app review'
    ],
    'Tips & Tricks': [
        'windows tips', 'mac tips', 'android tips', 'iphone tips',
        'chrome extensions', 'browser tips', 'email tips', 'productivity hacks',
        'keyboard shortcuts', 'google search tips', 'excel tips', 'google sheets tips',
        'smartphone hacks', 'battery saving tips', 'storage management',
        'social media tips', 'youtube tips', 'instagram tips', 'linkedin tips',
        'remote work tips', 'work from home tips', 'tech life hacks'
    ],
    'Social Media': [
        'social media marketing', 'instagram growth', 'youtube seo', 'tiktok marketing',
        'twitter marketing', 'linkedin marketing', 'facebook marketing',
        'social media tools', 'content calendar', 'social media analytics',
        'influencer marketing', 'viral content', 'social media trends',
        'social media algorithm', 'hashtag strategy', 'reels tips', 'shorts tips',
        'social media automation', 'community building', 'personal branding'
    ]
};

// ─── Template Patterns for Long-Tail Expansion ──────────────────────
const EXPANSION_TEMPLATES = [
    'best {keyword} for students',
    'best {keyword} for beginners',
    'best {keyword} for business',
    'best {keyword} for developers',
    'best {keyword} for coding',
    'best {keyword} for freelancers',
    'best {keyword} for small business',
    'best {keyword} in {year}',
    'top {keyword} tools in {year}',
    'free {keyword} tools',
    'free {keyword} alternatives',
    '{keyword} for beginners',
    '{keyword} tutorial',
    '{keyword} guide {year}',
    '{keyword} tips and tricks',
    '{keyword} vs alternatives',
    'how to use {keyword}',
    'how to learn {keyword}',
    'what is {keyword}',
    '{keyword} best practices',
    '{keyword} pros and cons',
    '{keyword} complete guide',
    '{keyword} cheat sheet',
    '{keyword} for students',
    '{keyword} career guide',
    '{keyword} certification',
    '{keyword} interview questions',
    '{keyword} salary {year}',
    '{keyword} roadmap {year}',
    '{keyword} projects for beginners'
];

// ─── Audience Segments ──────────────────────────────────────────────
const AUDIENCES = [
    'students', 'beginners', 'developers', 'business owners', 'freelancers',
    'marketers', 'designers', 'startups', 'content creators', 'entrepreneurs',
    'data scientists', 'gamers', 'teachers', 'remote workers', 'bloggers'
];

// ─── Tool/Topic Lists for Comparison Templates ──────────────────────
const COMPARISON_PAIRS = [
    ['ChatGPT', 'Google Gemini'], ['ChatGPT', 'Claude'], ['React', 'Vue'],
    ['React', 'Angular'], ['Python', 'JavaScript'], ['Node.js', 'Django'],
    ['MongoDB', 'PostgreSQL'], ['AWS', 'Azure'], ['Docker', 'Kubernetes'],
    ['Notion', 'Obsidian'], ['VS Code', 'JetBrains'], ['Windows', 'Linux'],
    ['macOS', 'Windows'], ['Android', 'iPhone'], ['WordPress', 'Ghost'],
    ['Tailwind CSS', 'Bootstrap'], ['Firebase', 'Supabase'], ['Next.js', 'Nuxt.js'],
    ['GitHub', 'GitLab'], ['Figma', 'Adobe XD'], ['NordVPN', 'ExpressVPN'],
    ['Bitwarden', '1Password'], ['Chrome', 'Firefox'], ['Grammarly', 'QuillBot'],
    ['Midjourney', 'DALL-E'], ['Copilot', 'Codeium'], ['Vercel', 'Netlify']
];

// ─── Helper: HTTP GET (returns promise of string body) ──────────────
function httpGet(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, { headers: { 'User-Agent': 'HedwigPost/1.0 ContentEngine' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return httpGet(res.headers.location, timeout).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        });
        req.on('error', reject);
        req.setTimeout(timeout, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

// ─── Read/Write Used Keywords ───────────────────────────────────────
function readUsedKeywords() {
    if (!fs.existsSync(USED_KEYWORDS_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(USED_KEYWORDS_FILE, 'utf-8')); }
    catch { return []; }
}

function writeUsedKeywords(keywords) {
    fs.writeFileSync(USED_KEYWORDS_FILE, JSON.stringify(keywords, null, 2));
}

function markKeywordUsed(keyword) {
    const used = readUsedKeywords();
    if (!used.includes(keyword.toLowerCase())) {
        used.push(keyword.toLowerCase());
        writeUsedKeywords(used);
    }
}

// ─── Fetch Google Trends ────────────────────────────────────────────
async function fetchGoogleTrends() {
    const keywords = [];
    try {
        const rssUrl = 'https://trends.google.com/trending/rss?geo=US';
        const xml = await httpGet(rssUrl);
        // Extract titles from RSS items
        const titleMatches = xml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g) || [];
        for (const match of titleMatches) {
            const title = match.replace(/<title><!\[CDATA\[/, '').replace(/\]\]><\/title>/, '').trim();
            if (title && title !== 'Trending Searches Daily' && title.length > 2) {
                keywords.push({
                    keyword: title.toLowerCase(),
                    source: 'google-trends',
                    score: 90 + Math.floor(Math.random() * 10)
                });
            }
        }
    } catch (err) {
        console.log('[KeywordDiscovery] Google Trends fetch failed:', err.message);
    }
    return keywords;
}

// ─── Fetch Reddit Trending Topics ───────────────────────────────────
async function fetchRedditTopics() {
    const subreddits = ['technology', 'programming', 'artificial', 'MachineLearning', 'webdev', 'cybersecurity'];
    const keywords = [];
    for (const sub of subreddits) {
        try {
            const url = `https://www.reddit.com/r/${sub}/hot.json?limit=15`;
            const json = await httpGet(url);
            const data = JSON.parse(json);
            if (data?.data?.children) {
                for (const child of data.data.children) {
                    const title = child.data?.title;
                    if (title && title.length > 10) {
                        // Extract meaningful keyword phrases from title
                        const cleaned = title.toLowerCase()
                            .replace(/[^\w\s]/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
                        if (cleaned.length > 5 && cleaned.length < 100) {
                            keywords.push({
                                keyword: cleaned,
                                source: `reddit-${sub}`,
                                score: 70 + Math.floor(Math.random() * 20)
                            });
                        }
                    }
                }
            }
        } catch (err) {
            console.log(`[KeywordDiscovery] Reddit r/${sub} fetch failed:`, err.message);
        }
    }
    return keywords;
}

// ─── Fetch Hacker News Top Stories ──────────────────────────────────
async function fetchHackerNews() {
    const keywords = [];
    try {
        const idsJson = await httpGet('https://hacker-news.firebaseio.com/v0/topstories.json');
        const ids = JSON.parse(idsJson).slice(0, 20);
        for (const id of ids) {
            try {
                const itemJson = await httpGet(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                const item = JSON.parse(itemJson);
                if (item?.title) {
                    const cleaned = item.title.toLowerCase()
                        .replace(/[^\w\s]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    if (cleaned.length > 5 && cleaned.length < 100) {
                        keywords.push({
                            keyword: cleaned,
                            source: 'hacker-news',
                            score: 75 + Math.floor(Math.random() * 15)
                        });
                    }
                }
            } catch { /* skip individual items that fail */ }
        }
    } catch (err) {
        console.log('[KeywordDiscovery] HackerNews fetch failed:', err.message);
    }
    return keywords;
}

// ─── Generate Seed-Based Keywords ───────────────────────────────────
function generateSeedKeywords() {
    const keywords = [];
    const currentYear = new Date().getFullYear();
    
    for (const [category, seeds] of Object.entries(SEED_KEYWORDS)) {
        for (const seed of seeds) {
            keywords.push({
                keyword: seed,
                source: 'seed-database',
                category,
                score: 60 + Math.floor(Math.random() * 30)
            });
        }
    }
    return keywords;
}

// ─── Expand Keywords into Long-Tail Variations ──────────────────────
function expandKeywords(baseKeywords, maxExpansions = 200) {
    const expanded = [];
    const currentYear = new Date().getFullYear();
    const used = new Set();

    for (const kw of baseKeywords) {
        if (expanded.length >= maxExpansions) break;
        
        // Apply 3-5 random templates per keyword
        const templates = shuffleArray([...EXPANSION_TEMPLATES]).slice(0, 4);
        for (const tpl of templates) {
            if (expanded.length >= maxExpansions) break;
            const variation = tpl
                .replace('{keyword}', kw.keyword || kw)
                .replace('{year}', currentYear.toString());
            
            if (!used.has(variation)) {
                used.add(variation);
                expanded.push({
                    keyword: variation,
                    baseKeyword: kw.keyword || kw,
                    source: 'expansion',
                    category: kw.category || 'Uncategorized',
                    score: Math.max(40, (kw.score || 60) - 10 + Math.floor(Math.random() * 20))
                });
            }
        }
    }

    // Add comparison pairs
    for (const [a, b] of COMPARISON_PAIRS) {
        if (expanded.length >= maxExpansions) break;
        const comparison = `${a.toLowerCase()} vs ${b.toLowerCase()}`;
        if (!used.has(comparison)) {
            used.add(comparison);
            expanded.push({
                keyword: comparison,
                baseKeyword: `${a} vs ${b}`,
                source: 'comparison',
                category: categorizeKeyword(`${a} ${b}`),
                score: 70 + Math.floor(Math.random() * 20)
            });
        }
    }

    // Add "best X for Y" combinations
    for (const [category, seeds] of Object.entries(SEED_KEYWORDS)) {
        for (const seed of seeds.slice(0, 5)) {
            for (const audience of AUDIENCES.slice(0, 5)) {
                if (expanded.length >= maxExpansions) break;
                const bestFor = `best ${seed} for ${audience}`;
                if (!used.has(bestFor)) {
                    used.add(bestFor);
                    expanded.push({
                        keyword: bestFor,
                        baseKeyword: seed,
                        source: 'best-for',
                        category,
                        score: 65 + Math.floor(Math.random() * 25)
                    });
                }
            }
        }
    }

    return expanded;
}

// ─── Categorize a keyword based on seed matches ─────────────────────
function categorizeKeyword(keyword) {
    const kw = keyword.toLowerCase();
    for (const [category, seeds] of Object.entries(SEED_KEYWORDS)) {
        for (const seed of seeds) {
            if (kw.includes(seed) || seed.includes(kw)) {
                return category;
            }
        }
    }
    // Fallback heuristics
    if (/\b(ai|artificial|machine learning|chatgpt|gemini|llm|gpt)\b/i.test(kw)) return 'AI & Machine Learning';
    if (/\b(code|coding|programming|python|javascript|react|developer|api)\b/i.test(kw)) return 'Programming';
    if (/\b(security|hack|privacy|vpn|malware|phishing|encryption)\b/i.test(kw)) return 'Cybersecurity';
    if (/\b(how to|guide|tutorial|step by step)\b/i.test(kw)) return 'How-To Guides';
    if (/\b(review|comparison|vs|best|top)\b/i.test(kw)) return 'Reviews';
    if (/\b(tips|tricks|hacks|shortcuts)\b/i.test(kw)) return 'Tips & Tricks';
    if (/\b(social media|instagram|youtube|tiktok|twitter)\b/i.test(kw)) return 'Social Media';
    return 'AI & Machine Learning'; // default
}

// ─── Filter unused high-potential keywords ──────────────────────────
function getUnusedKeywords(keywords, maxResults = 50) {
    const usedList = readUsedKeywords();
    const usedSet = new Set(usedList.map(k => k.toLowerCase()));

    return keywords
        .filter(kw => !usedSet.has(kw.keyword.toLowerCase()))
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, maxResults);
}

// ─── Master Discovery Function ──────────────────────────────────────
async function discoverKeywords(options = {}) {
    const {
        includeSeeds = true,
        includeTrending = true,
        includeReddit = true,
        includeHackerNews = true,
        expandResults = true,
        maxResults = 100
    } = options;

    let allKeywords = [];

    // Gather from all sources in parallel
    const fetches = [];
    if (includeTrending) fetches.push(fetchGoogleTrends());
    if (includeReddit) fetches.push(fetchRedditTopics());
    if (includeHackerNews) fetches.push(fetchHackerNews());

    const results = await Promise.allSettled(fetches);
    for (const result of results) {
        if (result.status === 'fulfilled') {
            allKeywords.push(...result.value);
        }
    }

    // Add seed keywords
    if (includeSeeds) {
        allKeywords.push(...generateSeedKeywords());
    }

    // Deduplicate
    const seen = new Set();
    allKeywords = allKeywords.filter(kw => {
        const key = kw.keyword.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Assign categories to uncategorized keywords
    allKeywords = allKeywords.map(kw => ({
        ...kw,
        category: kw.category || categorizeKeyword(kw.keyword)
    }));

    // Expand into long-tail variations
    if (expandResults) {
        const expanded = expandKeywords(allKeywords, maxResults * 2);
        allKeywords.push(...expanded);
        // Deduplicate again
        const seen2 = new Set();
        allKeywords = allKeywords.filter(kw => {
            const key = kw.keyword.toLowerCase();
            if (seen2.has(key)) return false;
            seen2.add(key);
            return true;
        });
    }

    // Filter out used keywords and sort by score
    return getUnusedKeywords(allKeywords, maxResults);
}

// ─── Get Keywords by Category ───────────────────────────────────────
async function discoverKeywordsByCategory(category, count = 20) {
    const all = await discoverKeywords({ maxResults: 500 });
    return all
        .filter(kw => kw.category === category)
        .slice(0, count);
}

// ─── Utility: Shuffle Array ─────────────────────────────────────────
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ─── Exports ────────────────────────────────────────────────────────
module.exports = {
    discoverKeywords,
    discoverKeywordsByCategory,
    expandKeywords,
    getUnusedKeywords,
    markKeywordUsed,
    generateSeedKeywords,
    categorizeKeyword,
    SEED_KEYWORDS,
    AUDIENCES,
    COMPARISON_PAIRS,
    EXPANSION_TEMPLATES
};
