/**
 * HedwigPost Content Engine — SEO Article Generator
 * 
 * Generates 1500–3000 word SEO-optimized articles with:
 *   - Keyword-rich titles with year and numbers
 *   - Introduction, Table of Contents
 *   - H2/H3 structured headings
 *   - Lists, FAQs, Conclusion
 *   - Meta description, OG/Twitter tags
 *   - Automated SEO scoring
 */

const path = require('path');
const { categorizeKeyword, markKeywordUsed, SEED_KEYWORDS, AUDIENCES } = require('./keyword-discovery');

const CURRENT_YEAR = new Date().getFullYear();

// ─── Title Templates ────────────────────────────────────────────────
const TITLE_TEMPLATES = [
    '{N} Best {Keyword} in {Year}: Complete Guide',
    'Top {N} {Keyword} You Need to Know in {Year}',
    '{Keyword} in {Year}: {N} Essential Things You Must Know',
    '{N} Proven {Keyword} Strategies That Actually Work ({Year})',
    'The Ultimate Guide to {Keyword} in {Year} ({N} Expert Tips)',
    '{Keyword}: {N} Powerful Tips for Success in {Year}',
    'How to Master {Keyword} in {Year} — {N} Step Guide',
    '{N} {Keyword} Trends That Will Dominate {Year}',
    'Complete {Keyword} Guide: {N} Things Beginners Must Know ({Year})',
    '{Keyword} Explained: {N} Key Concepts for {Year}',
    '{N} Free {Keyword} Resources You Can\'t Miss in {Year}',
    'Why {Keyword} Matters in {Year}: {N} Compelling Reasons',
    '{Keyword} for Beginners: {N} Steps to Get Started in {Year}',
    '{N} Common {Keyword} Mistakes to Avoid in {Year}',
    'The {Year} Guide to {Keyword}: {N} Actionable Insights'
];

// ─── Introduction Templates ─────────────────────────────────────────
const INTRO_TEMPLATES = [
    `<p>In today's rapidly evolving digital landscape, <strong>{keyword}</strong> has become one of the most critical topics for professionals and enthusiasts alike. Whether you're a seasoned expert or just getting started, understanding the nuances of {keyword} can give you a significant competitive edge in {year}.</p><p>This comprehensive guide covers everything you need to know about <strong>{keyword}</strong>, from fundamental concepts to advanced strategies. We've researched extensively and compiled the most up-to-date information to help you stay ahead of the curve.</p><p>By the end of this article, you'll have a thorough understanding of {keyword} and actionable steps you can implement immediately to see real results.</p>`,
    
    `<p>The world of <strong>{keyword}</strong> is changing faster than ever. With new developments emerging almost daily, it can be challenging to keep up with the latest trends and best practices. That's exactly why we created this in-depth guide.</p><p>In this article, we'll break down the essential aspects of <strong>{keyword}</strong> that every professional should know in {year}. From beginner-friendly explanations to expert-level insights, this guide has something for everyone.</p><p>Let's dive in and explore how {keyword} is shaping the future of technology and what you can do to leverage it effectively.</p>`,
    
    `<p><strong>{keyword}</strong> continues to be one of the most discussed topics in the tech community. And for good reason — its impact on businesses, individuals, and society as a whole is undeniable.</p><p>Whether you're looking to enhance your skills, make informed decisions, or simply stay updated, this comprehensive guide on <strong>{keyword}</strong> provides the insights you need in {year}.</p><p>We've compiled expert advice, practical tips, and real-world examples to make this the most useful resource you'll find on {keyword}. Let's get started.</p>`,

    `<p>If you've been wondering about <strong>{keyword}</strong> and how it can benefit you in {year}, you've come to the right place. The landscape has shifted dramatically over the past year, and staying informed is more important than ever.</p><p>In this detailed guide, we'll walk you through everything related to <strong>{keyword}</strong> — from the basics to the advanced concepts that industry leaders are leveraging right now.</p><p>Whether you're a complete beginner or an experienced professional, you'll find valuable insights and actionable strategies throughout this article. Let's explore what makes {keyword} so important today.</p>`
];

// ─── Section Content Generators ─────────────────────────────────────
// These generate contextual content blocks for each section

function generateSectionContent(keyword, sectionTitle, sectionIndex) {
    const templates = [
        // Template 1: Overview + bullet list
        `<p>When it comes to <strong>${sectionTitle.toLowerCase()}</strong>, understanding the core principles is essential. This aspect of ${keyword} has gained significant traction in recent years, and for good reason.</p>
<p>The key elements you need to understand include:</p>
<ul>
<li><strong>Foundation Knowledge</strong> — Before diving into advanced concepts, make sure you have a solid understanding of the basics. This includes knowing the terminology, common practices, and industry standards related to ${keyword}.</li>
<li><strong>Practical Application</strong> — Theory is important, but the real value comes from applying what you learn. Start with small projects and gradually scale up as your confidence grows.</li>
<li><strong>Community Engagement</strong> — Join forums, follow industry leaders on social media, and participate in discussions. The ${keyword} community is incredibly supportive and can provide valuable insights.</li>
<li><strong>Continuous Learning</strong> — The field is constantly evolving. Subscribe to newsletters, take online courses, and attend webinars to stay current with the latest developments.</li>
<li><strong>Tool Selection</strong> — Choose the right tools for your specific needs. We'll explore the best options available in ${CURRENT_YEAR} later in this guide.</li>
</ul>
<p>By focusing on these fundamental areas, you'll build a strong foundation that will serve you well as you advance in your ${keyword} journey.</p>`,

        // Template 2: Problem/Solution format
        `<p>One of the biggest challenges people face with <strong>${sectionTitle.toLowerCase()}</strong> is knowing where to start. With so much information available online, it's easy to feel overwhelmed. Let's simplify things.</p>
<p>The most effective approach to mastering this aspect of <strong>${keyword}</strong> involves three key strategies:</p>
<p><strong>Strategy 1: Start with the Fundamentals</strong></p>
<p>Don't try to learn everything at once. Focus on understanding the core concepts first. Many experts recommend spending at least 2-3 weeks on the basics before moving to advanced topics. This investment in foundational knowledge pays dividends down the road.</p>
<p><strong>Strategy 2: Learn by Doing</strong></p>
<p>Passive learning only gets you so far. The most successful practitioners of ${keyword} are those who apply their knowledge through hands-on projects. Start with beginner-friendly exercises and gradually increase complexity. Document your process — not only does this reinforce learning, but it also creates a portfolio of your work.</p>
<p><strong>Strategy 3: Stay Updated with ${CURRENT_YEAR} Trends</strong></p>
<p>The ${keyword} landscape evolves rapidly. What was considered best practice a year ago may already be outdated. Follow industry blogs, subscribe to relevant podcasts, and join professional communities to stay current. This proactive approach ensures you're always ahead of the curve.</p>`,

        // Template 3: Statistics + analysis
        `<p>Recent studies show that <strong>${sectionTitle.toLowerCase()}</strong> has become increasingly important in the context of ${keyword}. According to industry reports in ${CURRENT_YEAR}, professionals who master this area see significantly better outcomes in their respective fields.</p>
<p>Here's what the data tells us about the current state of ${keyword}:</p>
<ul>
<li>The global market is projected to grow by an estimated 25-35% year-over-year through ${CURRENT_YEAR + 2}</li>
<li>Over 70% of industry professionals consider ${keyword} knowledge essential for career advancement</li>
<li>Companies investing in ${keyword} report an average productivity improvement of 40%</li>
<li>The demand for ${keyword} expertise has increased by more than 150% in the last two years</li>
</ul>
<p>These numbers paint a clear picture: investing time and resources in understanding ${keyword} is not just beneficial — it's becoming necessary for anyone who wants to remain competitive in today's market.</p>
<p>The most successful organizations are those that have embraced ${keyword} early and integrated it into their core operations. If you haven't started yet, now is the perfect time to begin.</p>`,

        // Template 4: Comparison/Advanced
        `<p>Understanding the nuances of <strong>${sectionTitle.toLowerCase()}</strong> requires a deeper look at how different approaches compare within the ${keyword} ecosystem. Let's examine the most popular methods and their respective advantages.</p>
<p><strong>Traditional Approach vs Modern Solutions</strong></p>
<p>The traditional approach to ${keyword} relied heavily on manual processes and individual expertise. While this method has its merits — particularly in terms of personal understanding and customization — it's increasingly being supplemented by modern, technology-driven solutions.</p>
<p>Modern approaches offer several distinct advantages:</p>
<ol>
<li><strong>Scalability</strong> — Modern tools and frameworks can handle significantly larger workloads, making them ideal for growing organizations and ambitious individuals.</li>
<li><strong>Consistency</strong> — Automated processes ensure a consistent standard of quality, reducing the variability that comes with purely manual work.</li>
<li><strong>Speed</strong> — Tasks that once took hours can now be completed in minutes, freeing up valuable time for strategic thinking and creative work.</li>
<li><strong>Cost Efficiency</strong> — While there may be upfront investment required, the long-term cost savings are substantial. Many organizations report a positive ROI within the first 6 months.</li>
</ol>
<p>The best approach often involves combining traditional expertise with modern tools. This hybrid model leverages the strengths of both worlds and is what we recommend for most professionals working with ${keyword} in ${CURRENT_YEAR}.</p>`,

        // Template 5: Tips/Best practices
        `<p>Mastering <strong>${sectionTitle.toLowerCase()}</strong> is a crucial step in your ${keyword} journey. Based on feedback from thousands of practitioners and our own extensive research, here are the best practices you should follow.</p>
<p><strong>Best Practice #1: Set Clear Objectives</strong></p>
<p>Before diving into ${keyword}, define what success looks like for you. Are you looking to enhance your career, build a product, or simply expand your knowledge? Having clear goals helps you focus your learning and avoid getting lost in the vast sea of available information.</p>
<p><strong>Best Practice #2: Build a Structured Learning Path</strong></p>
<p>Random learning leads to random results. Create a structured roadmap that takes you from beginner to advanced levels systematically. Many successful ${keyword} practitioners follow a 90-day learning plan that includes daily practice, weekly projects, and monthly assessments.</p>
<p><strong>Best Practice #3: Leverage Free Resources</strong></p>
<p>You don't need to spend thousands on courses. In ${CURRENT_YEAR}, there are excellent free resources available, including open-source documentation, YouTube tutorials, community forums, and practice platforms. Start with these before investing in premium content.</p>
<p><strong>Best Practice #4: Network with Other Practitioners</strong></p>
<p>Join online communities, attend meetups, and connect with others who share your interest in ${keyword}. Networking not only accelerates your learning but also opens doors to opportunities you might not find otherwise. Platforms like Reddit, Discord, and LinkedIn are great places to start.</p>`
    ];

    return templates[sectionIndex % templates.length];
}

// ─── Section Title Generators ───────────────────────────────────────
function generateSectionTitles(keyword, count = 7) {
    const titleSets = [
        [
            `What is ${capitalize(keyword)}?`,
            `Why ${capitalize(keyword)} Matters in ${CURRENT_YEAR}`,
            `Key Benefits of ${capitalize(keyword)}`,
            `How to Get Started with ${capitalize(keyword)}`,
            `Best Tools and Resources for ${capitalize(keyword)}`,
            `Common Mistakes to Avoid with ${capitalize(keyword)}`,
            `Future of ${capitalize(keyword)}`,
            `${capitalize(keyword)} Best Practices`
        ],
        [
            `Understanding ${capitalize(keyword)}: The Basics`,
            `The Rise of ${capitalize(keyword)} in ${CURRENT_YEAR}`,
            `Top Advantages of ${capitalize(keyword)}`,
            `Step-by-Step Guide to ${capitalize(keyword)}`,
            `Essential ${capitalize(keyword)} Tools You Should Know`,
            `Expert Tips for Mastering ${capitalize(keyword)}`,
            `${capitalize(keyword)} Trends to Watch in ${CURRENT_YEAR}`,
            `How ${capitalize(keyword)} is Transforming the Industry`
        ],
        [
            `${capitalize(keyword)} Explained Simply`,
            `Why Everyone is Talking About ${capitalize(keyword)}`,
            `Real-World Applications of ${capitalize(keyword)}`,
            `A Beginner's Roadmap to ${capitalize(keyword)}`,
            `Recommended ${capitalize(keyword)} Resources`,
            `Challenges and Solutions in ${capitalize(keyword)}`,
            `The Future Landscape of ${capitalize(keyword)}`,
            `Actionable ${capitalize(keyword)} Strategies`
        ]
    ];

    const set = titleSets[Math.floor(Math.random() * titleSets.length)];
    return set.slice(0, count);
}

// ─── FAQ Generator ──────────────────────────────────────────────────
function generateFAQs(keyword, count = 5) {
    const faqPool = [
        { q: `What is ${keyword}?`, a: `${capitalize(keyword)} refers to a set of technologies, practices, and strategies that are widely used in the technology industry. It encompasses various tools and methodologies that help professionals achieve better results in their respective fields.` },
        { q: `Is ${keyword} worth learning in ${CURRENT_YEAR}?`, a: `Absolutely. ${capitalize(keyword)} continues to grow in importance and demand. Industry reports indicate that professionals with ${keyword} skills command higher salaries and have more career opportunities than those without.` },
        { q: `How long does it take to learn ${keyword}?`, a: `The learning timeline varies depending on your background and goals. Beginners can expect to gain basic proficiency in 4-8 weeks with consistent daily practice. Reaching an intermediate level typically takes 3-6 months, while mastery requires ongoing learning and practical experience.` },
        { q: `What are the best free resources for learning ${keyword}?`, a: `There are many excellent free resources available. We recommend starting with official documentation, YouTube tutorials from established creators, community forums like Reddit and Stack Overflow, and free courses on platforms like freeCodeCamp, Khan Academy, and Coursera (audit mode).` },
        { q: `Can I learn ${keyword} without any prior experience?`, a: `Yes! Many successful ${keyword} practitioners started from scratch. The key is to follow a structured learning path, practice consistently, and don't be afraid to ask questions in community forums. Everyone starts as a beginner.` },
        { q: `What career opportunities are available in ${keyword}?`, a: `${capitalize(keyword)} opens doors to numerous career paths including technical roles, consulting, product management, and entrepreneurship. The job market for ${keyword} professionals has grown steadily and shows no signs of slowing down in ${CURRENT_YEAR}.` },
        { q: `How is ${keyword} different from related technologies?`, a: `While ${keyword} shares some characteristics with similar technologies, it has unique features that set it apart. The main differentiators include its approach to problem-solving, community support, and the specific use cases where it excels compared to alternatives.` },
        { q: `What tools do I need to get started with ${keyword}?`, a: `To get started with ${keyword}, you'll need a computer with a modern browser and an internet connection. Many tools and platforms are available for free, and we recommend starting with the most popular options in the ecosystem before exploring specialized tools.` }
    ];

    // Shuffle and pick
    const shuffled = faqPool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// ─── Conclusion Generator ───────────────────────────────────────────
function generateConclusion(keyword) {
    const conclusions = [
        `<h2>Conclusion</h2>
<p><strong>${capitalize(keyword)}</strong> is undeniably one of the most important topics in the technology landscape of ${CURRENT_YEAR}. Whether you're just starting your journey or looking to deepen your expertise, the key is to take consistent action and stay curious.</p>
<p>The strategies and insights we've covered in this guide provide a solid foundation for success. Remember, mastery doesn't happen overnight — it's the result of consistent effort, practical application, and a willingness to adapt to new developments.</p>
<p>We encourage you to bookmark this guide and refer back to it as you progress in your ${keyword} journey. And if you found this article helpful, please share it with others who might benefit from it.</p>
<p><strong>What's your experience with ${keyword}? Share your thoughts in the comments below!</strong></p>`,
        
        `<h2>Final Thoughts</h2>
<p>As we've explored throughout this comprehensive guide, <strong>${keyword}</strong> offers tremendous opportunities for those willing to invest the time and effort to learn. The field continues to evolve, and ${CURRENT_YEAR} is an excellent time to get started or level up your existing skills.</p>
<p>The most important takeaway is this: start today. Don't wait for the perfect moment or the perfect resource. Begin with what you have, learn as you go, and don't be afraid to make mistakes along the way. Every expert was once a beginner.</p>
<p>Stay updated by following our blog for more in-depth guides, tutorials, and industry insights. Together, we can navigate the exciting world of ${keyword} and make the most of the opportunities it presents.</p>
<p><strong>Found this guide useful? Don't forget to share it with your network!</strong></p>`
    ];
    return conclusions[Math.floor(Math.random() * conclusions.length)];
}

// ─── Build Table of Contents ────────────────────────────────────────
function buildTOC(sectionTitles) {
    let toc = '<div class="table-of-contents"><h2>Table of Contents</h2><ol>';
    for (const title of sectionTitles) {
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        toc += `<li><a href="#${id}">${title}</a></li>`;
    }
    toc += '<li><a href="#faqs">Frequently Asked Questions</a></li>';
    toc += '<li><a href="#conclusion">Conclusion</a></li>';
    toc += '</ol></div>';
    return toc;
}

// ─── Generate Full Article HTML ─────────────────────────────────────
function generateArticleContent(keyword, category) {
    const sectionCount = 5 + Math.floor(Math.random() * 3); // 5-7 sections
    const sectionTitles = generateSectionTitles(keyword, sectionCount);

    // Introduction
    const introTemplate = INTRO_TEMPLATES[Math.floor(Math.random() * INTRO_TEMPLATES.length)];
    const intro = introTemplate
        .replace(/\{keyword\}/g, keyword)
        .replace(/\{year\}/g, CURRENT_YEAR.toString());

    // Table of Contents
    const toc = buildTOC(sectionTitles);

    // Sections
    let sections = '';
    for (let i = 0; i < sectionTitles.length; i++) {
        const title = sectionTitles[i];
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        sections += `<h2 id="${id}">${title}</h2>\n`;
        sections += generateSectionContent(keyword, title, i) + '\n';
    }

    // FAQs
    const faqs = generateFAQs(keyword, 5);
    let faqSection = '<h2 id="faqs">Frequently Asked Questions</h2>\n';
    for (const faq of faqs) {
        faqSection += `<h3>${faq.q}</h3>\n<p>${faq.a}</p>\n`;
    }

    // Conclusion
    const conclusion = generateConclusion(keyword);

    // Combine
    const fullContent = intro + '\n' + toc + '\n' + sections + '\n' + faqSection + '\n' + conclusion;
    return fullContent;
}

// ─── Generate Title ─────────────────────────────────────────────────
function generateTitle(keyword) {
    const template = TITLE_TEMPLATES[Math.floor(Math.random() * TITLE_TEMPLATES.length)];
    const n = 5 + Math.floor(Math.random() * 11); // 5-15
    return template
        .replace('{Keyword}', capitalize(keyword))
        .replace('{keyword}', keyword)
        .replace('{Year}', CURRENT_YEAR.toString())
        .replace('{year}', CURRENT_YEAR.toString())
        .replace('{N}', n.toString());
}

// ─── Generate Meta Description ──────────────────────────────────────
function generateMetaDescription(keyword, title) {
    const templates = [
        `Discover everything you need to know about ${keyword} in ${CURRENT_YEAR}. Expert tips, best practices, tools, and actionable strategies in this comprehensive guide.`,
        `Complete guide to ${keyword} for ${CURRENT_YEAR}. Learn the fundamentals, best tools, proven strategies, and expert tips to succeed. Updated and comprehensive.`,
        `Looking to master ${keyword}? This in-depth ${CURRENT_YEAR} guide covers everything from basics to advanced strategies, tools, FAQs, and expert recommendations.`,
        `${title.replace(/ \|.*$/, '')}. Your ultimate resource for ${keyword} with practical advice, real-world examples, and expert insights for ${CURRENT_YEAR}.`
    ];
    const desc = templates[Math.floor(Math.random() * templates.length)];
    return desc.length > 160 ? desc.substring(0, 157) + '...' : desc;
}

// ─── Slugify ────────────────────────────────────────────────────────
function slugify(text) {
    return text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ─── Capitalize ─────────────────────────────────────────────────────
function capitalize(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Calculate Word Count ───────────────────────────────────────────
function wordCount(html) {
    return html.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w).length;
}

// ─── Calculate SEO Score ────────────────────────────────────────────
function calculateSeoScore(post) {
    let score = 0;
    const kw = (post.keyword || '').toLowerCase();
    
    // Title checks
    if (post.title) score += 10;
    if (post.title && post.title.toLowerCase().includes(kw)) score += 10;
    if (post.title && /\d/.test(post.title)) score += 5;
    if (post.title && post.title.includes(CURRENT_YEAR.toString())) score += 5;
    
    // Meta description
    if (post.metaDescription) score += 5;
    if (post.metaDescription && post.metaDescription.toLowerCase().includes(kw)) score += 5;
    if (post.metaDescription && post.metaDescription.length >= 120 && post.metaDescription.length <= 160) score += 5;
    
    // Content checks
    if (post.content) {
        const text = post.content.toLowerCase();
        if (text.includes(kw)) score += 10;
        
        // Keyword in first paragraph
        const firstP = text.match(/<p>(.*?)<\/p>/);
        if (firstP && firstP[1].includes(kw)) score += 5;
        
        // H2 headings
        const h2s = text.match(/<h2[^>]*>/g);
        if (h2s && h2s.length >= 3) score += 5;
        if (h2s && h2s.length >= 5) score += 5;
        
        // Lists
        if (/<ul>|<ol>/.test(text)) score += 5;
        
        // Word count
        const wc = wordCount(post.content);
        if (wc >= 1000) score += 5;
        if (wc >= 1500) score += 5;
        if (wc >= 2000) score += 5;
    }
    
    // Tags
    if (post.tags && post.tags.length >= 3) score += 5;
    
    // Featured image alt text
    if (post.featuredImageAlt) score += 5;
    
    return Math.min(100, score);
}

// ─── Main Article Generator ─────────────────────────────────────────
function generateArticle(keyword, category) {
    if (!category) category = categorizeKeyword(keyword);
    
    const title = generateTitle(keyword);
    const slug = slugify(title);
    const content = generateArticleContent(keyword, category);
    const metaDescription = generateMetaDescription(keyword, title);
    const metaTitle = `${title} | HedwigPost`;
    
    // Extract tags from keyword
    const tags = [
        capitalize(keyword),
        category,
        CURRENT_YEAR.toString(),
        ...keyword.split(' ').filter(w => w.length > 3).slice(0, 3).map(capitalize)
    ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

    const post = {
        id: Date.now().toString(),
        title,
        slug,
        content,
        excerpt: metaDescription,
        category,
        tags,
        author: 'HedwigPost Team',
        featuredImage: '',
        featuredImageAlt: `${capitalize(keyword)} guide ${CURRENT_YEAR}`,
        metaTitle,
        metaDescription,
        status: 'published',
        publishDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        readingTime: Math.max(1, Math.ceil(wordCount(content) / 200)),
        seoScore: 0,
        keyword, // track the primary keyword
        autoGenerated: true // flag for automation tracking
    };

    post.seoScore = calculateSeoScore(post);

    // Mark keyword as used
    markKeywordUsed(keyword);

    return post;
}

// ─── Bulk Article Generator ─────────────────────────────────────────
function generateBulkArticles(keywords) {
    const articles = [];
    for (const kw of keywords) {
        const keyword = typeof kw === 'string' ? kw : kw.keyword;
        const category = typeof kw === 'string' ? undefined : kw.category;
        try {
            const article = generateArticle(keyword, category);
            // Stagger publish dates (every 4-8 hours)
            const offset = articles.length * (4 + Math.random() * 4) * 3600000;
            article.publishDate = new Date(Date.now() + offset).toISOString();
            article.id = (Date.now() + articles.length).toString();
            articles.push(article);
        } catch (err) {
            console.log(`[ArticleGenerator] Failed to generate article for "${keyword}":`, err.message);
        }
    }
    return articles;
}

// ─── Exports ────────────────────────────────────────────────────────
module.exports = {
    generateArticle,
    generateBulkArticles,
    generateTitle,
    generateMetaDescription,
    generateArticleContent,
    generateFAQs,
    calculateSeoScore,
    slugify,
    capitalize,
    wordCount
};
