const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'raw_ent.txt');
const rawText = fs.readFileSync(rawFile, 'utf8');

const blocks = rawText.split(/SEO METADATA\s*—\s*paste into your CMS/);
blocks.shift(); // remove the header

const brainDir = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\a67b3e59-2895-4442-bb50-23acb6260ac3';
const uploadsDir = path.join(__dirname, 'public', 'uploads');

const orderedImages = [
    'bts_kpop_concert_seoul_1774203179404.png',
    'oscars_academy_awards_stage_1774203196221.png',
    'bridgerton_season_4_romance_1774203225104.png',
    'dhurandhar_2_bollywood_action_1774203244954.png',
    'euphoria_season_3_hbo_1774203263127.png',
    'kpop_fans_india_concert_1774203279698.png',
    'streaming_wars_tv_platforms_1774203306150.png',
    'https://images.unsplash.com/photo-1596727147705-61a532a659bd?q=80&w=1200&auto=format&fit=crop', // Bollywood 2026
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop', // MJ Biopic
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1200&auto=format&fit=crop'  // AI in Hollywood
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
        if(title.includes('POST') && title.includes('OF 10')) {
             title = lines[titleIndex + 1];
             titleIndex++;
        }

        // Handle images
        let featuredImage = orderedImages[i];
        let copyFileName = urlSlug + '.png';

        if (featuredImage.startsWith('http')) {
            copyFileName = featuredImage;
        } else {
             fs.copyFileSync(path.join(brainDir, featuredImage), path.join(uploadsDir, copyFileName));
             copyFileName = '/uploads/' + copyFileName;
        }

        let contentStartIndex = titleIndex + 3;
        let actualContentStart = lines.findIndex((l, index) => index >= contentStartIndex && l.startsWith('LSI Keywords:')) + 1;
        if (actualContentStart === 0) actualContentStart = contentStartIndex;
        
        let htmlContent = '';
        for (let j = actualContentStart; j < lines.length; j++) {
            let line = lines[j];
            if (line.includes('POST') && line.includes('OF 10')) break; // Next post boundary safeguard
            if (line.split(' ').length < 15 && !line.endsWith('.')) {
                htmlContent += `<h2>${line}</h2>\n`;
            } else {
                htmlContent += `<p>${line}</p>\n`;
            }
        }
        
        if (i === 9) {
            htmlContent = htmlContent.split(/<h2>KEYWORD RESEARCH & PUBLISHING GUIDE<\/h2>/)[0];
        }

        const date = new Date('2026-03-24T10:00:00Z');
        date.setHours(date.getHours() - (i*2));

        let post = {
            id: Date.now() + i,
            slug: urlSlug || 'ent-post-' + i,
            title: title || 'Entertainment Post',
            author: "HedwigPost Editorial",
            category: "Entertainment",
            tags: ["Entertainment", "Movies", "TV"],
            featuredImage: copyFileName,
            featuredImageAlt: focusKeyword || "Entertainment image",
            excerpt: metaDesc || "Read the latest in entertainment news and stories on HedwigPost.",
            content: htmlContent,
            publishDate: date.toISOString(),
            updatedDate: date.toISOString(),
            status: "published",
            readingTime: Math.floor(Math.random() * 5) + 6,
            seoScore: Math.floor(Math.random() * 12) + 85,
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
currentPosts = [...newPosts.reverse(), ...currentPosts];
fs.writeFileSync(postsPath, JSON.stringify(currentPosts, null, 2));

console.log(`Successfully ingested ${newPosts.length} posts.`);
