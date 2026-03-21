/* =====================================================
   HedwigPost — Main Application JavaScript
   ===================================================== */

// ==================== THEME MANAGEMENT ====================
function initTheme() {
    const saved = localStorage.getItem('HedwigPost-theme');
    const theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('HedwigPost-theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    if (theme === 'dark') {
        // Sun icon for dark mode (click to go light)
        icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else {
        // Moon icon for light mode (click to go dark)
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
}

// ==================== HEADER SCROLL ====================
function initHeaderScroll() {
    const header = document.getElementById('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
}

// ==================== MOBILE NAVIGATION ====================
function initMobileNav() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (!hamburger || !navLinks) return;
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const spans = hamburger.querySelectorAll('span');
        if (navLinks.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            spans[0].style.transform = '';
            spans[1].style.opacity = '';
            spans[2].style.transform = '';
        }
    });
    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => navLinks.classList.remove('active'));
    });
}

// ==================== SEARCH ====================
function initSearch() {
    const btn = document.getElementById('searchBtn');
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    if (!btn || !overlay) return;

    btn.addEventListener('click', () => {
        overlay.classList.add('active');
        setTimeout(() => input && input.focus(), 100);
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSearch();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            overlay.classList.add('active');
            setTimeout(() => input && input.focus(), 100);
        }
    });

    if (input) {
        let debounce;
        input.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => searchPosts(input.value), 300);
        });
    }
}

function closeSearch() {
    const overlay = document.getElementById('searchOverlay');
    if (overlay) overlay.classList.remove('active');
}

async function searchPosts(query) {
    const results = document.getElementById('searchResults');
    if (!results) return;
    if (!query.trim()) { results.innerHTML = ''; return; }

    try {
        const res = await fetch(`/api/posts?search=${encodeURIComponent(query)}&status=published`);
        const data = await res.json();
        if (data.posts.length === 0) {
            results.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-3)">No results found</div>';
            return;
        }
        results.innerHTML = data.posts.map(p => `
            <a href="/post/${p.slug}" class="search-result-item">
                <h4>${highlightText(p.title, query)}</h4>
                <p>${p.category} · ${p.readingTime} min read</p>
            </a>
        `).join('');
    } catch (e) {
        results.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-3)">Search error</div>';
    }
}

function highlightText(text, query) {
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background:var(--accent-glow);color:var(--text-0);padding:0 2px;border-radius:2px;">$1</mark>');
}

// ==================== BACK TO TOP ====================
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('show', window.scrollY > 400);
    });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ==================== READING PROGRESS ====================
function initReadingProgress() {
    const bar = document.getElementById('readingProgress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = progress + '%';
    });
}

// ==================== COOKIE CONSENT ====================
function initCookies() {
    if (!localStorage.getItem('HedwigPost-cookies')) {
        const banner = document.getElementById('cookieBanner');
        if (banner) banner.classList.add('show');
    }
}

function acceptCookies() {
    localStorage.setItem('HedwigPost-cookies', 'accepted');
    document.getElementById('cookieBanner')?.classList.remove('show');
}

function declineCookies() {
    localStorage.setItem('HedwigPost-cookies', 'declined');
    document.getElementById('cookieBanner')?.classList.remove('show');
}

// ==================== NEWSLETTER ====================
async function handleNewsletter(e) {
    e.preventDefault();
    const form = e.target;
    const input = form.querySelector('input');
    const btn = form.querySelector('button');
    const email = (input ? input.value : '').trim();

    if (!email) return false;

    // Disable button during submission
    const origText = btn.textContent;
    btn.textContent = 'Subscribing...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();

        // Remove any existing message
        const existingMsg = form.parentElement.querySelector('.newsletter-msg');
        if (existingMsg) existingMsg.remove();

        // Create inline message
        const msg = document.createElement('div');
        msg.className = 'newsletter-msg';
        msg.style.cssText = `margin-top:10px;padding:10px 14px;border-radius:8px;font-size:.85rem;font-weight:500;animation:fadeIn .3s ease`;

        if (res.ok) {
            msg.style.background = 'rgba(16,185,129,.12)';
            msg.style.color = '#10b981';
            msg.style.border = '1px solid rgba(16,185,129,.25)';
            msg.textContent = '✨ ' + (data.message || 'Successfully subscribed!');
            input.value = '';
        } else {
            msg.style.background = 'rgba(245,158,11,.1)';
            msg.style.color = '#f59e0b';
            msg.style.border = '1px solid rgba(245,158,11,.2)';
            msg.textContent = '⚠️ ' + (data.error || 'Something went wrong.');
        }

        form.parentElement.appendChild(msg);

        // Auto-remove message after 5 seconds
        setTimeout(() => {
            if (msg.parentElement) {
                msg.style.opacity = '0';
                msg.style.transition = 'opacity .3s ease';
                setTimeout(() => msg.remove(), 300);
            }
        }, 5000);

    } catch (err) {
        alert('Network error. Please try again later.');
    }

    btn.textContent = origText;
    btn.disabled = false;
    return false;
}

// ==================== SCROLL REVEAL ====================
function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ==================== ANIMATED STAT COUNTERS ====================
function initStatCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    if (counters.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'));
    const suffix = el.textContent.replace(/[\d,]/g, '').trim();
    const duration = 1500;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const current = Math.floor(eased * target);

        if (target >= 1000) {
            el.textContent = (current / 1000).toFixed(current >= target ? 0 : 1) + 'K' + suffix;
        } else {
            el.textContent = current + suffix;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            // Set final value
            if (target >= 10000) {
                el.textContent = Math.floor(target / 1000) + 'K+';
            } else if (target >= 1000) {
                el.textContent = (target / 1000).toFixed(0) + 'K+';
            } else {
                el.textContent = target + '+';
            }
        }
    }

    requestAnimationFrame(update);
}

// ==================== DATE FORMATTING ====================
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ==================== POST CARD ICONS ====================
const categoryIcons = {};

function getCategoryIcon(cat) {
    return '';
}

// ==================== LOAD HOMEPAGE DATA ====================
async function loadHomepage() {
    try {
        // Load posts
        const postsRes = await fetch('/api/posts?status=published&limit=10');
        const postsData = await postsRes.json();

        // Load categories
        const catsRes = await fetch('/api/categories');
        const cats = await catsRes.json();

        // Render featured news grid (top 5 posts)
        if (postsData.posts.length > 0) {
            renderFeaturedNewsGrid(postsData.posts.slice(0, 5));
        }

        // Render posts grid (skip featured)
        const gridPosts = postsData.posts.slice(5);
        renderPostsGrid(gridPosts);

        // Render sidebar
        renderCategories(cats);
        renderPopularPosts(postsData.posts.slice(0, 5));
        renderFooterCategories(cats);

        // Render trending posts
        const trendingEl = document.getElementById('trendingPosts');
        if (trendingEl && postsData.posts.length > 0) {
            trendingEl.innerHTML = postsData.posts.slice(0, 8).map((p, i) => `
                <a href="/post/${p.slug}" class="trending-card">
                    <div class="trending-rank">#${i + 1} Trending</div>
                    <h4>${p.title}</h4>
                    <div class="meta">${p.readingTime || '5'} min · ${p.category}</div>
                </a>
            `).join('');
        }

    } catch (e) {
        console.error('Failed to load homepage:', e);
    }
}

function renderFeaturedNewsGrid(posts) {
    const container = document.getElementById('featuredPost');
    if (!container || posts.length === 0) return;
    const main = posts[0];
    const side = posts.slice(1, 5);
    container.innerHTML = `
        <div class="featured-grid">
            <a href="/post/${main.slug}" class="featured-main">
                ${main.featuredImage ? `<img src="${main.featuredImage}" alt="${main.featuredImageAlt || main.title}" loading="lazy">` : ''}
                <div class="featured-main-overlay">
                    <span class="cat-label">${main.category}</span>
                    <h2>${main.title}</h2>
                    <div class="meta">${formatDate(main.publishDate)} · ${main.readingTime} min read</div>
                </div>
            </a>
            <div class="featured-side">
                ${side.map(p => `
                    <a href="/post/${p.slug}" class="featured-side-item">
                        ${p.featuredImage ? `<img src="${p.featuredImage}" alt="${p.featuredImageAlt || p.title}" loading="lazy">` : `<div style="width:45%;background:var(--bg-3);display:flex;align-items:center;justify-content:center;font-size:1.5rem">${getCategoryIcon(p.category)}</div>`}
                        <div class="fsi-text">
                            <span class="cat-label">${p.category}</span>
                            <h3>${p.title}</h3>
                            <div class="meta">${formatDate(p.publishDate)}</div>
                        </div>
                    </a>
                `).join('')}
            </div>
        </div>
    `;
}

function renderPostsGrid(posts) {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;
    if (posts.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text-3);padding:40px;">No posts yet. Check back soon!</p>';
        return;
    }
    grid.innerHTML = posts.map((post, i) => `
        <a href="/post/${post.slug}" class="post-card reveal" style="animation-delay:${i * 0.05}s">
            <div class="post-card-image">
                ${post.featuredImage
            ? `<img src="${post.featuredImage}" alt="${post.featuredImageAlt || post.title}" loading="lazy">`
            : `<span class="placeholder-icon">${getCategoryIcon(post.category)}</span>`
        }
            </div>
            <div class="post-card-body">
                <div class="post-card-meta">
                    <span class="post-card-category">${post.category}</span>
                    <span>${formatDate(post.publishDate)}</span>
                </div>
                <h3>${post.title}</h3>
                <p>${post.excerpt}</p>
                <div class="post-card-footer">
                    <span>${post.readingTime} min read</span>
                    <span class="read-more">Read More →</span>
                </div>
            </div>
        </a>
    `).join('');
    setTimeout(initReveal, 100);
}

function getGradient(i) {
    const gradients = [
        'linear-gradient(135deg, #8b5cf6, #06b6d4)',
        'linear-gradient(135deg, #f093fb, #ec4899)',
        'linear-gradient(135deg, #3b82f6, #06b6d4)',
        'linear-gradient(135deg, #10b981, #059669)',
        'linear-gradient(135deg, #f59e0b, #ef4444)',
        'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'linear-gradient(135deg, #14b8a6, #06b6d4)',
        'linear-gradient(135deg, #ec4899, #f43f5e)'
    ];
    return gradients[i % gradients.length];
}

function renderCategories(cats) {
    const list = document.getElementById('categoryList');
    if (!list) return;
    list.innerHTML = cats.map(c => `
        <li><a href="/category/${c.slug}">
            <span>${c.name}</span>
            <span class="category-count">${c.postCount}</span>
        </a></li>
    `).join('');

    // Inject top categories into nav bar dynamically
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        const homeLink = navLinks.querySelector('a[href="/"]');
        const allPostsLink = navLinks.querySelector('a[href="/blogs"]');
        if (homeLink && allPostsLink) {
            const topCats = cats.slice(0, 5);
            topCats.forEach(c => {
                const li = document.createElement('li');
                // Product Reviews redirects to /deals hub
                const href = c.slug === 'product-reviews' ? '/deals' : `/category/${c.slug}`;
                li.innerHTML = `<a href="${href}">${c.name}</a>`;
                allPostsLink.parentElement.before(li);
            });
        }
    }
}

function renderPopularPosts(posts) {
    const container = document.getElementById('popularPosts');
    if (!container) return;
    container.innerHTML = posts.map((p, i) => `
        <a href="/post/${p.slug}" style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--line-light);text-decoration:none;color:inherit;">
            <span style="font-size:1.1rem;font-weight:800;color:var(--red);opacity:0.4;min-width:22px;">${String(i + 1).padStart(2, '0')}</span>
            <div>
                <h4 style="font-size:.84rem;font-weight:700;line-height:1.3;margin-bottom:2px;color:var(--text-black);">${p.title}</h4>
                <span style="font-size:.7rem;color:var(--text-muted);">${formatDate(p.publishDate)}</span>
            </div>
        </a>
    `).join('');
}

function renderFooterCategories(cats) {
    const container = document.getElementById('footerCategories');
    if (!container) return;
    container.innerHTML = cats.map(c =>
        `<li><a href="/category/${c.slug}">${c.name}</a></li>`
    ).join('');
}

// ==================== CATEGORY PAGE ====================
async function loadCategoryPage() {
    const slug = window.location.pathname.split('/category/')[1];
    if (!slug) return;

    try {
        const catsRes = await fetch('/api/categories');
        const cats = await catsRes.json();
        const cat = cats.find(c => c.slug === slug);

        const titleEl = document.getElementById('categoryTitle');
        const descEl = document.getElementById('categoryDesc');
        if (titleEl) titleEl.textContent = cat ? cat.name : slug;
        if (descEl) descEl.textContent = cat ? cat.description : '';

        document.title = `${cat ? cat.name : slug} — HedwigPost`;

        const postsRes = await fetch(`/api/posts?status=published&category=${encodeURIComponent(cat ? cat.name : slug)}`);
        const data = await postsRes.json();

        const grid = document.getElementById('categoryPosts');
        if (grid) {
            grid.innerHTML = data.posts.map((post, i) => `
                <a href="/post/${post.slug}" class="post-card reveal" style="animation-delay:${i * 0.08}s">
                    <div class="post-card-image" style="background:${getGradient(i)}">
                        ${post.featuredImage
                    ? `<img src="${post.featuredImage}" alt="${post.featuredImageAlt || post.title}" loading="lazy">`
                    : `<span class="placeholder-icon">${getCategoryIcon(post.category)}</span>`
                }
                    </div>
                    <div class="post-card-body">
                        <div class="post-card-meta">
                            <span class="post-card-category">${post.category}</span>
                            <span>${formatDate(post.publishDate)}</span>
                        </div>
                        <h3>${post.title}</h3>
                        <p>${post.excerpt}</p>
                        <div class="post-card-footer">
                            <span>⏱ ${post.readingTime} min read</span>
                            <span class="read-more">Read More →</span>
                        </div>
                    </div>
                </a>
            `).join('');
            setTimeout(initReveal, 100);
        }
    } catch (e) {
        console.error('Failed to load category:', e);
    }
}

// ==================== POST PAGE ====================
async function loadPostPage() {
    const slug = window.location.pathname.split('/post/')[1];
    if (!slug) return;

    try {
        const res = await fetch(`/api/posts/${slug}`);
        if (!res.ok) throw new Error('Post not found');
        const post = await res.json();

        // Update page title and meta
        document.title = `${post.metaTitle || post.title} | HedwigPost`;
        setMeta('description', post.metaDescription || post.excerpt);
        setMeta('og:title', post.metaTitle || post.title, 'property');
        setMeta('og:description', post.metaDescription || post.excerpt, 'property');
        setMeta('og:type', 'article', 'property');

        // Render breadcrumb
        const breadcrumb = document.getElementById('breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = `
                <a href="/">Home</a> <span>›</span>
                <a href="/category/${slugify(post.category)}">${post.category}</a> <span>›</span>
                <span>${truncate(post.title, 40)}</span>
            `;
        }

        // Render post header
        const headerEl = document.getElementById('postHeader');
        if (headerEl) {
            headerEl.innerHTML = `
                <a href="/category/${slugify(post.category)}" class="post-category">${post.category}</a>
                <h1>${post.title}</h1>
                <div class="post-meta-bar">
                    <span>👤 ${post.author}</span>
                    <span class="divider"></span>
                    <span>📅 ${formatDate(post.publishDate)}</span>
                    <span class="divider"></span>
                    <span>⏱ ${post.readingTime} min read</span>
                </div>
            `;
        }

        // Featured image
        const imgEl = document.getElementById('postImage');
        if (imgEl) {
            if (post.featuredImage) {
                imgEl.innerHTML = `<img src="${post.featuredImage}" alt="${post.featuredImageAlt || post.title}">`;
                imgEl.style.display = 'block';
            } else {
                imgEl.style.display = 'none';
            }
        }

        // Generate TOC
        const tocEl = document.getElementById('postToc');
        if (tocEl) {
            const headings = post.content.match(/<h2[^>]*>(.*?)<\/h2>/gi);
            if (headings && headings.length > 0) {
                const items = headings.map((h, i) => {
                    const text = h.replace(/<[^>]*>/g, '');
                    return `<li><a href="#heading-${i}">${text}</a></li>`;
                });
                tocEl.innerHTML = `
                    <div class="toc">
                        <div class="toc-title">📑 Table of Contents</div>
                        <ol>${items.join('')}</ol>
                    </div>
                `;
                // Add IDs to headings in content
                let idx = 0;
                post.content = post.content.replace(/<h2([^>]*)>/gi, () => `<h2 id="heading-${idx++}">`);
            }
        }

        // Post content
        const contentEl = document.getElementById('postContent');
        if (contentEl) contentEl.innerHTML = post.content;

        // Share buttons
        const shareEl = document.getElementById('shareBar');
        if (shareEl) {
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(post.title);
            shareEl.innerHTML = `
                <span>Share this article:</span>
                <a href="https://twitter.com/intent/tweet?url=${url}&text=${title}" target="_blank" class="share-btn" aria-label="Share on Twitter">𝕏</a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" target="_blank" class="share-btn" aria-label="Share on Facebook">f</a>
                <a href="https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}" target="_blank" class="share-btn" aria-label="Share on LinkedIn">in</a>
                <a href="https://api.whatsapp.com/send?text=${title}%20${url}" target="_blank" class="share-btn" aria-label="Share on WhatsApp">💬</a>
                <button class="share-btn" onclick="copyLink()" aria-label="Copy link">🔗</button>
            `;
        }

        // Author box
        const authorEl = document.getElementById('authorBox');
        if (authorEl) {
            authorEl.innerHTML = `
                <div class="author-box">
                    <div class="author-avatar">${post.author.charAt(0)}</div>
                    <div class="author-info">
                        <h4>${post.author}</h4>
                        <p>Tech enthusiast and writer at HedwigPost. Passionate about simplifying technology for everyone.</p>
                    </div>
                </div>
            `;
        }

        // Tags
        const tagsEl = document.getElementById('postTags');
        if (tagsEl && post.tags && post.tags.length > 0) {
            tagsEl.innerHTML = `
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin:24px 0;">
                    ${post.tags.map(t => `<a href="/tag/${encodeURIComponent(t)}" style="padding:5px 14px;background:var(--tag-bg);border-radius:50px;font-size:0.82rem;color:var(--tag-color);border:1px solid rgba(139,92,246,0.15);transition:all 0.25s;font-family:var(--font-mono);text-decoration:none;">#${t}</a>`).join('')}
                </div>
            `;
        }

        // Related posts - populate sidebar
        const sidebarRelated = document.getElementById('sidebarRelatedPosts');
        const relatedEl = document.getElementById('relatedPosts');
        const relRes = await fetch(`/api/posts?status=published&category=${encodeURIComponent(post.category)}&limit=6`);
        const relData = await relRes.json();
        const related = relData.posts.filter(p => p.slug !== post.slug).slice(0, 5);
        if (sidebarRelated && related.length > 0) {
            sidebarRelated.innerHTML = related.map(p => `
                <a href="/post/${p.slug}" class="sidebar-post-item">
                    ${p.featuredImage ? `<img src="${p.featuredImage}" alt="${p.featuredImageAlt || p.title}" loading="lazy">` : ''}
                    <div>
                        <h5>${p.title}</h5>
                        <span class="meta">${p.readingTime || '5'} min · ${formatDate(p.publishDate)}</span>
                    </div>
                </a>
            `).join('');
        }

        // Fetch all posts for trending, featured, latest
        try {
            const allRes = await fetch('/api/posts?status=published&limit=10');
            const allData = await allRes.json();
            const allPosts = allData.posts.filter(p => p.slug !== post.slug);

            // Trending Posts (top 5)
            const trendingEl = document.getElementById('sidebarTrendingPosts');
            if (trendingEl && allPosts.length > 0) {
                trendingEl.innerHTML = allPosts.slice(0, 5).map((p, i) => `
                    <a href="/post/${p.slug}" class="sidebar-numbered-item">
                        <span class="rank">${String(i + 1).padStart(2, '0')}</span>
                        <div>
                            <h5>${p.title}</h5>
                            <span class="meta">${p.readingTime || '5'} min · ${p.category}</span>
                        </div>
                    </a>
                `).join('');
            }

            // Editor's Pick (featured post)
            const featuredEl = document.getElementById('sidebarFeaturedPost');
            if (featuredEl && allPosts.length > 0) {
                const fp = allPosts[0];
                featuredEl.innerHTML = `
                    <a href="/post/${fp.slug}" class="sidebar-featured-card">
                        ${fp.featuredImage ? `<img src="${fp.featuredImage}" alt="${fp.featuredImageAlt || fp.title}" loading="lazy">` : ''}
                        <div class="card-body">
                            <h5>${fp.title}</h5>
                            <span class="meta">${fp.category} · ${formatDate(fp.publishDate)}</span>
                        </div>
                    </a>
                `;
            }

            // More from HedwigPost (latest 5, different from related)
            const latestEl = document.getElementById('sidebarLatestPosts');
            if (latestEl && allPosts.length > 2) {
                const latest = allPosts.filter(p => !related.find(r => r.slug === p.slug)).slice(0, 5);
                latestEl.innerHTML = latest.map(p => `
                    <a href="/post/${p.slug}" class="sidebar-post-item">
                        ${p.featuredImage ? `<img src="${p.featuredImage}" alt="${p.featuredImageAlt || p.title}" loading="lazy">` : ''}
                        <div>
                            <h5>${p.title}</h5>
                            <span class="meta">${p.readingTime || '5'} min · ${p.category}</span>
                        </div>
                    </a>
                `).join('');
            }
        } catch(e) { console.error('Sidebar widgets error:', e); }

        // Add structured data
        addArticleSchema(post);

        // Previous/Next navigation
        initPostNavigation(post.slug);

    } catch (e) {
        console.error('Failed to load post:', e);
        const contentEl = document.getElementById('postContent');
        if (contentEl) contentEl.innerHTML = '<div style="text-align:center;padding:60px;"><h2>Post Not Found</h2><p>The article you\'re looking for doesn\'t exist.</p><a href="/" class="btn btn-primary" style="margin-top:20px;">← Back to Home</a></div>';
    }
}

// ==================== SEO HELPERS ====================
function setMeta(name, content, attr = 'name') {
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function addArticleSchema(post) {
    const baseUrl = window.location.origin;
    const postUrl = baseUrl + '/post/' + post.slug;

    // 1. Article Schema (enhanced)
    const schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.metaDescription || post.excerpt,
        "author": { "@type": "Person", "name": post.author, "url": baseUrl + "/author" },
        "datePublished": post.publishDate,
        "dateModified": post.updatedDate || post.publishDate,
        "publisher": {
            "@type": "Organization",
            "name": "HedwigPost",
            "logo": { "@type": "ImageObject", "url": baseUrl + "/img/logo.png" }
        },
        "url": postUrl,
        "mainEntityOfPage": { "@type": "WebPage", "@id": postUrl },
        "wordCount": post.content.replace(/<[^>]*>/g, '').split(/\s+/).length,
        "articleSection": post.category,
        "keywords": post.tags ? post.tags.join(', ') : '',
        "inLanguage": "en-US"
    };
    if (post.featuredImage) schema.image = post.featuredImage;
    addJsonLd(schema);

    // 2. Breadcrumb Schema
    addJsonLd({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl + "/" },
            { "@type": "ListItem", "position": 2, "name": post.category, "item": baseUrl + "/category/" + slugify(post.category) },
            { "@type": "ListItem", "position": 3, "name": post.title, "item": postUrl }
        ]
    });

    // 3. FAQ Schema (extract Q&A pairs from h3 headings with question marks)
    const faqItems = [];
    const faqRegex = /<h3[^>]*>(.*?)<\/h3>\s*<p>([\s\S]*?)(?=<h[23]|$)/gi;
    let m;
    while ((m = faqRegex.exec(post.content)) !== null) {
        const q = m[1].replace(/<[^>]*>/g, '').trim();
        const a = m[2].replace(/<[^>]*>/g, '').trim();
        if (q.includes('?') && a.length > 20) {
            faqItems.push({
                "@type": "Question",
                "name": q,
                "acceptedAnswer": { "@type": "Answer", "text": a }
            });
        }
    }
    if (faqItems.length > 0) {
        addJsonLd({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faqItems });
    }

    // 4. Set canonical URL dynamically
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = postUrl;

    // 5. Set OG URL & image
    setMeta('og:url', postUrl, 'property');
    if (post.featuredImage) {
        setMeta('og:image', post.featuredImage, 'property');
        setMeta('twitter:image', post.featuredImage);
    }

    // 6. Post-render enhancements
    setTimeout(function() {
        // Syntax highlighting
        if (typeof Prism !== 'undefined') Prism.highlightAll();

        // Add copy buttons to code blocks
        document.querySelectorAll('.post-content pre').forEach(function(pre) {
            if (pre.querySelector('.copy-btn')) return;
            var btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.textContent = 'Copy';
            btn.addEventListener('click', function() {
                var code = pre.querySelector('code') || pre;
                navigator.clipboard.writeText(code.textContent).then(function() {
                    btn.textContent = 'Copied!';
                    setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
                });
            });
            pre.appendChild(btn);
        });

        // TOC collapse toggle
        document.querySelectorAll('.toc .toc-title').forEach(function(title) {
            title.addEventListener('click', function() {
                title.closest('.toc').classList.toggle('collapsed');
            });
        });

        // TOC scroll-spy
        var tocLinks = document.querySelectorAll('.toc ol a');
        if (tocLinks.length > 0) {
            var headings = Array.from(document.querySelectorAll('[id^="heading-"]'));
            var ticking = false;
            window.addEventListener('scroll', function() {
                if (!ticking) {
                    requestAnimationFrame(function() {
                        var activeIdx = 0;
                        headings.forEach(function(h, i) {
                            if (h.getBoundingClientRect().top <= 120) activeIdx = i;
                        });
                        tocLinks.forEach(function(l, i) {
                            l.classList.toggle('active', i === activeIdx);
                        });
                        ticking = false;
                    });
                    ticking = true;
                }
            });
        }
    }, 500);
}

function addJsonLd(data) {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
}


// ==================== UTILITY ====================
function slugify(text) {
    return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
}

function truncate(text, len) {
    return text.length > len ? text.substring(0, len) + '...' : text;
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, duration = 3000) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('🔗 Link copied to clipboard!');
    });
}

// ==================== PRINT ARTICLE ====================
function printArticle() {
    window.print();
}

// ==================== WEB SHARE API ====================
function nativeShare() {
    if (navigator.share) {
        navigator.share({
            title: document.title,
            url: window.location.href
        }).catch(() => {});
    } else {
        copyLink();
    }
}

// ==================== LIGHTBOX ====================
function initLightbox() {
    let overlay = document.querySelector('.lightbox-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        overlay.innerHTML = '<button class="lightbox-close">&times;</button><img src="" alt="Lightbox">';
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => {
            if (e.target !== overlay.querySelector('img')) overlay.classList.remove('active');
        });
        overlay.querySelector('.lightbox-close').addEventListener('click', () => overlay.classList.remove('active'));
    }
    document.querySelectorAll('.post-content img, .static-page img').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            overlay.querySelector('img').src = img.src;
            overlay.querySelector('img').alt = img.alt || 'Image';
            overlay.classList.add('active');
        });
    });
}

// ==================== EXIT INTENT POPUP ====================
function initExitPopup() {
    if (localStorage.getItem('HedwigPost-exit-shown')) return;
    let popup = document.querySelector('.exit-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.className = 'exit-popup';
        popup.innerHTML = `
            <div class="exit-popup-content">
                <button class="exit-popup-close" onclick="closeExitPopup()">&times;</button>
                <h2>✨ Wait! Don't Leave Yet</h2>
                <p>Subscribe to our newsletter and get the latest articles delivered to your inbox every week.</p>
                <form onsubmit="event.preventDefault(); handleExitNewsletter(this);">
                    <input type="email" placeholder="your@email.com" required>
                    <button type="submit" class="btn btn-primary">Subscribe</button>
                </form>
            </div>
        `;
        document.body.appendChild(popup);
    }
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY < 0 && !localStorage.getItem('HedwigPost-exit-shown')) {
            popup.classList.add('active');
            localStorage.setItem('HedwigPost-exit-shown', 'true');
        }
    }, { once: true });
}

function closeExitPopup() {
    const popup = document.querySelector('.exit-popup');
    if (popup) popup.classList.remove('active');
}

function handleExitNewsletter(form) {
    const email = form.querySelector('input').value;
    fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    }).then(r => r.json()).then(data => {
        showToast(data.message || '✅ Subscribed successfully!');
        closeExitPopup();
    }).catch(() => {
        showToast('Already subscribed or try again!');
        closeExitPopup();
    });
}

// ==================== FAQ ACCORDION ====================
function initFaqAccordion() {
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.contains('open');
            // Close all others
            item.closest('.faq-section')?.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });
}

// ==================== TAB SWITCHER ====================
function initTabs() {
    document.querySelectorAll('.tab-container').forEach(container => {
        const btns = container.querySelectorAll('.tab-btn');
        const panels = container.querySelectorAll('.tab-panel');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const target = btn.getAttribute('data-tab');
                const panel = container.querySelector(`[data-panel="${target}"]`);
                if (panel) panel.classList.add('active');
            });
        });
    });
}

// ==================== CODE BLOCK COPY BUTTONS ====================
function initCopyCodeButtons() {
    document.querySelectorAll('.post-content pre').forEach(pre => {
        if (pre.parentElement.classList.contains('code-block-wrap')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrap';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);
        const btn = document.createElement('button');
        btn.className = 'copy-code-btn';
        btn.textContent = 'Copy';
        btn.addEventListener('click', () => {
            const code = pre.querySelector('code') || pre;
            navigator.clipboard.writeText(code.textContent).then(() => {
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
            });
        });
        wrapper.appendChild(btn);
    });
}

// ==================== FLOATING SHARE SIDEBAR ====================
function initFloatingShare() {
    const bar = document.querySelector('.floating-share');
    if (!bar) return;
    const postBody = document.querySelector('.post-body');
    if (!postBody) return;
    window.addEventListener('scroll', () => {
        const rect = postBody.getBoundingClientRect();
        if (rect.top < 200 && rect.bottom > 200) {
            bar.classList.add('visible');
        } else {
            bar.classList.remove('visible');
        }
    });
}

// ==================== AUTO COPYRIGHT YEAR ====================
function initAutoYear() {
    document.querySelectorAll('.auto-year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });
}

// ==================== SERVICE WORKER REGISTRATION ====================
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
}

// ==================== NEWS TICKER ====================
function initNewsTicker() {
    const container = document.getElementById('newsTicker');
    if (!container) return;
    fetch('/api/posts?status=published')
        .then(r => r.json())
        .then(data => {
            const posts = (data.posts || data).slice(0, 6);
            if (!posts.length) return;
            const track = container.querySelector('.news-ticker-track');
            if (!track) return;
            const items = posts.map(p => `<div class="news-ticker-item">🔹 <a href="/post/${p.slug}">${p.title}</a></div>`).join('');
            track.innerHTML = items + items; // Duplicate for seamless scroll
        });
}

// ==================== BLOG LISTING PAGE ====================
function loadBlogsPage() {
    const grid = document.getElementById('blogsGrid');
    const tabs = document.getElementById('filterTabs');
    const sortSelect = document.getElementById('sortSelect');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!grid) return;

    let allPosts = [];
    let filteredPosts = [];
    let currentFilter = 'all';
    let currentSort = 'newest';
    let displayCount = 12;

    // Load categories for filter tabs
    fetch('/api/categories').then(r => r.json()).then(cats => {
        if (tabs) {
            cats.forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'filter-tab';
                btn.dataset.filter = cat.slug;
                btn.textContent = cat.name;
                btn.addEventListener('click', () => {
                    tabs.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentFilter = cat.slug;
                    displayCount = 12;
                    filterAndRender();
                });
                tabs.appendChild(btn);
            });
            // "All" tab click handler
            tabs.querySelector('.filter-tab').addEventListener('click', () => {
                tabs.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
                tabs.querySelector('.filter-tab').classList.add('active');
                currentFilter = 'all';
                displayCount = 12;
                filterAndRender();
            });
        }
        // Also populate footer categories
        const footerCats = document.getElementById('footerCategories');
        if (footerCats) {
            footerCats.innerHTML = cats.map(c => `<li><a href="/category/${c.slug}">${c.name}</a></li>`).join('');
        }
    });

    // Load all posts
    fetch('/api/posts?status=published').then(r => r.json()).then(data => {
        allPosts = data.posts || data;
        filterAndRender();
    });

    // Sort handler
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            filterAndRender();
        });
    }

    function filterAndRender() {
        filteredPosts = currentFilter === 'all' 
            ? [...allPosts] 
            : allPosts.filter(p => slugify(p.category) === currentFilter);
        
        if (currentSort === 'oldest') filteredPosts.sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));
        else filteredPosts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

        const toShow = filteredPosts.slice(0, displayCount);
        grid.innerHTML = toShow.map(p => renderPostCard(p)).join('');
        
        if (loadMoreBtn) {
            loadMoreBtn.style.display = displayCount < filteredPosts.length ? 'inline-flex' : 'none';
        }
        initScrollReveal();
    }

    // Load more handler
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            displayCount += 12;
            filterAndRender();
        });
    }
}

// ==================== TAG PAGE ====================
function loadTagPage() {
    const tag = decodeURIComponent(window.location.pathname.replace('/tag/', ''));
    const titleEl = document.getElementById('tagTitle');
    const descEl = document.getElementById('tagDesc');
    const postsEl = document.getElementById('tagPosts');
    if (!postsEl) return;
    
    if (titleEl) titleEl.textContent = `🏷️ ${tag}`;
    document.title = `${tag} — HedwigPost`;

    fetch('/api/posts?status=published').then(r => r.json()).then(data => {
        const posts = (data.posts || data).filter(p => 
            p.tags && p.tags.some(t => t.toLowerCase() === tag.toLowerCase())
        );
        if (descEl) descEl.textContent = `${posts.length} article${posts.length !== 1 ? 's' : ''} tagged "${tag}"`;
        postsEl.innerHTML = posts.length 
            ? posts.map(p => renderPostCard(p)).join('')
            : `<p style="text-align:center;color:var(--text-3);padding:40px;">No posts found with tag "${tag}"</p>`;
        initScrollReveal();
    });
}

// ==================== AUTHOR PAGE ====================
function loadAuthorPage() {
    const authorSlug = decodeURIComponent(window.location.pathname.replace('/author/', ''));
    const nameEl = document.getElementById('authorName');
    const postsEl = document.getElementById('authorPosts');
    const titleEl = document.getElementById('authorPostsTitle');
    const avatarEl = document.getElementById('authorAvatar');
    if (!postsEl) return;

    fetch('/api/posts?status=published').then(r => r.json()).then(data => {
        const posts = (data.posts || data).filter(p => 
            p.author && slugify(p.author) === slugify(authorSlug)
        );
        const authorName = posts.length ? posts[0].author : authorSlug;
        
        if (nameEl) nameEl.textContent = authorName;
        if (avatarEl) avatarEl.textContent = authorName.charAt(0).toUpperCase();
        if (titleEl) titleEl.textContent = `📝 ${posts.length} Article${posts.length !== 1 ? 's' : ''} by ${authorName}`;
        document.title = `${authorName} — HedwigPost`;

        postsEl.innerHTML = posts.length 
            ? posts.map(p => renderPostCard(p)).join('')
            : `<p style="text-align:center;color:var(--text-3);padding:40px;">No posts found by this author.</p>`;
        initScrollReveal();
    });
}

// ==================== ARCHIVE PAGE ====================
function loadArchivePage() {
    const container = document.getElementById('archiveContent');
    if (!container) return;

    fetch('/api/posts?status=published').then(r => r.json()).then(data => {
        const posts = (data.posts || data).sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
        const grouped = {};
        posts.forEach(p => {
            const d = new Date(p.publishDate);
            const key = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(p);
        });

        container.innerHTML = Object.entries(grouped).map(([month, posts]) => `
            <div class="archive-group">
                <h3 class="archive-month">${month} (${posts.length})</h3>
                <ul class="archive-list">
                    ${posts.map(p => `
                        <li>
                            <a href="/post/${p.slug}">${p.title}</a>
                            <span class="archive-date">${new Date(p.publishDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('') || '<p style="text-align:center;color:var(--text-3);">No posts in archive.</p>';
    });
}

// ==================== SITEMAP PAGE ====================
function loadSitemapPage() {
    const catsEl = document.getElementById('sitemapCategories');
    const postsEl = document.getElementById('sitemapPosts');

    if (catsEl) {
        fetch('/api/categories').then(r => r.json()).then(cats => {
            catsEl.innerHTML = cats.map(c => `<li><a href="/category/${c.slug}">${c.name}</a></li>`).join('');
        });
    }

    if (postsEl) {
        fetch('/api/posts?status=published').then(r => r.json()).then(data => {
            const posts = data.posts || data;
            postsEl.innerHTML = '<ul>' + posts.map(p => 
                `<li><a href="/post/${p.slug}">${p.title}</a> — <span style="color:var(--text-3);font-size:.85rem;">${p.category}</span></li>`
            ).join('') + '</ul>';
        });
    }
}

// ==================== RENDER POST CARD (REUSABLE) ====================
function renderPostCard(post) {
    const postDate = post.publishDate || post.date;
    const isNew = postDate && (new Date() - new Date(postDate)) < 7 * 24 * 60 * 60 * 1000;
    const label = isNew ? '<span class="post-label post-label-new">New</span>' : '';
    const excerpt = post.excerpt || (post.content ? post.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '');
    const dateStr = postDate ? new Date(postDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const image = post.featuredImage 
        ? `<div class="post-card-image" style="position:relative;">${label}<img src="${post.featuredImage}" alt="${post.title}" loading="lazy" style="width:100%;height:180px;object-fit:cover;border-radius:var(--radius) var(--radius) 0 0;"></div>` 
        : '';
    
    return `
        <a href="/post/${post.slug}" class="post-card scroll-reveal" style="display:block;text-decoration:none;color:inherit;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;transition:all .3s var(--ease);position:relative;">
            ${image}
            <div style="padding:20px;">
                <span style="font-size:.7rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.08em;font-family:var(--font-mono);">${post.category || ''}</span>
                <h3 style="font-size:1rem;font-weight:600;margin:8px 0;line-height:1.4;color:var(--text-0);">${post.title}</h3>
                <p style="font-size:.82rem;color:var(--text-2);line-height:1.5;margin-bottom:12px;">${truncate(excerpt, 100)}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:.72rem;color:var(--text-3);font-family:var(--font-mono);">
                    <span>${dateStr}</span>
                    <span>${post.readingTime || '5 min read'}</span>
                </div>
            </div>
        </a>
    `;
}

// ==================== PREV/NEXT POST NAVIGATION ====================
function initPostNavigation(currentSlug) {
    fetch('/api/posts?status=published').then(r => r.json()).then(data => {
        const posts = (data.posts || data).sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
        const idx = posts.findIndex(p => p.slug === currentSlug);
        if (idx === -1) return;

        const prev = idx < posts.length - 1 ? posts[idx + 1] : null;
        const next = idx > 0 ? posts[idx - 1] : null;

        if (!prev && !next) return;

        const navEl = document.getElementById('postNav');
        if (!navEl) {
            const nav = document.createElement('div');
            nav.className = 'post-nav';
            nav.id = 'postNav';
            nav.innerHTML = `
                ${prev ? `<a href="/post/${prev.slug}"><span class="post-nav-label">← Previous</span><span class="post-nav-title">${prev.title}</span></a>` : '<div></div>'}
                ${next ? `<a href="/post/${next.slug}"><span class="post-nav-label">Next →</span><span class="post-nav-title">${next.title}</span></a>` : '<div></div>'}
            `;
            const postBody = document.querySelector('.post-body');
            if (postBody) postBody.appendChild(nav);
        }
    });
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initHeaderScroll();
    initMobileNav();
    initSearch();
    initBackToTop();
    initReadingProgress();
    initCookies();
    initStatCounters();
    initAutoYear();
    initLightbox();
    initExitPopup();
    initFaqAccordion();
    initTabs();
    initServiceWorker();

    // Theme toggle
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Page-specific loading
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') {
        loadHomepage();
        initNewsTicker();
    } else if (path.startsWith('/post/')) {
        loadPostPage();
        initCopyCodeButtons();
        initFloatingShare();
    } else if (path.startsWith('/category/')) {
        loadCategoryPage();
    } else if (path === '/blogs' || path === '/blogs.html') {
        loadBlogsPage();
    } else if (path.startsWith('/tag/')) {
        loadTagPage();
    } else if (path.startsWith('/author/')) {
        loadAuthorPage();
    } else if (path === '/archive' || path === '/archive.html') {
        loadArchivePage();
    } else if (path === '/sitemap-page' || path === '/sitemap-page.html') {
        loadSitemapPage();
    }
});
