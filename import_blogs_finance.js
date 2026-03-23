const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'raw_finance.txt');
const rawText = fs.readFileSync(rawFile, 'utf8');

const blocks = rawText.split(/SEO METADATA\s*—\s*paste into your CMS/);
blocks.shift(); // remove the header/disclaimer

const images = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1613768822045-8fe1df24817a?q=80&w=1200&auto=format&fit=crop'
];

const newPosts = [];

blocks.forEach((block, i) => {
    try {
        const lines = block.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        
        let focusKeyword = (lines.find(l => l.startsWith('Focus Keyword:')) || '').replace('Focus Keyword:', '').trim();
        let metaDesc = (lines.find(l => l.startsWith('Meta Description:')) || '').replace('Meta Description:', '').trim();
        let urlSlug = (lines.find(l => l.startsWith('URL Slug:')) || '').replace('URL Slug:', '').trim();
        if (urlSlug.startsWith('/')) urlSlug = urlSlug.substring(1);

        let titleIndex = lines.findIndex(l => l.startsWith('URL Slug:')) + 1;
        let title = lines[titleIndex] || '';
        if(title.includes('POST') && title.includes('OF 3')) {
             title = lines[titleIndex + 1];
             titleIndex++;
        }

        let categoryIndex = lines.findIndex(l => l.startsWith('CATEGORY:'));
        let contentStartIndex = categoryIndex + 2; // Skip the image description line
        
        let htmlContent = '';
        for (let j = contentStartIndex; j < lines.length; j++) {
            let line = lines[j];
            if (line.includes('POST') && line.includes('OF 3')) break; 
            if (line.includes('PUBLISHING NOTES')) break;
            
            if (line.split(' ').length < 15 && !line.endsWith('.') && !line.includes('\t') && !line.includes('—')) {
                htmlContent += `<h2>${line}</h2>\n`;
            } else if (line.includes('\t')) {
                htmlContent += `<p style="font-family: monospace; background: #f8f9fa; padding: 4px;"><strong>${line.replace(/\t/g, ' | ')}</strong></p>\n`;
            } else {
                htmlContent += `<p>${line}</p>\n`;
            }
        }

        // Stagger publication times slightly so they appear in correct chronological order
        const date = new Date('2026-03-23T10:00:00Z');
        date.setHours(date.getHours() - (i));

        let post = {
            id: Date.now() + i + 100, // +100 to avoid ID collision if executed rapidly
            slug: urlSlug || 'finance-post-' + i,
            title: title || 'Finance Post',
            author: "HedwigPost Markets Desk",
            category: "Stock Market",
            tags: ["Finance", "Stock Market", "Economy"],
            featuredImage: images[i],
            featuredImageAlt: focusKeyword || "Financial market chart",
            excerpt: metaDesc || "Read the latest in financial market news on HedwigPost.",
            content: htmlContent,
            publishDate: date.toISOString(),
            updatedDate: date.toISOString(),
            status: "published",
            readingTime: Math.floor(Math.random() * 4) + 8,
            seoScore: Math.floor(Math.random() * 8) + 90,
            keyword: focusKeyword,
            views: 0
        };
        newPosts.push(post);
        console.log(`Processed: ${title}`);
    } catch (e) {
        console.error(`Error at block ${i}`, e);
    }
});

const postsPath = path.join(__dirname, 'data', 'posts.json');
let currentPosts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));

// Finance posts are newer (March 23), so prepend them!
currentPosts = [...newPosts.reverse(), ...currentPosts];
fs.writeFileSync(postsPath, JSON.stringify(currentPosts, null, 2));

console.log(`Successfully ingested ${newPosts.length} finance posts.`);
