const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../public');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const regex = /<li><a href="\/category\/ai-machine-learning">AI<\/a><\/li>\s*<li><a href="\/category\/how-to-guides">How-To<\/a><\/li>\s*<li><a href="\/category\/programming">Programming<\/a><\/li>\s*<li><a href="\/category\/cybersecurity">Security<\/a><\/li>/g;

files.forEach(f => {
    let p = path.join(dir, f);
    let c = fs.readFileSync(p, 'utf8');
    if (regex.test(c)) {
        c = c.replace(regex, '<li><a href="/blogs">All Posts</a></li>');
        fs.writeFileSync(p, c);
        console.log('updated', f);
    }
});
