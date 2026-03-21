/* =====================================================
   HedwigPost � Admin Shared JavaScript (SaaS Edition)
   ===================================================== */

// ==================== AUTH ====================
// Authenticated fetch - adds Bearer token to all admin API requests
function getToken() {
    return localStorage.getItem('HedwigPost-admin-token') || '';
}

function authFetch(url, options) {
    if (!options) options = {};
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = 'Bearer ' + getToken();
    return fetch(url, options).then(function(res) {
        if (res.status === 401) {
            localStorage.removeItem('HedwigPost-admin-token');
            window.location.href = '/admin/';
            throw new Error('Session expired');
        }
        return res;
    });
}

function checkAuth() {
    if (!localStorage.getItem('HedwigPost-admin-token')) {
        window.location.href = '/admin/';
    }
}

function logout() {
    localStorage.removeItem('HedwigPost-admin-token');
    window.location.href = '/admin/';
}

// ==================== THEME ====================
const savedTheme = localStorage.getItem('HedwigPost-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('HedwigPost-theme', next);
}

// ==================== HELPERS ====================
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function truncate(text, len) {
    return text && text.length > len ? text.substring(0, len) + '...' : text;
}

function slugify(text) {
    return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
}

// ==================== TOAST ====================
function showToast(message, type = 'success') {
    const existing = document.querySelector('.admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.style.background = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity .3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== SVG ICONS ====================
const AdminIcons = {
    dashboard: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
    settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
    barChart: '<svg viewBox="0 0 24 24"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
    trendUp: '<svg viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
    zap: '<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
    key: '<svg viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>',
    users: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    logOut: '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
    plus: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
    trash: '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
    monitor: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
    target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    save: '<svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>',
    send: '<svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
};

function icon(name) {
    return `<span class="nav-icon">${AdminIcons[name] || ''}</span>`;
}

// ==================== MINI CHARTS ====================
function drawSparkline(container, data, color = '#8b5cf6', width = 80, height = 28) {
    if (!container || !data.length) return;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);

    let path = '';
    data.forEach((val, i) => {
        const x = i * step;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        path += (i === 0 ? 'M' : 'L') + `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    container.innerHTML = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="sparkline">
        <path d="${path}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

function drawAreaChart(canvas, data, labels, color = '#8b5cf6') {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.offsetWidth;
    const h = canvas.height = canvas.parentElement.offsetHeight || 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 45 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);
    if (!data.length) return;

    const max = Math.max(...data) * 1.1;
    const min = 0;
    const range = max - min || 1;
    const step = chartW / (data.length - 1);

    // Grid lines
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--a-border').trim() || 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
        // Y labels
        const val = Math.round(max - (max / 4) * i);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--a-text-3').trim() || '#6b7190';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val, padding.left - 8, y + 3);
    }

    // X labels
    ctx.textAlign = 'center';
    const labelStep = Math.ceil(labels.length / 7);
    labels.forEach((label, i) => {
        if (i % labelStep === 0) {
            const x = padding.left + i * step;
            ctx.fillText(label, x, h - 8);
        }
    });

    // Area fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    gradient.addColorStop(0, color + '30');
    gradient.addColorStop(1, color + '00');

    ctx.beginPath();
    data.forEach((val, i) => {
        const x = padding.left + i * step;
        const y = padding.top + chartH - ((val - min) / range) * chartH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(padding.left + (data.length - 1) * step, h - padding.bottom);
    ctx.lineTo(padding.left, h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((val, i) => {
        const x = padding.left + i * step;
        const y = padding.top + chartH - ((val - min) / range) * chartH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots
    data.forEach((val, i) => {
        const x = padding.left + i * step;
        const y = padding.top + chartH - ((val - min) / range) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--a-bg-1').trim() || '#0c0d14';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

function drawDonutChart(canvas, segments, size = 140) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2, cy = size / 2, r = size / 2 - 10;
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    let startAngle = -Math.PI / 2;

    segments.forEach(seg => {
        const angle = (seg.value / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, startAngle + angle);
        ctx.arc(cx, cy, r * 0.6, startAngle + angle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();
        startAngle += angle;
    });
}

function drawBarChart(canvas, data, labels, color = '#8b5cf6') {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.offsetWidth;
    const h = canvas.height = canvas.parentElement.offsetHeight || 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 45 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);
    if (!data.length) return;

    const max = Math.max(...data) * 1.1;
    const barW = (chartW / data.length) * 0.6;
    const gap = (chartW / data.length) * 0.4;

    data.forEach((val, i) => {
        const barH = (val / max) * chartH;
        const x = padding.left + i * (barW + gap) + gap / 2;
        const y = padding.top + chartH - barH;

        const gradient = ctx.createLinearGradient(x, y, x, y + barH);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '60');

        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Label
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--a-text-3').trim() || '#6b7190';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i] || '', x + barW / 2, h - 8);
    });
}

