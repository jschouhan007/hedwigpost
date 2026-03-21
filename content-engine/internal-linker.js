/**
 * HedwigPost Content Engine — Internal Linking Engine
 * 
 * Automatically inserts 5–10 contextual internal links per article
 * by analyzing existing posts for keyword/topic overlaps.
 */

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');

// ─── Read Posts ─────────────────────────────────────────────────────
function readPosts() {
    const filePath = path.join(DATA_DIR, 'posts.json');
    if (!fs.existsSync(filePath)) return [];
    try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
    catch { return []; }
}

// ─── Extract Keywords from a Post ───────────────────────────────────
function extractPostKeywords(post) {
    const keywords = new Set();
    
    // From title
    const titleWords = post.title.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3);
    titleWords.forEach(w => keywords.add(w));

    // From tags
    if (post.tags) {
        post.tags.forEach(tag => keywords.add(tag.toLowerCase()));
    }

    // From category
    if (post.category) {
        keywords.add(post.category.toLowerCase());
    }

    // Primary keyword if available
    if (post.keyword) {
        keywords.add(post.keyword.toLowerCase());
    }

    return [...keywords];
}

// ─── Find Related Posts ─────────────────────────────────────────────
function findRelatedPosts(targetPost, allPosts, maxLinks = 10) {
    const targetKeywords = extractPostKeywords(targetPost);
    const scored = [];

    for (const post of allPosts) {
        if (post.id === targetPost.id) continue;
        if (post.status !== 'published') continue;

        const postKeywords = extractPostKeywords(post);
        let score = 0;

        // Score: keyword overlap
        for (const kw of targetKeywords) {
            for (const pk of postKeywords) {
                if (kw === pk) score += 3;
                else if (pk.includes(kw) || kw.includes(pk)) score += 1;
            }
        }

        // Score: same category
        if (post.category === targetPost.category) score += 2;

        // Score: shared tags
        if (post.tags && targetPost.tags) {
            const shared = post.tags.filter(t => targetPost.tags.includes(t));
            score += shared.length * 2;
        }

        if (score > 0) {
            scored.push({ post, score });
        }
    }

    // Sort by score descending, take top N
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, maxLinks)
        .map(s => s.post);
}

// ─── Insert Internal Links into Content ─────────────────────────────
function addInternalLinks(postContent, targetPost, allPosts, maxLinks = 7) {
    const relatedPosts = findRelatedPosts(targetPost, allPosts, maxLinks + 5);
    if (relatedPosts.length === 0) return postContent;

    let content = postContent;
    let insertedCount = 0;

    // Strategy 1: Link within paragraph text by finding keyword matches
    for (const related of relatedPosts) {
        if (insertedCount >= maxLinks) break;

        // Build possible anchor texts from the related post
        const anchors = [
            related.title,
            ...(related.tags || []).filter(t => t.length > 3),
            related.keyword || ''
        ].filter(a => a && a.length > 3);

        for (const anchor of anchors) {
            if (insertedCount >= maxLinks) break;

            // Look for the anchor text in paragraphs (case-insensitive), but only if not already linked
            const escapedAnchor = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(
                `(?<!<a[^>]*>)(?<![\\w-])${escapedAnchor}(?![\\w-])(?![^<]*<\\/a>)`,
                'i'
            );

            if (regex.test(content)) {
                const link = `<a href="/post/${related.slug}" title="${related.title}">${anchor}</a>`;
                content = content.replace(regex, link);
                insertedCount++;
                break; // One link per related post
            }
        }
    }

    // Strategy 2: If we haven't inserted enough links, add a "Related Articles" section
    if (insertedCount < 3 && relatedPosts.length > 0) {
        const remaining = relatedPosts.slice(0, Math.min(5, maxLinks - insertedCount));
        if (remaining.length > 0) {
            let relatedSection = '\n<h3>Related Articles You Might Like</h3>\n<ul>\n';
            for (const rp of remaining) {
                relatedSection += `<li><a href="/post/${rp.slug}" title="${rp.title}">${rp.title}</a></li>\n`;
                insertedCount++;
            }
            relatedSection += '</ul>\n';

            // Insert before the conclusion/last h2
            const conclusionIdx = content.lastIndexOf('<h2');
            if (conclusionIdx > 0) {
                content = content.slice(0, conclusionIdx) + relatedSection + content.slice(conclusionIdx);
            } else {
                content += relatedSection;
            }
        }
    }

    return content;
}

// ─── Relink All Posts ───────────────────────────────────────────────
function relinkAllPosts(maxLinksPerPost = 7) {
    const posts = readPosts();
    const publishedPosts = posts.filter(p => p.status === 'published');
    let updatedCount = 0;

    for (let i = 0; i < posts.length; i++) {
        if (posts[i].status !== 'published') continue;

        const originalContent = posts[i].content;
        const newContent = addInternalLinks(originalContent, posts[i], publishedPosts, maxLinksPerPost);

        if (newContent !== originalContent) {
            posts[i].content = newContent;
            posts[i].updatedDate = new Date().toISOString();
            updatedCount++;
        }
    }

    if (updatedCount > 0) {
        fs.writeFileSync(path.join(DATA_DIR, 'posts.json'), JSON.stringify(posts, null, 2));
    }

    return { updatedCount, totalPosts: publishedPosts.length };
}

// ─── Exports ────────────────────────────────────────────────────────
module.exports = {
    addInternalLinks,
    relinkAllPosts,
    findRelatedPosts,
    extractPostKeywords
};
