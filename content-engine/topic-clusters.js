/**
 * HedwigPost Content Engine — Topic Clustering & Authority System
 * 
 * Automatically groups articles into topic clusters and creates pillar pages.
 * Ensures strong topical authority through intelligent linking structure:
 *   - Cluster pages ↔ Pillar pages (bidirectional)
 *   - Related cluster pages ↔ cluster pages
 *   - 5–10 internal links per article enforced
 */

const fs = require('fs');
const path = require('path');
const { generateArticle, capitalize, slugify, wordCount } = require('./article-generator');
const { addInternalLinks } = require('./internal-linker');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CLUSTERS_FILE = path.join(DATA_DIR, 'topic-clusters.json');

// ─── Topic Definitions ──────────────────────────────────────────────
const TOPIC_TAXONOMY = {
    'artificial-intelligence': {
        name: 'Artificial Intelligence',
        keywords: ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'nlp', 'natural language', 'computer vision', 'chatgpt', 'gpt', 'gemini', 'claude', 'llm', 'language model', 'generative ai', 'ai tool'],
        pillarTitle: 'The Complete Guide to Artificial Intelligence',
        subclusters: ['AI Tools', 'Machine Learning', 'ChatGPT', 'AI in Business', 'AI Ethics']
    },
    'web-development': {
        name: 'Web Development',
        keywords: ['web development', 'javascript', 'react', 'vue', 'angular', 'node', 'html', 'css', 'typescript', 'frontend', 'backend', 'full stack', 'next.js', 'api', 'rest', 'graphql'],
        pillarTitle: 'The Ultimate Web Development Guide',
        subclusters: ['Frontend', 'Backend', 'Full Stack', 'JavaScript Frameworks', 'Web Performance']
    },
    'cybersecurity': {
        name: 'Cybersecurity',
        keywords: ['cybersecurity', 'security', 'hacking', 'firewall', 'vpn', 'encryption', 'password', 'malware', 'phishing', 'data breach', 'privacy', 'penetration testing', 'zero day', 'antivirus'],
        pillarTitle: 'The Complete Cybersecurity Guide',
        subclusters: ['Network Security', 'Privacy', 'Ethical Hacking', 'Security Tools', 'Threat Prevention']
    },
    'programming': {
        name: 'Programming',
        keywords: ['programming', 'python', 'java', 'rust', 'go', 'coding', 'software', 'algorithm', 'data structure', 'git', 'github', 'developer', 'devops', 'docker', 'kubernetes'],
        pillarTitle: 'The Complete Programming Guide',
        subclusters: ['Python', 'Java', 'DevOps', 'Algorithms', 'Best Practices']
    },
    'cloud-computing': {
        name: 'Cloud Computing',
        keywords: ['cloud', 'aws', 'azure', 'gcp', 'google cloud', 'server', 'hosting', 'serverless', 'microservices', 'saas', 'paas', 'iaas', 'cloud storage', 'cdn'],
        pillarTitle: 'The Complete Cloud Computing Guide',
        subclusters: ['AWS', 'Azure', 'DevOps', 'Serverless', 'Cloud Migration']
    },
    'data-science': {
        name: 'Data Science',
        keywords: ['data science', 'data analysis', 'analytics', 'pandas', 'numpy', 'pytorch', 'tensorflow', 'bigdata', 'visualization', 'statistics', 'dataset', 'data engineering', 'sql', 'database'],
        pillarTitle: 'The Complete Data Science Guide',
        subclusters: ['Data Analysis', 'Machine Learning', 'Visualization', 'SQL', 'Big Data']
    },
    'social-media': {
        name: 'Social Media',
        keywords: ['social media', 'instagram', 'twitter', 'linkedin', 'tiktok', 'facebook', 'youtube', 'pinterest', 'content marketing', 'influencer', 'viral', 'engagement', 'followers', 'algorithm'],
        pillarTitle: 'The Complete Social Media Marketing Guide',
        subclusters: ['Instagram', 'LinkedIn', 'YouTube', 'Growth Hacking', 'Content Strategy']
    },
    'seo': {
        name: 'SEO',
        keywords: ['seo', 'search engine', 'google', 'ranking', 'keyword', 'backlink', 'on-page', 'off-page', 'organic traffic', 'serp', 'meta tag', 'sitemap', 'schema', 'core web vitals'],
        pillarTitle: 'The Complete SEO Guide',
        subclusters: ['On-Page SEO', 'Technical SEO', 'Link Building', 'Content SEO', 'Local SEO']
    }
};

// ─── Read/Write Clusters ────────────────────────────────────────────
function readClusters() {
    if (!fs.existsSync(CLUSTERS_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(CLUSTERS_FILE, 'utf-8')); }
    catch { return {}; }
}

function writeClusters(clusters) {
    fs.writeFileSync(CLUSTERS_FILE, JSON.stringify(clusters, null, 2));
}

function readPosts() {
    const filePath = path.join(DATA_DIR, 'posts.json');
    if (!fs.existsSync(filePath)) return [];
    try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
    catch { return []; }
}

function writePosts(posts) {
    fs.writeFileSync(path.join(DATA_DIR, 'posts.json'), JSON.stringify(posts, null, 2));
}

// ─── Classify a Post into a Topic ───────────────────────────────────
function classifyPost(post) {
    const text = `${post.title} ${post.keyword || ''} ${(post.tags || []).join(' ')} ${post.category || ''}`.toLowerCase();
    let bestTopic = null;
    let bestScore = 0;

    for (const [topicId, topic] of Object.entries(TOPIC_TAXONOMY)) {
        let score = 0;
        for (const kw of topic.keywords) {
            if (text.includes(kw)) {
                score += kw.split(' ').length; // Multi-word matches score higher
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestTopic = topicId;
        }
    }

    return bestTopic;
}

// ─── Auto-Cluster All Posts ─────────────────────────────────────────
function autoClusterPosts() {
    const posts = readPosts();
    const clusters = {};

    // Initialize cluster objects
    for (const [topicId, topic] of Object.entries(TOPIC_TAXONOMY)) {
        clusters[topicId] = {
            name: topic.name,
            pillarTitle: topic.pillarTitle,
            pillarSlug: slugify(topic.pillarTitle),
            pillarPostId: null,
            posts: [],
            subclusters: {}
        };
        for (const sub of topic.subclusters) {
            clusters[topicId].subclusters[slugify(sub)] = {
                name: sub,
                posts: []
            };
        }
    }

    // Classify each post
    for (const post of posts) {
        if (post.status !== 'published') continue;
        const topicId = classifyPost(post);
        if (!topicId) continue;

        // Check if it's a pillar page
        if (post.isPillar) {
            clusters[topicId].pillarPostId = post.id;
        }

        clusters[topicId].posts.push({
            id: post.id,
            title: post.title,
            slug: post.slug,
            category: post.category,
            keyword: post.keyword
        });

        // Assign to subcluster
        const text = `${post.title} ${post.keyword || ''} ${(post.tags || []).join(' ')}`.toLowerCase();
        for (const [subSlug, sub] of Object.entries(clusters[topicId].subclusters)) {
            if (text.includes(sub.name.toLowerCase())) {
                sub.posts.push(post.id);
                break;
            }
        }
    }

    writeClusters(clusters);
    return clusters;
}

// ─── Generate a Pillar Page ─────────────────────────────────────────
function generatePillarPage(topicId) {
    const topic = TOPIC_TAXONOMY[topicId];
    if (!topic) throw new Error(`Unknown topic: ${topicId}`);

    const clusters = readClusters();
    const cluster = clusters[topicId];
    const posts = readPosts();
    const currentYear = new Date().getFullYear();

    // Build pillar content
    let content = '';
    content += `<p>${topic.name} is one of the fastest-growing fields in technology in ${currentYear}. `;
    content += `This comprehensive guide covers everything you need to know about ${topic.name.toLowerCase()}, `;
    content += `from fundamental concepts to advanced techniques and the latest tools available today.</p>\n\n`;

    // Table of Contents linking to all subclusters
    content += `<nav class="toc">\n<h2 id="table-of-contents">Table of Contents</h2>\n<ul>\n`;
    for (const sub of topic.subclusters) {
        content += `<li><a href="#${slugify(sub)}">${sub}</a></li>\n`;
    }
    content += `<li><a href="#related-articles">Related Articles</a></li>\n`;
    content += `<li><a href="#faqs">Frequently Asked Questions</a></li>\n`;
    content += `</ul>\n</nav>\n\n`;

    // Generate section for each subcluster
    for (const sub of topic.subclusters) {
        const subSlug = slugify(sub);
        content += `<h2 id="${subSlug}">${sub}</h2>\n`;
        content += `<p>${sub} is a crucial aspect of ${topic.name.toLowerCase()} that every professional should understand. `;
        content += `In ${currentYear}, the landscape continues to evolve with new tools, frameworks, and best practices emerging regularly.</p>\n\n`;

        // Key points
        content += `<h3>Key Aspects of ${sub}</h3>\n<ul>\n`;
        content += `<li><strong>Foundation:</strong> Understanding the core principles of ${sub.toLowerCase()} is essential for building expertise in ${topic.name.toLowerCase()}.</li>\n`;
        content += `<li><strong>Tools & Frameworks:</strong> Modern ${sub.toLowerCase()} relies on a rich ecosystem of tools that streamline development and improve productivity.</li>\n`;
        content += `<li><strong>Best Practices:</strong> Following industry-standard best practices ensures quality, maintainability, and scalability.</li>\n`;
        content += `<li><strong>Career Growth:</strong> Mastering ${sub.toLowerCase()} opens doors to numerous career opportunities in the tech industry.</li>\n`;
        content += `<li><strong>Trends in ${currentYear}:</strong> Stay ahead by understanding the latest trends and innovations in ${sub.toLowerCase()}.</li>\n`;
        content += `</ul>\n\n`;

        // Link to cluster posts
        const subPosts = cluster?.subclusters?.[subSlug]?.posts || [];
        if (subPosts.length > 0) {
            content += `<h3>Deep Dives into ${sub}</h3>\n<ul>\n`;
            for (const postId of subPosts.slice(0, 5)) {
                const p = posts.find(x => x.id === postId);
                if (p) {
                    content += `<li><a href="/post/${p.slug}" title="${p.title}">${p.title}</a></li>\n`;
                }
            }
            content += `</ul>\n\n`;
        }
    }

    // Related articles section linking to ALL cluster posts
    const clusterPosts = cluster?.posts || [];
    if (clusterPosts.length > 0) {
        content += `<h2 id="related-articles">All ${topic.name} Articles</h2>\n`;
        content += `<p>Explore our complete collection of ${topic.name.toLowerCase()} articles:</p>\n<ul>\n`;
        for (const cp of clusterPosts.slice(0, 20)) {
            content += `<li><a href="/post/${cp.slug}" title="${cp.title}">${cp.title}</a></li>\n`;
        }
        content += `</ul>\n\n`;
    }

    // FAQs
    content += `<h2 id="faqs">Frequently Asked Questions</h2>\n`;
    const faqs = [
        { q: `What is ${topic.name}?`, a: `${topic.name} encompasses a wide range of technologies and practices focused on ${topic.name.toLowerCase()}. It includes tools, frameworks, methodologies, and best practices used by professionals worldwide.` },
        { q: `How do I get started with ${topic.name}?`, a: `Start with the fundamentals. Read our beginner-friendly guides, follow online tutorials, and practice with hands-on projects. Our ${topic.name.toLowerCase()} cluster pages offer a structured learning path.` },
        { q: `What are the best ${topic.name} tools in ${currentYear}?`, a: `The best tools depend on your specific needs and use case. Our detailed comparison and review articles cover the top tools across every subcategory of ${topic.name.toLowerCase()}.` },
        { q: `Is ${topic.name} good for career growth?`, a: `Absolutely. ${topic.name} skills are in high demand across industries. Professionals with expertise in ${topic.name.toLowerCase()} command competitive salaries and have access to diverse job opportunities.` }
    ];
    for (const faq of faqs) {
        content += `<h3>${faq.q}</h3>\n<p>${faq.a}</p>\n\n`;
    }

    // Conclusion
    content += `<h2 id="conclusion">Conclusion</h2>\n`;
    content += `<p>${topic.name} continues to be one of the most exciting and rapidly evolving fields in technology. `;
    content += `Whether you're a beginner just getting started or an experienced professional looking to deepen your expertise, `;
    content += `our comprehensive collection of ${topic.name.toLowerCase()} articles has something for everyone. `;
    content += `Bookmark this pillar page and check back regularly for the latest updates, guides, and insights.</p>\n`;

    // Create the pillar post
    const pillarPost = {
        id: Date.now().toString(),
        title: `${topic.pillarTitle} in ${currentYear}`,
        slug: slugify(`${topic.pillarTitle} in ${currentYear}`),
        content,
        excerpt: `The definitive guide to ${topic.name.toLowerCase()} in ${currentYear}. Covers all subcategories, tools, best practices, and career insights.`,
        category: topic.name.split(' ').slice(0, 2).join(' '),
        tags: topic.keywords.slice(0, 8),
        keyword: topic.name.toLowerCase(),
        author: 'HedwigPost Team',
        metaTitle: `${topic.pillarTitle} in ${currentYear} — Complete Resource Hub`,
        metaDescription: `Everything you need to know about ${topic.name.toLowerCase()} in ${currentYear}. Comprehensive guide covering ${topic.subclusters.join(', ')}.`,
        status: 'published',
        publishDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        readingTime: Math.ceil(wordCount(content) / 250),
        seoScore: 92,
        autoGenerated: true,
        isPillar: true,
        topicCluster: topicId
    };

    // Save
    const allPosts = readPosts();
    allPosts.push(pillarPost);
    writePosts(allPosts);

    // Update cluster record
    const updatedClusters = readClusters();
    if (updatedClusters[topicId]) {
        updatedClusters[topicId].pillarPostId = pillarPost.id;
    }
    writeClusters(updatedClusters);

    return pillarPost;
}

// ─── Enforce Link Density (5–10 per article) ────────────────────────
function enforceLinkDensity(minLinks = 5, maxLinks = 10) {
    const posts = readPosts();
    const publishedPosts = posts.filter(p => p.status === 'published');
    const clusters = readClusters();
    let updatedCount = 0;

    for (let i = 0; i < posts.length; i++) {
        if (posts[i].status !== 'published') continue;

        const content = posts[i].content;
        // Count existing internal links
        const linkCount = (content.match(/<a\s+href="\/(post|blog)\//g) || []).length;

        if (linkCount < minLinks) {
            // Add more links
            const topicId = classifyPost(posts[i]);
            let candidatePosts = publishedPosts.filter(p => p.id !== posts[i].id);

            // Prioritize same-cluster posts
            if (topicId && clusters[topicId]) {
                const clusterPostIds = new Set(clusters[topicId].posts.map(p => p.id));
                const clusterPosts = candidatePosts.filter(p => clusterPostIds.has(p.id));
                const otherPosts = candidatePosts.filter(p => !clusterPostIds.has(p.id));
                candidatePosts = [...clusterPosts, ...otherPosts];
            }

            const newContent = addInternalLinks(content, posts[i], candidatePosts, maxLinks);
            if (newContent !== content) {
                posts[i].content = newContent;
                posts[i].updatedDate = new Date().toISOString();
                updatedCount++;
            }
        }
    }

    if (updatedCount > 0) writePosts(posts);
    return { updatedCount, totalPosts: publishedPosts.length };
}

// ─── Add Pillar Backlinks to All Cluster Posts ──────────────────────
function addPillarBacklinks() {
    const clusters = readClusters();
    const posts = readPosts();
    let updatedCount = 0;

    for (const [topicId, cluster] of Object.entries(clusters)) {
        if (!cluster.pillarPostId) continue;
        const pillarPost = posts.find(p => p.id === cluster.pillarPostId);
        if (!pillarPost) continue;

        for (const clusterPostRef of cluster.posts) {
            const idx = posts.findIndex(p => p.id === clusterPostRef.id);
            if (idx === -1 || posts[idx].id === pillarPost.id) continue;

            const content = posts[idx].content;
            // Check if pillar backlink already exists
            if (content.includes(`/post/${pillarPost.slug}`)) continue;

            // Add pillar backlink at the end before conclusion
            const backlink = `\n<div class="pillar-link" style="background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.2);border-radius:8px;padding:14px;margin:16px 0;">
<strong>📚 Part of our <a href="/post/${pillarPost.slug}" title="${pillarPost.title}">${cluster.name} Guide</a></strong>
<p style="margin:4px 0 0;font-size:.9em;opacity:.8">This article is part of our comprehensive ${cluster.name.toLowerCase()} series. Read the complete guide for a full overview.</p>
</div>\n`;

            const conclusionIdx = content.lastIndexOf('<h2');
            if (conclusionIdx > 0) {
                posts[idx].content = content.slice(0, conclusionIdx) + backlink + content.slice(conclusionIdx);
            } else {
                posts[idx].content = content + backlink;
            }
            posts[idx].updatedDate = new Date().toISOString();
            updatedCount++;
        }
    }

    if (updatedCount > 0) writePosts(posts);
    return { updatedCount };
}

// ─── Get Cluster Summary ────────────────────────────────────────────
function getClusterSummary() {
    const clusters = readClusters();
    const summary = [];

    for (const [topicId, cluster] of Object.entries(clusters)) {
        summary.push({
            id: topicId,
            name: cluster.name,
            pillarTitle: cluster.pillarTitle,
            hasPillar: !!cluster.pillarPostId,
            postCount: cluster.posts.length,
            subclusters: Object.entries(cluster.subclusters).map(([slug, sub]) => ({
                name: sub.name,
                postCount: sub.posts.length
            }))
        });
    }

    return summary.sort((a, b) => b.postCount - a.postCount);
}

// ─── Exports ────────────────────────────────────────────────────────
module.exports = {
    autoClusterPosts,
    generatePillarPage,
    enforceLinkDensity,
    addPillarBacklinks,
    getClusterSummary,
    classifyPost,
    TOPIC_TAXONOMY
};
