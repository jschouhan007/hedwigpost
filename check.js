const fs = require('fs');
const rawText = fs.readFileSync('d:\\\\apps\\\\HedwigPost\\\\raw.txt', 'utf8');
const sections = rawText.split('SEO METADATA (paste into your CMS)');
sections.shift(); // remove everything before first SEO METADATA

sections.forEach((s, idx) => {
    const lines = s.split(/\\r?\\n/).map(l => l.trim()).filter(l => l);
    // Now line 0 should be Focus Keyword
    // line 1 Meta Description
    // line 2 Suggested Slug
    // line 3 Title
    
    console.log(`Post ${idx + 1} Lines 0-4:`, lines.slice(0, 5));
});
