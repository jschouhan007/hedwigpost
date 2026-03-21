/* =====================================================
   HedwigPost - AI SEO Analysis Engine
   All algorithms run locally, no API keys needed
   ===================================================== */

const AiSeo = {
    // ==================== SEO SCORE ====================
    calculateScore(data) {
        let score = 0;
        const checks = [];
        let missingPlacements = [];

        // 1. Title length (10 pts)
        const titleLen = (data.title || '').length;
        if (titleLen >= 30 && titleLen <= 60) {
            score += 10; checks.push({ pass: true, msg: 'Title length is optimal (30-60 chars)' });
        } else if (titleLen > 0) {
            score += 5; checks.push({ pass: false, msg: `Title is ${titleLen < 30 ? 'too short' : 'too long'} (${titleLen} chars, aim for 30-60)` });
        } else {
            checks.push({ pass: false, msg: 'Title is missing' });
        }

        // 2. Meta description (10 pts)
        const metaLen = (data.metaDescription || '').length;
        if (metaLen >= 120 && metaLen <= 160) {
            score += 10; checks.push({ pass: true, msg: 'Meta description length is optimal (120-160 chars)' });
        } else if (metaLen > 0) {
            score += 5; checks.push({ pass: false, msg: `Meta description is ${metaLen < 120 ? 'too short' : 'too long'} (${metaLen} chars, aim for 120-160)` });
        } else {
            checks.push({ pass: false, msg: 'Meta description is missing' });
        }

        // 3. Content length (10 pts)
        const text = this.stripHtml(data.content || '');
        const wordCount = text.split(/\s+/).filter(w => w).length;
        if (wordCount >= 1000) {
            score += 10; checks.push({ pass: true, msg: `Content length is great (${wordCount} words)` });
        } else if (wordCount >= 500) {
            score += 7; checks.push({ pass: false, msg: `Content is decent (${wordCount} words, aim for 1000+)` });
        } else if (wordCount >= 200) {
            score += 4; checks.push({ pass: false, msg: `Content is too short (${wordCount} words, aim for 1000+)` });
        } else {
            checks.push({ pass: false, msg: `Content is very thin (${wordCount} words, minimum 300)` });
        }

        // 4. Headings (15 pts)
        const h1Count = (data.content || '').match(/<h1/gi)?.length || 0;
        const h2Count = (data.content || '').match(/<h2/gi)?.length || 0;

        if (h1Count === 1) {
            score += 5; checks.push({ pass: true, msg: 'Only one H1 tag found' });
        } else if (h1Count === 0) {
            checks.push({ pass: false, msg: 'Missing H1 heading' });
        } else {
            checks.push({ pass: false, msg: 'Multiple H1 tags detected. Only use one per page.' });
        }

        if (h2Count >= 2) {
            score += 10; checks.push({ pass: true, msg: `Good heading structure (${h2Count} H2 headings)` });
        } else if (h2Count >= 1) {
            score += 5; checks.push({ pass: false, msg: `Add more H2 headings (currently ${h2Count}, aim for 3+)` });
        } else {
            checks.push({ pass: false, msg: 'No H2 headings found - add subheadings' });
        }

        // 5. Focus Keyword (20 pts)
        const keyword = (data.focusKeyword || '').toLowerCase().trim();
        if (keyword) {
            const contentStr = text.toLowerCase();
            const kwDensity = this.getKeywordDensity(text, keyword);

            if ((data.title || '').toLowerCase().includes(keyword)) {
                score += 10; checks.push({ pass: true, msg: 'Focus keyword found in title' });
            } else {
                checks.push({ pass: false, msg: 'Add focus keyword to title' });
            }

            if (contentStr.includes(keyword) && kwDensity >= 0.5 && kwDensity <= 2.5) {
                score += 10; checks.push({ pass: true, msg: `Keyword density is good (${kwDensity.toFixed(1)}%)` });
            } else if (contentStr.includes(keyword)) {
                score += 5; checks.push({ pass: false, msg: `Density is ${kwDensity < 0.5 ? 'too low' : 'too high'} (${kwDensity.toFixed(1)}%, aim for 0.5-2.5%)` });
            } else {
                checks.push({ pass: false, msg: 'Focus keyword not found in content' });
            }
        } else {
            checks.push({ pass: false, msg: 'Set a primary focus keyword for better SEO' });
        }

        // 6. Images & Alt Text (10 pts)
        const imgTags = (data.content || '').match(/<img([^>]*)>/gi) || [];
        const imagesTotal = imgTags.length;
        const imagesWithAlt = imgTags.filter(tag => /alt=["']([^"']+)["']/i.test(tag) && tag.match(/alt=["']([^"']+)["']/i)[1].trim() !== '');
        const imagesWithoutAltCount = imagesTotal - imagesWithAlt.length;
        if (imagesTotal > 0) {
            if (imagesWithoutAltCount === 0) {
                score += 10; checks.push({ pass: true, msg: `All ${imagesTotal} images have alt text` });
            } else {
                score += 5; checks.push({ pass: false, msg: `${imagesWithoutAltCount} images missing alt text` });
            }
        } else if (wordCount > 300) {
            checks.push({ pass: false, msg: 'No images found - add visuals' });
        }

        // 7. Internal/External links (10 pts)
        const linkCount = (data.content || '').match(/<a\s/gi)?.length || 0;
        if (linkCount >= 2) {
            score += 10; checks.push({ pass: true, msg: `Good link usage (${linkCount} links found)` });
        } else if (linkCount >= 1) {
            score += 5; checks.push({ pass: false, msg: 'Add more internal/external links' });
        } else {
            checks.push({ pass: false, msg: 'No links found - add relevant links' });
        }

        // 8. Slug (5 pts)
        const slug = data.slug || '';
        if (slug && slug.length <= 60 && !slug.match(/\d{10,}/)) {
            score += 5; checks.push({ pass: true, msg: 'URL slug is SEO-friendly' });
        } else {
            checks.push({ pass: false, msg: 'Optimize URL slug (short, descriptive)' });
        }

        // 9. Readability (5 pts)
        const readability = this.fleschKincaid(text);
        if (readability.grade <= 8) {
            score += 5; checks.push({ pass: true, msg: `Readability is excellent (Grade: ${readability.grade.toFixed(1)})` });
        } else if (readability.grade <= 12) {
            score += 2; checks.push({ pass: false, msg: `Readability could be simpler (Grade: ${readability.grade.toFixed(1)})` });
        } else {
            checks.push({ pass: false, msg: `Content is hard to read (Grade: ${readability.grade.toFixed(1)})` });
        }

        return { score: Math.min(100, Math.round(score)), checks, wordCount, readability, imagesTotal, imagesWithoutAltCount };
    },

    // ==================== AI TITLE GENERATOR ====================
    generateTitles(content, keyword) {
        const text = this.stripHtml(content || '');
        const words = this.extractKeywords(text, 5);
        const kw = keyword || (words[0] || 'Technology');

        const templates = [
            `${this.capitalize(kw)}: The Complete Guide You Need in ${new Date().getFullYear()}`,
            `${Math.floor(Math.random() * 6) + 5} Best ${this.capitalize(kw)} Tips That Actually Work`,
            `How to Master ${this.capitalize(kw)} in ${new Date().getFullYear()}: A Beginner's Guide`,
            `${this.capitalize(kw)} Explained: Everything You Need to Know`,
            `The Ultimate ${this.capitalize(kw)} Guide for Beginners and Experts`,
            `Why ${this.capitalize(kw)} Matters More Than Ever in ${new Date().getFullYear()}`,
            `${this.capitalize(kw)} vs Alternatives: Which One Should You Choose?`,
            `Top ${Math.floor(Math.random() * 5) + 5} ${this.capitalize(kw)} Tricks Nobody Talks About`
        ];

        // Shuffle and return 5
        return templates.sort(() => Math.random() - 0.5).slice(0, 5);
    },

    // ==================== AI META DESCRIPTION ====================
    generateMetaDescription(title, content) {
        const text = this.stripHtml(content || '');
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

        if (sentences.length > 0) {
            // Use first meaningful sentence + title context
            let desc = sentences[0].trim();
            if (desc.length > 155) desc = desc.substring(0, 152) + '...';
            if (desc.length < 120 && sentences.length > 1) {
                desc += '. ' + sentences[1].trim();
                if (desc.length > 155) desc = desc.substring(0, 152) + '...';
            }
            return desc;
        }
        return `Read our comprehensive guide on ${title}. Get expert insights, tips, and more at HedwigPost.`;
    },

    // ==================== AI TAG SUGGESTIONS ====================
    suggestTags(content, category) {
        const text = this.stripHtml(content || '');
        const keywords = this.extractKeywords(text, 8);
        const tags = [...new Set([
            ...(category ? [category] : []),
            ...keywords.map(k => this.capitalize(k))
        ])];
        return tags.slice(0, 8);
    },

    // ==================== KEYWORD EXTRACTION (TF-IDF-like) ====================
    extractKeywords(text, count = 5) {
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'from', 'is', 'it', 'was', 'are', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'shall', 'should', 'may', 'might', 'can', 'could', 'this', 'that', 'these', 'those',
            'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its',
            'our', 'their', 'not', 'no', 'so', 'if', 'then', 'than', 'too', 'very', 'just', 'about', 'also',
            'how', 'what', 'when', 'where', 'who', 'which', 'while', 'all', 'each', 'every', 'both', 'few',
            'more', 'most', 'other', 'some', 'such', 'only', 'same', 'into', 'over', 'after', 'before', 'between',
            'under', 'again', 'further', 'once', 'here', 'there', 'why', 'own', 'get', 'got', 'one', 'two', 'use',
            'used', 'using', 'make', 'like', 'new', 'way', 'want', 'know', 'see', 'look', 'find', 'many', 'still',
            'even', 'much', 'well', 'back', 'any', 'good', 'best', 'great', 'need', 'first', 'last', 'long', 'big']);

        const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
        const freq = {};
        words.forEach(w => freq[w] = (freq[w] || 0) + 1);

        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([word]) => word);
    },

    // ==================== READABILITY (Flesch-Kincaid) ====================
    fleschKincaid(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const syllables = words.reduce((sum, w) => sum + this.countSyllables(w), 0);

        const sentCount = Math.max(1, sentences.length);
        const wordCount = Math.max(1, words.length);

        const grade = 0.39 * (wordCount / sentCount) + 11.8 * (syllables / wordCount) - 15.59;
        const readingEase = 206.835 - 1.015 * (wordCount / sentCount) - 84.6 * (syllables / wordCount);

        let level = 'Easy';
        if (readingEase < 30) level = 'Very Hard';
        else if (readingEase < 50) level = 'Hard';
        else if (readingEase < 60) level = 'Moderate';
        else if (readingEase < 70) level = 'Standard';

        return { grade: Math.max(0, grade), readingEase: Math.max(0, Math.min(100, readingEase)), level };
    },

    countSyllables(word) {
        word = word.toLowerCase().replace(/[^a-z]/g, '');
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);
        return matches ? matches.length : 1;
    },

    // ==================== HELPERS ====================
    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    },

    capitalize(str) {
        return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    },

    getKeywordDensity(text, keyword) {
        const words = text.toLowerCase().split(/\s+/);
        const kwWords = keyword.toLowerCase().split(/\s+/);
        if (kwWords.length === 1) {
            const count = words.filter(w => w.includes(kwWords[0])).length;
            return (count / Math.max(1, words.length)) * 100;
        }
        // Multi-word keyword
        let count = 0;
        const joined = text.toLowerCase();
        let pos = 0;
        while ((pos = joined.indexOf(keyword.toLowerCase(), pos)) !== -1) { count++; pos++; }
        return (count / Math.max(1, words.length / kwWords.length)) * 100;
    },

    // ==================== SOCIAL TAGS GENERATOR ====================
    generateSocialTags(title, description, featuredImage, slug) {
        return {
            ogTitle: title || 'Untitled Post',
            ogDesc: description || 'Read this article on HedwigPost.',
            ogImage: featuredImage || '/img/logo.png',
            ogUrl: '/post/' + (slug || 'untitled'),
            twitterCard: 'summary_large_image',
            twitterTitle: title || 'Untitled Post',
            twitterDesc: (description || '').substring(0, 200)
        };
    },

    // ==================== AUTO-SUGGEST ALT TEXT ====================
    autoSuggestAltText(contextText, imgSrc) {
        // Extract meaningful words from surrounding text
        const words = (contextText || '').replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
        if (words.length > 2) {
            return words.slice(0, 6).join(' ');
        }
        // Fallback: extract from filename in img src
        if (imgSrc) {
            const filename = imgSrc.split('/').pop().split('?')[0].replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
            if (filename.length > 3) return filename;
        }
        return 'Blog post image';
    }
};

