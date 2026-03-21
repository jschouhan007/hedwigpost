/* =====================================================
   HedwigPost — Deals Page Client Logic
   Renders products, filters, sorts, injects schema
   ===================================================== */

let allProducts = [];
let allDealCats = [];
let currentCategory = '';
let currentSort = 'featured';

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    // Determine category from URL
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts[0] === 'deals' && pathParts[1]) {
        currentCategory = pathParts[1];
    }

    loadDeals();
    initSort();
});

async function loadDeals() {
    try {
        const [productsRes, catsRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/deal-categories')
        ]);
        allProducts = await productsRes.json();
        allDealCats = await catsRes.json();

        renderCategoryNav();
        renderSidebar();
        renderIntro();
        renderProducts();
        injectSchema();
        initShareButtons();
    } catch (err) {
        console.error('Failed to load deals:', err);
    }
}

// ==================== CATEGORY NAV ====================
function renderCategoryNav() {
    const nav = document.getElementById('dealsCatsNav');
    if (!nav) return;
    let html = `<a href="/deals" class="${!currentCategory ? 'active' : ''}">All Deals</a>`;
    allDealCats.forEach(c => {
        html += `<a href="/deals/${c.slug}" class="${currentCategory === c.slug ? 'active' : ''}">${c.name}</a>`;
    });
    nav.innerHTML = html;
}

// ==================== INTRO SECTION ====================
function renderIntro() {
    const el = document.getElementById('dealsIntro');
    if (!el) return;
    if (currentCategory) {
        const cat = allDealCats.find(c => c.slug === currentCategory);
        if (cat && cat.introHTML) {
            el.innerHTML = cat.introHTML;
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    } else {
        el.innerHTML = '<p>Handpicked deals on the best tech, software, gadgets, and AI tools. Every product is vetted by our editorial team — we only recommend what we\'d use ourselves.</p>';
        el.style.display = 'block';
    }
}

// ==================== RENDER PRODUCTS ====================
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const countEl = document.getElementById('resultCount');
    if (!grid) return;

    let filtered = [...allProducts];
    if (currentCategory) {
        filtered = filtered.filter(p => p.category === currentCategory);
    }

    // Sort
    if (currentSort === 'latest') {
        filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    } else if (currentSort === 'price-low') {
        filtered.sort((a, b) => parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, '')));
    } else if (currentSort === 'price-high') {
        filtered.sort((a, b) => parseFloat(b.price.replace(/[^0-9.]/g, '')) - parseFloat(a.price.replace(/[^0-9.]/g, '')));
    } else if (currentSort === 'rating') {
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
        // Featured first, then latest
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || new Date(b.dateAdded) - new Date(a.dateAdded));
    }

    if (countEl) {
        const catName = currentCategory ? (allDealCats.find(c => c.slug === currentCategory)?.name || currentCategory) : 'All';
        countEl.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''} in ${catName}`;
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="deals-empty" style="grid-column:1/-1">
                <div class="empty-icon">🛒</div>
                <p>No products found in this category yet.<br>Check back soon!</p>
            </div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="product-card">
            ${p.badge ? `<span class="product-badge ${badgeClass(p.badge)}">${p.badge}</span>` : ''}
            <div class="product-card-image">
                ${p.image 
                    ? `<img src="${p.image}" alt="${p.name}" loading="lazy">` 
                    : `<span class="placeholder-icon">${getCatEmoji(p.category)}</span>`}
            </div>
            <div class="product-card-body">
                <h3>${p.name}</h3>
                <p class="product-desc">${p.description}</p>
                ${renderStars(p.rating)}
                <div class="product-price-row">
                    <span class="product-price">${p.price}</span>
                    ${p.originalPrice ? `<span class="product-original-price">${p.originalPrice}</span>` : ''}
                </div>
                <a href="${p.affiliateLink}" class="product-cta" target="_blank" rel="nofollow sponsored noopener">
                    View Deal →
                </a>
            </div>
        </div>
    `).join('');
}

function badgeClass(badge) {
    const map = {
        'Best Pick': 'best-pick',
        'Top Rated': 'top-rated',
        'Trending': 'trending',
        'Limited Offer': 'limited-offer'
    };
    return map[badge] || '';
}

function getCatEmoji(cat) {
    const map = {
        'ai-tools': '🤖',
        'laptops': '💻',
        'software': '📦',
        'gadgets': '📱'
    };
    return map[cat] || '📦';
}

function renderStars(rating) {
    if (!rating) return '';
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    const stars = '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
    return `<div class="product-rating">
        <span class="stars">${stars}</span>
        <span class="rating-num">${rating}/5</span>
    </div>`;
}

// ==================== SIDEBAR ====================
function renderSidebar() {
    const el = document.getElementById('dealCatsSidebar');
    if (!el) return;
    el.innerHTML = allDealCats.map(c => `
        <li><a href="/deals/${c.slug}">
            <span>${c.name}</span>
            <span class="cat-count">${c.productCount || 0}</span>
        </a></li>
    `).join('');
}

// ==================== SORT ====================
function initSort() {
    const select = document.getElementById('sortSelect');
    if (!select) return;
    select.addEventListener('change', () => {
        currentSort = select.value;
        renderProducts();
    });
}

// ==================== SCHEMA.ORG (ItemList + Product) ====================
function injectSchema() {
    let filtered = [...allProducts];
    if (currentCategory) filtered = filtered.filter(p => p.category === currentCategory);

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': currentCategory 
            ? (allDealCats.find(c => c.slug === currentCategory)?.name || 'Deals') + ' — HedwigPost'
            : 'Best Deals & Recommendations — HedwigPost',
        'numberOfItems': filtered.length,
        'itemListElement': filtered.map((p, i) => ({
            '@type': 'ListItem',
            'position': i + 1,
            'item': {
                '@type': 'Product',
                'name': p.name,
                'description': p.description,
                'image': p.image || '',
                'url': p.affiliateLink,
                ...(p.rating ? {
                    'aggregateRating': {
                        '@type': 'AggregateRating',
                        'ratingValue': p.rating,
                        'bestRating': 5,
                        'ratingCount': 1
                    }
                } : {}),
                'offers': {
                    '@type': 'Offer',
                    'price': parseFloat(p.price.replace(/[^0-9.]/g, '')) || 0,
                    'priceCurrency': 'USD',
                    'availability': 'https://schema.org/InStock',
                    'url': p.affiliateLink
                }
            }
        }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
}

// ==================== SHARE BUTTONS ====================
function initShareButtons() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    const twitterBtn = document.getElementById('shareTwitter');
    const fbBtn = document.getElementById('shareFacebook');
    const linkedinBtn = document.getElementById('shareLinkedin');
    const whatsappBtn = document.getElementById('shareWhatsapp');

    if (twitterBtn) twitterBtn.href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
    if (fbBtn) fbBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if (linkedinBtn) linkedinBtn.href = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`;
    if (whatsappBtn) whatsappBtn.href = `https://wa.me/?text=${title}%20${url}`;
}
