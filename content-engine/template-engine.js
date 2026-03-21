/**
 * HedwigPost Content Engine — Programmatic SEO Template Engine
 * 
 * Generates hundreds of unique SEO pages from template patterns:
 *   - "Best {tool} for {audience}"
 *   - "{topic} for beginners"
 *   - "{tool} vs {tool}"
 *   - "How to {action} with {tool}"
 *   - "Top {N} {topic} in {year}"
 */

const { generateArticle, capitalize, slugify } = require('./article-generator');
const { SEED_KEYWORDS, AUDIENCES, COMPARISON_PAIRS, markKeywordUsed } = require('./keyword-discovery');

const CURRENT_YEAR = new Date().getFullYear();

// ─── Template Definitions ───────────────────────────────────────────

const TEMPLATE_TYPES = {
    'best-for': {
        name: 'Best {tool} for {audience}',
        description: 'Generates "Best X for Y" recommendation pages',
        pattern: (tool, audience) => `best ${tool} for ${audience}`
    },
    'beginners-guide': {
        name: '{topic} for beginners',
        description: 'Generates beginner-friendly guide pages',
        pattern: (topic) => `${topic} for beginners`
    },
    'comparison': {
        name: '{tool} vs {tool}',
        description: 'Generates head-to-head comparison pages',
        pattern: (toolA, toolB) => `${toolA} vs ${toolB}`
    },
    'how-to': {
        name: 'How to {action} with {tool}',
        description: 'Generates how-to tutorial pages',
        pattern: (action, tool) => `how to ${action} with ${tool}`
    },
    'top-list': {
        name: 'Top {N} {topic} in {year}',
        description: 'Generates numbered listicle pages',
        pattern: (topic, n) => `top ${n || 10} ${topic} in ${CURRENT_YEAR}`
    }
};

// ─── Actions for How-To Templates ───────────────────────────────────
const ACTIONS = [
    'get started', 'learn', 'use', 'master', 'build projects',
    'make money', 'get a job', 'improve skills', 'automate tasks',
    'increase productivity', 'create content', 'build a portfolio',
    'prepare for interviews', 'start a career', 'freelance'
];

// ─── Variable Expansion ─────────────────────────────────────────────
function getToolsByCategory(category) {
    return SEED_KEYWORDS[category] || SEED_KEYWORDS['AI & Machine Learning'];
}

// ─── Generate Pages from "Best X for Y" Template ────────────────────
function generateBestForPages(options = {}) {
    const {
        categories = Object.keys(SEED_KEYWORDS),
        audiences = AUDIENCES,
        maxPerCategory = 5,
        maxTotal = 50
    } = options;

    const keywords = [];
    for (const category of categories) {
        const tools = getToolsByCategory(category).slice(0, maxPerCategory);
        for (const tool of tools) {
            for (const audience of audiences.slice(0, 4)) {
                if (keywords.length >= maxTotal) break;
                keywords.push({
                    keyword: TEMPLATE_TYPES['best-for'].pattern(tool, audience),
                    category,
                    templateType: 'best-for'
                });
            }
            if (keywords.length >= maxTotal) break;
        }
        if (keywords.length >= maxTotal) break;
    }
    return keywords;
}

// ─── Generate Pages from Beginners Guide Template ───────────────────
function generateBeginnersGuidePages(options = {}) {
    const {
        categories = Object.keys(SEED_KEYWORDS),
        maxPerCategory = 8,
        maxTotal = 50
    } = options;

    const keywords = [];
    for (const category of categories) {
        const topics = getToolsByCategory(category).slice(0, maxPerCategory);
        for (const topic of topics) {
            if (keywords.length >= maxTotal) break;
            keywords.push({
                keyword: TEMPLATE_TYPES['beginners-guide'].pattern(topic),
                category,
                templateType: 'beginners-guide'
            });
        }
        if (keywords.length >= maxTotal) break;
    }
    return keywords;
}

// ─── Generate Pages from Comparison Template ────────────────────────
function generateComparisonPages(options = {}) {
    const { maxTotal = 50 } = options;
    const keywords = [];
    for (const [a, b] of COMPARISON_PAIRS) {
        if (keywords.length >= maxTotal) break;
        keywords.push({
            keyword: TEMPLATE_TYPES['comparison'].pattern(a.toLowerCase(), b.toLowerCase()),
            category: 'Reviews',
            templateType: 'comparison'
        });
    }
    return keywords;
}

// ─── Generate Pages from How-To Template ────────────────────────────
function generateHowToPages(options = {}) {
    const {
        categories = Object.keys(SEED_KEYWORDS),
        actions = ACTIONS,
        maxPerCategory = 5,
        maxTotal = 50
    } = options;

    const keywords = [];
    for (const category of categories) {
        const tools = getToolsByCategory(category).slice(0, maxPerCategory);
        for (const tool of tools) {
            const action = actions[Math.floor(Math.random() * actions.length)];
            if (keywords.length >= maxTotal) break;
            keywords.push({
                keyword: TEMPLATE_TYPES['how-to'].pattern(action, tool),
                category: 'How-To Guides',
                templateType: 'how-to'
            });
        }
        if (keywords.length >= maxTotal) break;
    }
    return keywords;
}

// ─── Generate Pages from Top-List Template ──────────────────────────
function generateTopListPages(options = {}) {
    const {
        categories = Object.keys(SEED_KEYWORDS),
        maxPerCategory = 8,
        maxTotal = 50
    } = options;

    const keywords = [];
    for (const category of categories) {
        const topics = getToolsByCategory(category).slice(0, maxPerCategory);
        for (const topic of topics) {
            if (keywords.length >= maxTotal) break;
            const n = [5, 7, 10, 12, 15][Math.floor(Math.random() * 5)];
            keywords.push({
                keyword: TEMPLATE_TYPES['top-list'].pattern(topic, n),
                category,
                templateType: 'top-list'
            });
        }
        if (keywords.length >= maxTotal) break;
    }
    return keywords;
}

// ─── Master Template Generator ──────────────────────────────────────
function generateFromTemplate(templateType, options = {}) {
    const generators = {
        'best-for': generateBestForPages,
        'beginners-guide': generateBeginnersGuidePages,
        'comparison': generateComparisonPages,
        'how-to': generateHowToPages,
        'top-list': generateTopListPages
    };

    const generator = generators[templateType];
    if (!generator) {
        throw new Error(`Unknown template type: ${templateType}. Available: ${Object.keys(generators).join(', ')}`);
    }

    return generator(options);
}

// ─── Bulk Generate Pages from All Templates ─────────────────────────
function bulkGeneratePages(count = 100) {
    const allKeywords = [];
    const perTemplate = Math.ceil(count / 5);

    allKeywords.push(...generateBestForPages({ maxTotal: perTemplate }));
    allKeywords.push(...generateBeginnersGuidePages({ maxTotal: perTemplate }));
    allKeywords.push(...generateComparisonPages({ maxTotal: perTemplate }));
    allKeywords.push(...generateHowToPages({ maxTotal: perTemplate }));
    allKeywords.push(...generateTopListPages({ maxTotal: perTemplate }));

    // Shuffle and limit
    const shuffled = allKeywords.sort(() => Math.random() - 0.5).slice(0, count);

    // Generate actual articles
    const articles = [];
    for (let i = 0; i < shuffled.length; i++) {
        try {
            const kw = shuffled[i];
            const article = generateArticle(kw.keyword, kw.category);
            article.templateType = kw.templateType;
            // Stagger publish dates
            const offset = i * (3 + Math.random() * 5) * 3600000;
            article.publishDate = new Date(Date.now() + offset).toISOString();
            article.id = (Date.now() + i).toString();
            articles.push(article);
        } catch (err) {
            console.log(`[TemplateEngine] Error generating page:`, err.message);
        }
    }

    return articles;
}

// ─── Get Available Templates Info ───────────────────────────────────
function getTemplateInfo() {
    return Object.entries(TEMPLATE_TYPES).map(([key, val]) => ({
        id: key,
        name: val.name,
        description: val.description
    }));
}

// ─── Exports ────────────────────────────────────────────────────────
module.exports = {
    generateFromTemplate,
    bulkGeneratePages,
    getTemplateInfo,
    generateBestForPages,
    generateBeginnersGuidePages,
    generateComparisonPages,
    generateHowToPages,
    generateTopListPages,
    TEMPLATE_TYPES,
    ACTIONS
};
