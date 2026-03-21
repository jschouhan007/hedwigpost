/**
 * AMP Page Generator for HedwigPost
 * Generates valid AMP HTML pages from blog post data.
 * Handles: img→amp-img, iframe→amp-youtube, video→amp-video,
 *          inline style stripping, JS removal, structured data, and more.
 */

// ─── AMP Content Converter ──────────────────────────────────────────────────

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(src) {
    if (!src) return null;
    // /embed/VIDEO_ID
    let m = src.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    // watch?v=VIDEO_ID
    m = src.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    // youtu.be/VIDEO_ID
    m = src.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    return null;
}

/**
 * Convert standard HTML content to AMP-compliant HTML.
 * Returns { html, components } where components is a Set of required AMP component names.
 */
function convertToAmpContent(html) {
    if (!html) return { html: '', components: new Set() };

    const components = new Set();
    let content = html;

    // 1. Remove <script> tags entirely
    content = content.replace(/<script[\s\S]*?<\/script>/gi, '');

    // 2. Remove <style> tags entirely
    content = content.replace(/<style[\s\S]*?<\/style>/gi, '');

    // 3. Remove editor-specific resize wrappers (keep inner img)
    content = content.replace(/<div\s+class="img-resize-wrap"[^>]*>([\s\S]*?)<\/div>\s*(<div\s+class="resize-handle[^"]*"><\/div>\s*)*(<div\s+class="img-center-guide"[^>]*><\/div>\s*)?/gi, '$1');
    // Remove leftover resize handles and center guides
    content = content.replace(/<div\s+class="resize-handle[^"]*"[^>]*><\/div>/gi, '');
    content = content.replace(/<div\s+class="img-center-guide"[^>]*><\/div>/gi, '');

    // 4. Convert YouTube iframes → <amp-youtube>
    content = content.replace(/<div\s+class="yt-embed-wrap"[^>]*>[\s\S]*?<iframe[^>]*src="([^"]*)"[^>]*>[\s\S]*?<\/iframe>[\s\S]*?<\/div>/gi, (match, src) => {
        const videoId = extractYouTubeId(src);
        if (videoId) {
            components.add('amp-youtube');
            return `<amp-youtube data-videoid="${videoId}" layout="responsive" width="480" height="270"></amp-youtube>`;
        }
        return '';
    });

    // Also handle bare YouTube iframes (not wrapped in yt-embed-wrap)
    content = content.replace(/<iframe[^>]*src="([^"]*youtube[^"]*)"[^>]*>[\s\S]*?<\/iframe>/gi, (match, src) => {
        const videoId = extractYouTubeId(src);
        if (videoId) {
            components.add('amp-youtube');
            return `<amp-youtube data-videoid="${videoId}" layout="responsive" width="480" height="270"></amp-youtube>`;
        }
        return '';
    });

    // 5. Remove all remaining iframes (non-AMP-safe)
    content = content.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
    content = content.replace(/<iframe[^>]*\/?\s*>/gi, '');

    // 6. Convert <video> → <amp-video>
    content = content.replace(/<video([^>]*)>([\s\S]*?)<\/video>/gi, (match, attrs, inner) => {
        components.add('amp-video');
        // Try to extract src
        let src = '';
        const srcMatch = attrs.match(/src="([^"]*)"/i);
        if (srcMatch) src = srcMatch[1];
        // Check for <source> tags inside
        const sourceMatch = inner.match(/<source[^>]*src="([^"]*)"/i);
        if (!src && sourceMatch) src = sourceMatch[1];
        return `<amp-video layout="responsive" width="640" height="360" ${src ? `src="${src}"` : ''} controls>${inner}</amp-video>`;
    });

    // 7. Convert <img> → <amp-img>
    content = content.replace(/<img\s+([^>]*)\/?\s*>/gi, (match, attrs) => {
        // Extract src
        const srcMatch = attrs.match(/src="([^"]*)"/i);
        const altMatch = attrs.match(/alt="([^"]*)"/i);
        const src = srcMatch ? srcMatch[1] : '';
        const alt = altMatch ? altMatch[1] : '';

        // Try to extract width/height from style or attributes
        let width = 800, height = 450;
        const wAttr = attrs.match(/width[=:]\s*"?(\d+)/i);
        const hAttr = attrs.match(/height[=:]\s*"?(\d+)/i);
        if (wAttr) width = parseInt(wAttr[1]);
        if (hAttr) height = parseInt(hAttr[1]);

        // Try style-based dimensions
        const styleWMatch = attrs.match(/width:\s*(\d+)px/i);
        const styleHMatch = attrs.match(/height:\s*([\d.]+)px/i);
        if (styleWMatch) width = parseInt(styleWMatch[1]);
        if (styleHMatch) height = Math.round(parseFloat(styleHMatch[1]));

        if (!src) return '';
        return `<amp-img src="${src}" alt="${alt}" width="${width}" height="${height}" layout="responsive"></amp-img>`;
    });

    // 8. Strip all inline style attributes
    content = content.replace(/\s+style="[^"]*"/gi, '');

    // 9. Strip onclick and other event handler attributes
    content = content.replace(/\s+on\w+="[^"]*"/gi, '');

    // 10. Strip class attributes that are editor-specific
    content = content.replace(/\s+class="editor-img"/gi, '');

    // 11. Unwrap <font> tags (keep inner content)
    content = content.replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, '$1');

    // 12. Clean data-* attributes from CMS editor (preserve AMP-required data attributes)
    content = content.replace(/\s+data-(?!videoid|ad-|auto-|full-|credentials)[\w-]+="[^"]*"/gi, '');

    // 13. Remove empty divs/paragraphs with only whitespace or <br>
    content = content.replace(/<div>\s*<br\s*\/?>\s*<\/div>/gi, '');
    content = content.replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '');

    return { html: content, components };
}


// ─── AMP CSS (inline, under 75KB) ───────────────────────────────────────────

function getAmpStyles() {
    return `
/* AMP Custom Styles for HedwigPost */
:root {
  --bg-0: #0a0a0f;
  --bg-1: #12121a;
  --bg-card: #1a1a2e;
  --text-0: #f0f0f5;
  --text-1: #c8c8d8;
  --text-2: #9898b0;
  --text-3: #686888;
  --accent: #8b5cf6;
  --accent-2: #06b6d4;
  --border: #2a2a40;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --content-width: 780px;
  --radius: 12px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--font-sans);
  background: var(--bg-0);
  color: var(--text-1);
  line-height: 1.8;
  font-size: 17px;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

/* Header */
.amp-header {
  background: rgba(10,10,15,0.95);
  border-bottom: 1px solid var(--border);
  padding: 14px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
}
.amp-nav {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.amp-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--text-0);
  text-decoration: none;
}
.amp-logo amp-img { border-radius: 6px; }
.amp-nav-links { display: flex; gap: 20px; list-style: none; }
.amp-nav-links a { color: var(--text-2); font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }
.amp-nav-links a:hover { color: var(--text-0); text-decoration: none; }
.amp-menu-btn {
  display: none;
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: var(--text-1);
  font-size: 1.2rem;
}
@media(max-width:768px) {
  .amp-nav-links { display: none; }
  .amp-menu-btn { display: block; }
}

/* Sidebar */
amp-sidebar {
  background: var(--bg-1);
  width: 280px;
  padding: 24px;
}
.amp-sidebar-close {
  background: none;
  border: none;
  color: var(--text-1);
  font-size: 1.5rem;
  cursor: pointer;
  margin-bottom: 20px;
}
.amp-sidebar-links { list-style: none; }
.amp-sidebar-links li { margin-bottom: 12px; }
.amp-sidebar-links a {
  color: var(--text-1);
  font-size: 1rem;
  font-weight: 500;
  display: block;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

/* AMP Badge */
.amp-badge-bar {
  max-width: var(--content-width);
  margin: 20px auto 0;
  padding: 0 24px;
}
.amp-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #8b5cf6, #06b6d4);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* Breadcrumb */
.amp-breadcrumb {
  max-width: var(--content-width);
  margin: 16px auto;
  padding: 0 24px;
  font-size: 0.82rem;
  color: var(--text-3);
  font-family: var(--font-mono);
}
.amp-breadcrumb a { color: var(--text-3); }
.amp-breadcrumb span { margin: 0 6px; }

/* Article Header */
.amp-article-header {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0 24px 20px;
}
.amp-category-badge {
  display: inline-block;
  background: rgba(139,92,246,0.15);
  color: var(--accent);
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.amp-article-header h1 {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--text-0);
  line-height: 1.25;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}
.amp-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.85rem;
  color: var(--text-3);
  font-family: var(--font-mono);
}
.amp-meta-item { display: flex; align-items: center; gap: 5px; }

/* Featured Image */
.amp-featured-image {
  max-width: var(--content-width);
  margin: 0 auto 30px;
  padding: 0 24px;
}
.amp-featured-image amp-img { border-radius: var(--radius); }

/* Article Content */
.amp-content {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0 24px;
}
.amp-content h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-0); margin: 36px 0 16px; letter-spacing: -0.01em; }
.amp-content h2 { font-size: 1.55rem; font-weight: 700; color: var(--text-0); margin: 32px 0 14px; padding-bottom: 8px; border-bottom: 2px solid var(--border); }
.amp-content h3 { font-size: 1.25rem; font-weight: 600; color: var(--text-0); margin: 24px 0 10px; }
.amp-content h4 { font-size: 1.1rem; font-weight: 600; color: var(--text-0); margin: 20px 0 8px; }
.amp-content p { margin-bottom: 18px; color: var(--text-1); }
.amp-content ul, .amp-content ol { margin: 0 0 18px 24px; color: var(--text-1); }
.amp-content li { margin-bottom: 8px; }
.amp-content strong { color: var(--text-0); font-weight: 600; }
.amp-content em { font-style: italic; }
.amp-content a { color: var(--accent); border-bottom: 1px solid transparent; }
.amp-content a:hover { border-bottom-color: var(--accent); text-decoration: none; }
.amp-content blockquote {
  border-left: 4px solid var(--accent);
  background: var(--bg-card);
  padding: 16px 20px;
  margin: 20px 0;
  border-radius: 0 var(--radius) var(--radius) 0;
  color: var(--text-2);
  font-style: italic;
}
.amp-content pre {
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 20px;
  overflow-x: auto;
  margin: 20px 0;
  font-family: var(--font-mono);
  font-size: 0.88rem;
  line-height: 1.6;
  color: var(--text-1);
}
.amp-content code {
  background: var(--bg-1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.88em;
  color: var(--accent-2);
}
.amp-content pre code { background: none; padding: 0; }
.amp-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 0.9rem;
}
.amp-content table th,
.amp-content table td {
  padding: 10px 14px;
  border: 1px solid var(--border);
  text-align: left;
}
.amp-content table th {
  background: var(--bg-card);
  color: var(--text-0);
  font-weight: 600;
}
.amp-content table td { color: var(--text-1); }
.amp-content hr {
  border: none;
  border-top: 2px solid var(--border);
  margin: 30px 0;
}
.amp-content amp-img {
  margin: 20px 0;
  border-radius: var(--radius);
  overflow: hidden;
}
.amp-content amp-youtube { margin: 24px 0; border-radius: var(--radius); overflow: hidden; }

/* Tags */
.amp-tags {
  max-width: var(--content-width);
  margin: 30px auto;
  padding: 0 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.amp-tag {
  display: inline-block;
  background: var(--bg-card);
  color: var(--text-2);
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid var(--border);
}

/* Share Bar */
.amp-share-bar {
  max-width: var(--content-width);
  margin: 10px auto 30px;
  padding: 0 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.amp-share-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
}
.amp-share-btn.twitter { background: #1da1f2; }
.amp-share-btn.linkedin { background: #0077b5; }
.amp-share-btn.reddit { background: #ff4500; }

/* Author Box */
.amp-author-box {
  max-width: var(--content-width);
  margin: 0 auto 40px;
  padding: 24px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.amp-author-box h4 { color: var(--text-0); margin-bottom: 8px; font-size: 1.05rem; }
.amp-author-box p { color: var(--text-2); font-size: 0.9rem; margin: 0; }

/* Ad Slot */
.amp-ad-slot {
  max-width: var(--content-width);
  margin: 20px auto;
  text-align: center;
  padding: 0 24px;
}

/* Footer */
.amp-footer {
  background: var(--bg-1);
  border-top: 1px solid var(--border);
  padding: 40px 24px 20px;
  margin-top: 40px;
}
.amp-footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 40px;
}
.amp-footer h4 { color: var(--text-0); margin-bottom: 16px; font-size: 0.95rem; }
.amp-footer ul { list-style: none; }
.amp-footer li { margin-bottom: 8px; }
.amp-footer a { color: var(--text-3); font-size: 0.88rem; }
.amp-footer a:hover { color: var(--text-1); }
.amp-footer-brand p { color: var(--text-3); font-size: 0.88rem; margin-top: 8px; max-width: 320px; }
.amp-footer-bottom {
  max-width: 1200px;
  margin: 24px auto 0;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  font-size: 0.8rem;
  color: var(--text-3);
  text-align: center;
}
@media(max-width:768px) {
  .amp-footer-inner { grid-template-columns: 1fr; gap: 24px; }
  .amp-article-header h1 { font-size: 1.65rem; }
  .amp-content { font-size: 16px; }
  .amp-meta { flex-direction: column; gap: 8px; }
}
`;
}


// ─── Main Generator ─────────────────────────────────────────────────────────

/**
 * Generate a valid AMP HTML page for a blog post.
 * @param {Object} post - Post object from posts.json
 * @param {Object} settings - Settings from settings.json
 * @param {string} publicDir - Absolute path to the public directory
 * @returns {string} Complete AMP HTML document
 */
function generateAmpPage(post, settings, publicDir) {
    const baseUrl = (settings.siteUrl || 'https://HedwigPost.com').replace(/\/$/, '');
    const blogName = settings.blogName || 'HedwigPost';
    const authorName = settings.authorName || post.author || 'HedwigPost Team';
    const authorBio = settings.authorBio || '';

    // Convert post content to AMP
    const { html: ampContent, components } = convertToAmpContent(post.content || '');

    // Canonical URL
    const canonicalUrl = `${baseUrl}/blog/${post.slug}`;
    const ampUrl = `${baseUrl}/blog/${post.slug}/amp`;

    // Dates
    const publishDate = post.publishDate ? new Date(post.publishDate).toISOString() : new Date().toISOString();
    const modifiedDate = post.updatedDate ? new Date(post.updatedDate).toISOString() : publishDate;
    const readableDate = new Date(publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Featured image
    const featuredImage = post.featuredImage
        ? (post.featuredImage.startsWith('http') ? post.featuredImage : baseUrl + post.featuredImage)
        : '';
    const featuredImageAlt = post.featuredImageAlt || post.title;

    // Build component scripts
    let componentScripts = '';
    if (components.has('amp-youtube')) {
        componentScripts += '    <script async custom-element="amp-youtube" src="https://cdn.ampproject.org/v0/amp-youtube-0.1.js"></script>\n';
    }
    if (components.has('amp-video')) {
        componentScripts += '    <script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>\n';
    }
    // Always include amp-sidebar for navigation
    componentScripts += '    <script async custom-element="amp-sidebar" src="https://cdn.ampproject.org/v0/amp-sidebar-0.1.js"></script>\n';

    // Analytics
    let analyticsHtml = '';
    if (settings.analyticsId) {
        componentScripts += '    <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>\n';
        analyticsHtml = `
    <amp-analytics type="gtag" data-credentials="include">
      <script type="application/json">
        {
          "vars": { "gtag_id": "${settings.analyticsId}", "config": { "${settings.analyticsId}": { "groups": "default" } } }
        }
      </script>
    </amp-analytics>`;
    }

    // AdSense
    let adHtml = '';
    if (settings.adsenseId) {
        adHtml = `
    <div class="amp-ad-slot">
      <amp-ad width="100vw" height="320"
        type="adsense"
        data-ad-client="${settings.adsenseId}"
        data-ad-slot="auto"
        data-auto-format="rspv"
        data-full-width="">
        <div overflow=""></div>
      </amp-ad>
    </div>`;
    }

    // Tags HTML
    const tagsHtml = (post.tags && post.tags.length > 0)
        ? `<div class="amp-tags">${post.tags.map(t => `<span class="amp-tag">#${escapeHtml(t)}</span>`).join('')}</div>`
        : '';

    // Share buttons
    const encodedUrl = encodeURIComponent(canonicalUrl);
    const encodedTitle = encodeURIComponent(post.title);
    const shareHtml = `
    <div class="amp-share-bar">
      <a class="amp-share-btn twitter" href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}" target="_blank" rel="noopener">𝕏 Tweet</a>
      <a class="amp-share-btn linkedin" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener">in LinkedIn</a>
      <a class="amp-share-btn reddit" href="https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}" target="_blank" rel="noopener">↗ Reddit</a>
    </div>`;

    // Featured image block
    const featuredImageBlock = featuredImage
        ? `<div class="amp-featured-image"><amp-img src="${featuredImage}" alt="${escapeHtml(featuredImageAlt)}" width="780" height="440" layout="responsive"></amp-img></div>`
        : '';

    // JSON-LD Structured Data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.metaDescription || post.excerpt || '',
        "author": {
            "@type": "Person",
            "name": authorName
        },
        "publisher": {
            "@type": "Organization",
            "name": blogName,
            "logo": {
                "@type": "ImageObject",
                "url": `${baseUrl}/favicon.png`,
                "width": 512,
                "height": 512
            }
        },
        "datePublished": publishDate,
        "dateModified": modifiedDate,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonicalUrl
        }
    };
    if (featuredImage) {
        jsonLd.image = {
            "@type": "ImageObject",
            "url": featuredImage,
            "width": 1200,
            "height": 675
        };
    }

    // ─── Build complete AMP HTML ─────────────────────────────────────────

    return `<!doctype html>
<html ⚡ lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
    <script async src="https://cdn.ampproject.org/v0.js"></script>
${componentScripts}
    <title>${escapeHtml(post.metaTitle || post.title)} | AMP</title>
    <link rel="canonical" href="${canonicalUrl}">
    <link rel="icon" type="image/png" href="${baseUrl}/favicon.png">

    <!-- SEO Meta -->
    <meta name="description" content="${escapeHtml(post.metaDescription || post.excerpt || '')}">
    <meta name="robots" content="index, follow">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(post.metaTitle || post.title)}">
    <meta property="og:description" content="${escapeHtml(post.metaDescription || post.excerpt || '')}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:site_name" content="${escapeHtml(blogName)}">
    ${featuredImage ? `<meta property="og:image" content="${featuredImage}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(post.metaTitle || post.title)}">
    <meta name="twitter:description" content="${escapeHtml(post.metaDescription || post.excerpt || '')}">
    ${featuredImage ? `<meta name="twitter:image" content="${featuredImage}">` : ''}

    <!-- Structured Data -->
    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 6)}
    </script>

    <!-- Google Fonts (AMP-safe) -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap">

    <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>

    <style amp-custom>
${getAmpStyles()}
    </style>
</head>
<body>
    ${analyticsHtml}

    <!-- Header -->
    <header class="amp-header">
      <nav class="amp-nav">
        <a href="${baseUrl}/" class="amp-logo">
          <amp-img src="${baseUrl}/favicon.png" alt="${escapeHtml(blogName)}" width="32" height="32" layout="fixed"></amp-img>
          <span>${escapeHtml(blogName)}</span>
        </a>
        <ul class="amp-nav-links">
          <li><a href="${baseUrl}/">Home</a></li>
          <li><a href="${baseUrl}/blogs">Blog</a></li>
          <li><a href="${baseUrl}/about">About</a></li>
          <li><a href="${baseUrl}/contact">Contact</a></li>
        </ul>
        <button class="amp-menu-btn" on="tap:amp-sidebar.open" aria-label="Open menu">☰</button>
      </nav>
    </header>

    <!-- Mobile Sidebar -->
    <amp-sidebar id="amp-sidebar" layout="nodisplay" side="right">
      <button class="amp-sidebar-close" on="tap:amp-sidebar.close" aria-label="Close menu">✕</button>
      <ul class="amp-sidebar-links">
        <li><a href="${baseUrl}/">Home</a></li>
        <li><a href="${baseUrl}/blogs">Blog</a></li>
        <li><a href="${baseUrl}/about">About</a></li>
        <li><a href="${baseUrl}/contact">Contact</a></li>
        <li><a href="${baseUrl}/privacy">Privacy</a></li>
        <li><a href="${baseUrl}/terms">Terms</a></li>
      </ul>
    </amp-sidebar>

    <!-- AMP Badge -->
    <div class="amp-badge-bar">
      <span class="amp-badge">⚡ AMP</span>
    </div>

    <!-- Breadcrumb -->
    <div class="amp-breadcrumb">
      <a href="${baseUrl}/">Home</a>
      <span>›</span>
      <a href="${baseUrl}/blogs">Blog</a>
      <span>›</span>
      <span>${escapeHtml(truncate(post.title, 50))}</span>
    </div>

    <!-- Article Header -->
    <div class="amp-article-header">
      ${post.category ? `<span class="amp-category-badge">${escapeHtml(post.category)}</span>` : ''}
      <h1>${escapeHtml(post.title)}</h1>
      <div class="amp-meta">
        <span class="amp-meta-item">✍️ ${escapeHtml(authorName)}</span>
        <span class="amp-meta-item">📅 ${readableDate}</span>
        <span class="amp-meta-item">⏱️ ${post.readingTime || 1} min read</span>
      </div>
    </div>

    <!-- Featured Image -->
    ${featuredImageBlock}

    <!-- Article Content -->
    <article class="amp-content">
      ${ampContent}
    </article>

    <!-- Tags -->
    ${tagsHtml}

    <!-- Share -->
    ${shareHtml}

    <!-- Author Box -->
    <div class="amp-author-box" style="max-width:var(--content-width);margin:0 auto 30px;padding:24px;">
      <h4>✍️ Written by ${escapeHtml(authorName)}</h4>
      ${authorBio ? `<p>${escapeHtml(authorBio)}</p>` : ''}
    </div>

    <!-- Ad Slot -->
    ${adHtml}

    <!-- Normal Version Link -->
    <div style="max-width:var(--content-width);margin:0 auto 30px;padding:0 24px;text-align:center;">
      <a href="${canonicalUrl}" style="display:inline-block;padding:10px 24px;border:1px solid var(--border);border-radius:8px;color:var(--text-2);font-size:0.85rem;">
        View Full Version →
      </a>
    </div>

    <!-- Footer -->
    <footer class="amp-footer">
      <div class="amp-footer-inner">
        <div class="amp-footer-brand">
          <a href="${baseUrl}/" class="amp-logo">
            <amp-img src="${baseUrl}/favicon.png" alt="${escapeHtml(blogName)}" width="28" height="28" layout="fixed"></amp-img>
            <span>${escapeHtml(blogName)}</span>
          </a>
          <p>Your go-to destination for technology insights, tutorials, and the latest tech trends.</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="${baseUrl}/">Home</a></li>
            <li><a href="${baseUrl}/about">About Us</a></li>
            <li><a href="${baseUrl}/contact">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li><a href="${baseUrl}/privacy">Privacy Policy</a></li>
            <li><a href="${baseUrl}/terms">Terms of Service</a></li>
            <li><a href="${baseUrl}/disclaimer">Disclaimer</a></li>
          </ul>
        </div>
      </div>
      <div class="amp-footer-bottom">
        <span>${settings.footerText || `© ${new Date().getFullYear()} ${blogName}. All rights reserved.`}</span>
      </div>
    </footer>
</body>
</html>`;
}


// ─── Utility Helpers ────────────────────────────────────────────────────────

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
}


// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = { generateAmpPage, convertToAmpContent };
