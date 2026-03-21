const fs = require('fs');
const path = require('path');
const dir = 'd:/apps/HedwigPost/public/admin';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'products.html' && f !== 'product-editor.html');

for(const file of files) {
    const p = path.join(dir, file);
    let html = fs.readFileSync(p, 'utf8');
    
    // Some files might already have it or might be structured slightly differently
    if (html.includes('Categories</a>') && !html.includes('Affiliate Deals')) {
        let replacement = `Categories</a>
                
                <div class="sidebar-nav-label" style="margin-top:16px;">Affiliate Deals</div>
                <a href="/admin/product-editor.html"><span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg></span> Add Product</a>
                <a href="/admin/products.html"><span class="nav-icon"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"></path></svg></span> All Products</a>
                
                <div class="sidebar-nav-label" style="margin-top:16px;">Engagement</div>`;
        
        let newHtml = html.replace(/Categories<\/a>/, replacement);
        fs.writeFileSync(p, newHtml);
        console.log('Updated ' + file);
    }
}
