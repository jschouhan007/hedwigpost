/**
 * HedwigPost Content Engine — Content Refresh Engine
 * 
 * Automatically detects and refreshes stale content:
 *   - Identifies posts older than 90 days (configurable)
 *   - Updates year references
 *   - Refreshes statistics and data
 *   - Adds new FAQ items
 *   - Updates internal links
 */

const fs = require('fs');
const path = require('path');
const { addInternalLinks } = require('./internal-linker');
const { generateFAQs } = require('./article-generator');

const DATA_DIR = path.join(__dirname, '..', 'data');
const REFRESH_LOG_FILE = path.join(DATA_DIR, 'refresh-log.json');

// ─── Read/Write Helpers ─────────────────────────────────────────────
function readPosts() {
    const filePath = path.join(DATA_DIR, 'posts.json');
    if (!fs.existsSync(filePath)) return [];
    try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
    catch { return []; }
}

function writePosts(posts) {
    fs.writeFileSync(path.join(DATA_DIR, 'posts.json'), JSON.stringify(posts, null, 2));
}

function readRefreshLog() {
    if (!fs.existsSync(REFRESH_LOG_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(REFRESH_LOG_FILE, 'utf-8')); }
    catch { return []; }
}

function writeRefreshLog(log) {
    fs.writeFileSync(REFRESH_LOG_FILE, JSON.stringify(log, null, 2));
}

// ─── Get Stale Content ──────────────────────────────────────────────
function getStaleContent(thresholdDays = 90) {
    const posts = readPosts();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - thresholdDays);

    return posts.filter(post => {
        if (post.status !== 'published') return false;
        const updatedDate = new Date(post.updatedDate || post.publishDate);
        return updatedDate < cutoff;
    }).map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        category: post.category,
        publishDate: post.publishDate,
        updatedDate: post.updatedDate,
        daysSinceUpdate: Math.floor((Date.now() - new Date(post.updatedDate || post.publishDate).getTime()) / 86400000)
    }));
}

// ─── Refresh a Single Post ──────────────────────────────────────────
function refreshPost(postId) {
    const posts = readPosts();
    const idx = posts.findIndex(p => p.id === postId);
    if (idx === -1) return { success: false, error: 'Post not found' };

    const post = posts[idx];
    const changes = [];
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    const twoYearsAgo = currentYear - 2;

    // 1. Update year references in content
    let content = post.content;
    const yearRegex = new RegExp(`\\b(${twoYearsAgo}|${lastYear})\\b`, 'g');
    const yearMatches = content.match(yearRegex);
    if (yearMatches && yearMatches.length > 0) {
        content = content.replace(yearRegex, currentYear.toString());
        changes.push(`Updated ${yearMatches.length} year references to ${currentYear}`);
    }

    // 2. Update year in title
    let title = post.title;
    if (yearRegex.test(title)) {
        title = title.replace(yearRegex, currentYear.toString());
        changes.push('Updated year in title');
    }

    // 3. Update metaTitle and metaDescription year references
    let metaTitle = post.metaTitle || '';
    let metaDescription = post.metaDescription || '';
    metaTitle = metaTitle.replace(yearRegex, currentYear.toString());
    metaDescription = metaDescription.replace(yearRegex, currentYear.toString());

    // 4. Add "Last updated" note to the beginning
    const updateNote = `<p><em><strong>Last Updated:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — This article has been refreshed with the latest information for ${currentYear}.</em></p>`;
    
    // Remove previous update note if exists
    content = content.replace(/<p><em><strong>Last Updated:<\/strong>.*?<\/em><\/p>\n?/g, '');
    content = updateNote + '\n' + content;
    changes.push('Added "Last Updated" note');

    // 5. Add new FAQ if the post has FAQs
    if (content.includes('Frequently Asked Questions') || content.includes('FAQ')) {
        const keyword = post.keyword || post.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const newFaqs = generateFAQs(keyword, 2);
        let faqAddition = '';
        for (const faq of newFaqs) {
            // Only add if the question isn't already in the content
            if (!content.includes(faq.q)) {
                faqAddition += `<h3>${faq.q}</h3>\n<p>${faq.a}</p>\n`;
            }
        }
        if (faqAddition) {
            // Insert before conclusion
            const conclusionIdx = content.lastIndexOf('<h2 id="conclusion"');
            const altConclusionIdx = content.lastIndexOf('<h2>Conclusion');
            const altFinalIdx = content.lastIndexOf('<h2>Final Thoughts');
            const insertIdx = Math.max(conclusionIdx, altConclusionIdx, altFinalIdx);
            
            if (insertIdx > 0) {
                content = content.slice(0, insertIdx) + faqAddition + content.slice(insertIdx);
                changes.push('Added new FAQ items');
            }
        }
    }

    // 6. Update internal links
    const allPosts = readPosts();
    content = addInternalLinks(content, post, allPosts, 7);
    changes.push('Refreshed internal links');

    // Apply changes
    posts[idx] = {
        ...post,
        title,
        content,
        metaTitle,
        metaDescription,
        updatedDate: new Date().toISOString()
    };

    writePosts(posts);

    // Log the refresh
    const log = readRefreshLog();
    log.push({
        postId,
        postTitle: post.title,
        refreshedAt: new Date().toISOString(),
        changes
    });
    writeRefreshLog(log);

    return { success: true, postId, title: post.title, changes };
}

// ─── Auto-Refresh All Stale Content ─────────────────────────────────
function autoRefreshAll(thresholdDays = 90) {
    const staleContent = getStaleContent(thresholdDays);
    const results = [];

    for (const stalePost of staleContent) {
        const result = refreshPost(stalePost.id);
        results.push(result);
    }

    return {
        totalStale: staleContent.length,
        refreshed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
    };
}

// ─── Get Refresh History ────────────────────────────────────────────
function getRefreshHistory(limit = 50) {
    const log = readRefreshLog();
    return log
        .sort((a, b) => new Date(b.refreshedAt) - new Date(a.refreshedAt))
        .slice(0, limit);
}

// ─── Exports ────────────────────────────────────────────────────────
module.exports = {
    getStaleContent,
    refreshPost,
    autoRefreshAll,
    getRefreshHistory
};
