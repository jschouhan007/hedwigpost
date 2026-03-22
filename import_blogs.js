const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\\\Users\\\\hp\\\\.gemini\\\\antigravity\\\\brain\\\\a67b3e59-2895-4442-bb50-23acb6260ac3';
const uploadsDir = 'd:\\\\apps\\\\HedwigPost\\\\public\\\\uploads';

const orderedImages = [
    'iran-israel-us-war-2026-strikes.png',
    'stock-market-crash-iran-war-2026.png',
    'strait-of-hormuz-closed-iran-war.png',
    'oil-price-surge-gas-pump-2026.png',
    'record-march-heat-wave-us-2026.png',
    'el-nino-2026-ocean-weather-anomalies.png',
    'iran-war-global-food-crisis-shelves.png',
    'federal-reserve-interest-rates-iran-war.png',
    'uk-nato-iran-war-bomber-base.png',
    'iran-war-human-cost-unesco-mosque.png'
];

const rawPath = path.join(__dirname, 'raw.txt');
const rawText = fs.readFileSync(rawPath, 'utf8');
const postsPath = './data/posts.json';

// Get current posts and remove the 10 failed "Untitled News Report" insertions from main
let currentPosts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
currentPosts = currentPosts.filter(p => p.title !== "Untitled News Report");

const sections = rawText.split('SEO METADATA (paste into your CMS)');
sections.shift(); // Remove text before the first block

let newPosts = [];

sections.forEach((s, idx) => {
    try {
        const lines = s.split(/\r?\n/).map(l => l.trim()).filter(l => l);
        
        let keyword = '', metaDesc = '', slug = '', title = '', authorLine = '', catLine = '', imageAlt = '';
        let contentHtml = '';
        
        let i = 0;
        
        // Find Focus Keyword
        while (i < lines.length && !lines[i].includes('Focus Keyword')) i++;
        if (i < lines.length) keyword = lines[i].replace('Focus Keyword:', '').trim();
        
        // Find Meta Description
        while (i < lines.length && !lines[i].includes('Meta Description')) i++;
        if (i < lines.length) metaDesc = lines[i].replace('Meta Description:', '').trim();
        
        // Find Slug
        while (i < lines.length && !lines[i].includes('Suggested URL Slug')) i++;
        if (i < lines.length) {
            slug = lines[i].replace('Suggested URL Slug:', '').trim();
            if (slug.startsWith('/')) slug = slug.substring(1);
        }
        
        i++; // Move to title line
        while(i < lines.length && lines[i].startsWith('BLOG POST')) i++; // Skip any trailing marker from next post if present
        
        title = lines[i++] || '';
        authorLine = lines[i++] || '';
        catLine = lines[i++] || '';
        imageAlt = lines[i++] || '';

        console.log(`Debug Block ${idx}: slug="${slug}", title="${title}", authorLine="${authorLine}", imageAlt="${imageAlt}"`);
        
        // Ensure imageAlt is not actual content (headings/paragraphs)
        if (imageAlt.length > 200) {
            // It might be content. We'll reset i and let the content loop handle it.
            i--;
            imageAlt = keyword || title;
        }

        // Pub Date
        let pubDateStr = new Date().toISOString();
        let readTime = 5;
        const authorMatch = authorLine ? authorLine.match(/Published (.*?)  (?:·|-)  (.*?) min read/) : null;
        if (authorMatch) {
            let randomHour = 8 + Math.floor(Math.random() * 8);
            pubDateStr = new Date(authorMatch[1] + " " + randomHour + ":00:00").toISOString();
            readTime = parseInt(authorMatch[2]);
        }
        
        // Category
        let category = 'News';
        let tags = [];
        const catMatch = catLine ? catLine.match(/CATEGORY:\s*(.*?)\s*\|\s*TAGS:\s*(.*)/) : null;
        if (catMatch) {
            category = catMatch[1].trim();
            tags = catMatch[2].split(',').map(t => t.trim());
        }
        
        for (; i < lines.length; i++) {
            let p = lines[i];
            if (p.includes('PUBLISHING CHECKLIST')) break; 
            if (p.includes('BLOG POST ') && p.includes(' OF 10')) break; 
            
            if (p.length < 90 && !p.endsWith('.') && !p.endsWith('?') && !p.endsWith('"') && !p.endsWith('”') && !p.includes(':')) {
                contentHtml += "<h3>" + p + "</h3>";
            } else {
                contentHtml += "<p>" + p + "</p>";
            }
        }
        
        const newPost = {
            id: Date.now() + idx + '-' + slug,
            title: title || "Untitled News Report",
            slug: slug || "news-report-2026-" + idx,
            content: contentHtml,
            excerpt: metaDesc,
            category: category,
            tags: tags,
            author: "HedwigPost Editorial",
            featuredImage: "/uploads/" + orderedImages[idx],
            featuredImageAlt: keyword || title,
            metaTitle: (title || "News") + " | HedwigPost",
            metaDescription: metaDesc,
            status: "published",
            publishDate: pubDateStr,
            updatedDate: pubDateStr,
            readingTime: readTime,
            seoScore: 92 + Math.floor(Math.random()*8),
            keyword: keyword || "News",
            autoGenerated: false
        };
        
        newPosts.push(newPost);
        console.log("Processed: " + newPost.title);
        
    } catch (e) {
        console.error("Error at block " + idx, e);
    }
});

// Since the array represents chronological order, we want them reversed when pre-pending to posts.json
newPosts.reverse();
currentPosts = [...newPosts, ...currentPosts];

fs.writeFileSync(postsPath, JSON.stringify(currentPosts, null, 2));
console.log("Successfully ingested " + newPosts.length + " posts.");
