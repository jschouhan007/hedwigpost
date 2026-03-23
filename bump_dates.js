const fs = require('fs');
const path = require('path');

const postsPath = path.join(__dirname, 'data', 'posts.json');
let posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));

// Finance posts we just added
const financeKeywords = ['KOSPI crashes 5.21%', 'GIFT Nifty at 22', 'Brent crude at $112 is the single'];

let bumped = 0;
// Make them March 25th so they sit firmly at the top above the Mar 24th entertainment posts
posts.forEach(post => {
    if (financeKeywords.some(kw => (post.excerpt || '').includes(kw) || (post.metaDescription || '').includes(kw))) {
        let newDate = new Date('2026-03-25T10:00:00Z');
        newDate.setHours(newDate.getHours() - bumped);
        post.publishDate = newDate.toISOString();
        bumped++;
        console.log(`Bumped date for: ${post.title}`);
    }
});

// Re-sort array formally just in case
posts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
console.log(`Successfully elevated ${bumped} posts to the top of the timeline.`);
