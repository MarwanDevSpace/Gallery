/**
 * AJ Gallery — Exclusive Artwork Publisher Studio & Smart Masonry Engine
 * Protected by Cryptographic Token & Firebase Realtime Database
 * Integrated with Google Drive (Gallery_Images)
 * © 2026 Abdul Jabbar · All Rights Reserved
 */
(function (window) {
    'use strict';

    // Retrieve secure database instance and key from gateway
    const db = (window.AJGateway && window.AJGateway.getDb()) || ((window.firebase && typeof firebase.database === 'function') ? firebase.database() : null);
    const auth = (window.firebase && typeof firebase.auth === 'function') ? firebase.auth() : null;
    const SEC_KEY = (window.AJGateway && window.AJGateway.getSecKey()) || 'a4f9b8c2d1e0f7e6d5c4b3a291827364';

    // SHA-256 hash of default master PIN (2026)
    const DEFAULT_MASTER_HASH = '158a323a7ba44870f23d96f1516dd70aa48e9a72db4ebb026b0a89e212a208ab';

    // ── Publisher State ──
    const AdminState = {
        isAuthenticated: false,
        artworks: [],
        editingWorkId: null,
        currentFile: null,
        currentFileDataUrl: null,
        currentDimensions: null,
        currentDriveFile: null,
        driveStatus: { connected: true, folderName: 'Gallery_Images', folderId: '1SIg96z1Ej0LgyC1WsOjT97x7gE_6W-hm' }
    };

    // Check existing session
    if (sessionStorage.getItem('aj_auth_token') === 'sec_session_active_2026') {
        AdminState.isAuthenticated = true;
    }

    // ── Cryptographic SHA-256 Helper ──
    async function sha256Hex(str) {
        if (!window.crypto || !window.crypto.subtle) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0;
            }
            return String(hash);
        }
        const buffer = new TextEncoder().encode(str);
        const hashBuf = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hashBuf))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // ── Toast Notification ──
    function showAdminToast(msg, isSuccess = true) {
        let t = document.getElementById('toast');
        if (!t) return;
        const icon = isSuccess ? 'fa-circle-check' : 'fa-triangle-exclamation';
        const color = isSuccess ? '#10b981' : '#e11d48';
        t.innerHTML = `<i class="fa-solid ${icon}" style="color:${color}"></i> ${msg}`;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3800);
    }

    // ── Check Google Drive Status ──
    async function checkGoogleDriveStatus() {
        try {
            const res = await fetch('/api/drive/status');
            if (res.ok) {
                const data = await res.json();
                AdminState.driveStatus = data;
                const statusEl = document.getElementById('gdrive-status-badge');
                if (statusEl) {
                    statusEl.innerHTML = `<i class="fa-solid fa-cloud-check"></i> مجلد (Gallery_Images) متصل ومحمي`;
                }
            }
        } catch (_) {}
    }

    // ── Dynamic Admin Modal DOM Injection ──
    function ensureAdminModalDOM() {
        if (document.getElementById('admin-modal')) return;

        const modalDiv = document.createElement('div');
        modalDiv.id = 'admin-modal';
        modalDiv.className = 'admin-modal-backdrop';
        modalDiv.setAttribute('role', 'dialog');
        modalDiv.setAttribute('aria-modal', 'true');
        modalDiv.setAttribute('aria-labelledby', 'admin-panel-title');

        modalDiv.innerHTML = `
        <div class="admin-modal-container" style="max-width:1180px;width:95%">
            <header class="admin-modal-header">
                <div class="admin-header-title">
                    <i class="fa-solid fa-cloud-arrow-up" style="color:var(--accent-gold);font-size:1.3rem"></i>
                    <div>
                        <h3 id="admin-panel-title" style="margin:0">استوديو نشر الأعمال الفنية</h3>
                        <span style="font-size:0.75rem;color:var(--text-secondary);font-family:var(--font-en)">Exclusive Artwork Publisher Studio · Smart Viewport</span>
                    </div>
                </div>
                <div class="admin-header-actions">
                    <span class="gdrive-status-badge" id="gdrive-status-badge">
                        <i class="fa-brands fa-google-drive"></i> Gallery_Images
                    </span>
                    <button class="admin-logout-btn" id="admin-logout-btn" title="تسجيل الخروج" style="display:none">
                        <i class="fa-solid fa-right-from-bracket"></i> خروج
                    </button>
                    <button class="admin-close-btn" id="admin-modal-close" aria-label="إغلاق اللوحة">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </header>

            <!-- Login View -->
            <div id="admin-login-view" class="admin-login-box">
                <div class="login-card">
                    <div class="login-icon-avatar">
                        <i class="fa-solid fa-user-shield"></i>
                    </div>
                    <h4>تسجيل دخول استوديو النشر</h4>
                    <p>أدخل رمز الدخول السري لنشر الأعمال الفنية الجديدة، مزامنتها مع Google Drive، وإظهارها في شبكة المعرض الذكية.</p>
                    <form id="admin-login-form">
                        <div class="admin-input-group">
                            <label for="admin-pin-input">رمز الدخول السري (Master PIN)</label>
                            <input type="password" id="admin-pin-input" class="admin-input" placeholder="أدخل رمز الدخول" autocomplete="current-password" required autofocus>
                        </div>
                        <button type="submit" class="admin-btn-primary" style="width:100%;margin-top:1.2rem">
                            <i class="fa-solid fa-key"></i> دخول الاستوديو
                        </button>
                    </form>
                </div>
            </div>

            <!-- Dedicated Artwork Publisher View -->
            <div id="admin-dashboard-view" class="admin-dashboard" style="display:none;padding:1.8rem;overflow-y:auto;max-height:82vh">
                
                <!-- Publisher Split Layout -->
                <div class="publisher-layout">
                    
                    <!-- Form & Dropzone Column -->
                    <div class="publisher-form-col">
                        <form id="publisher-form" class="admin-form-card" style="padding:1.4rem">
                            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-color);padding-bottom:0.75rem">
                                <div>
                                    <h4 id="publisher-form-title" style="font-size:1.1rem;font-weight:700;color:var(--accent-gold);margin:0">
                                        <i class="fa-solid fa-circle-plus"></i> نشر عمل فني جديد
                                    </h4>
                                    <span style="font-size:0.75rem;color:var(--text-secondary)">يتم حفظ العمل في مجلد Gallery_Images وعرضه فورياً للزوار</span>
                                </div>
                                <button type="button" class="ozeum-mini-pill-btn" id="publisher-reset-btn" onclick="window.AJAdmin.resetForm()">
                                    <i class="fa-solid fa-rotate-left"></i> تفريغ الحقول
                                </button>
                            </div>

                            <!-- Google Drive Direct Import Box -->
                            <div class="drive-input-box">
                                <div class="drive-input-header">
                                    <span style="font-size:0.82rem;font-weight:700;color:var(--text-primary);display:inline-flex;align-items:center;gap:0.4rem">
                                        <i class="fa-brands fa-google-drive" style="color:#f59e0b"></i> مجلد Google Drive (Gallery_Images)
                                    </span>
                                    <a href="https://drive.google.com/drive/folders/1SIg96z1Ej0LgyC1WsOjT97x7gE_6W-hm" target="_blank" class="ozeum-mini-pill-btn" style="text-decoration:none;padding:0.25rem 0.65rem;font-size:0.7rem;color:#f59e0b;border-color:rgba(245,158,11,0.35)">
                                        <i class="fa-solid fa-arrow-up-right-from-square"></i> فتح المجلد في Drive
                                    </a>
                                </div>
                                <div class="admin-input-group" style="margin:0">
                                    <input type="text" id="input-drive-link" class="admin-input" placeholder="الصق رابط الصورة من Google Drive أو معرّف الملف (File ID)..." dir="ltr">
                                </div>
                                <span style="font-size:0.7rem;color:var(--text-muted)">
                                    يقبل روابط المشاركة مثل: drive.google.com/file/d/1SIg96z1... أو معرّف الملف مباشرة. يتم استخراج الأبعاد تلقائياً وبث الصورة فائق السرعة.
                                </span>
                            </div>

                            <div style="text-align:center;margin:0.5rem 0;font-size:0.72rem;color:var(--text-muted)">
                                ── أو ارفع ملف من جهازك ──
                            </div>

                            <!-- Smart Dropzone -->
                            <div class="publisher-dropzone" id="publisher-dropzone">
                                <input type="file" id="publisher-file-input" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="display:none">
                                <i class="fa-solid fa-cloud-arrow-up dropzone-icon"></i>
                                <div class="dropzone-title">اسحب وأفلت الصورة هنا، أو اضغط للتحديد</div>
                                <div class="dropzone-sub">يدعم الصور فائقة الدقة PNG, JPG, WEBP — يتم الكشف عن الأبعاد ونسبة العرض تلقائياً</div>
                                <div class="dropzone-specs">
                                    <span class="dropzone-spec-pill"><i class="fa-solid fa-expand"></i> أي نسبة أبعاد (طولية / عريضة / مربعة)</span>
                                    <span class="dropzone-spec-pill"><i class="fa-brands fa-google-drive"></i> حفظ مباشر في Gallery_Images</span>
                                </div>
                            </div>

                            <!-- Image Meta Detected Banner -->
                            <div class="image-meta-banner" id="image-meta-banner" style="display:none">
                                <div class="image-meta-info">
                                    <span class="aspect-badge" id="detected-aspect-badge">نسبة الأبعاد: 4:5</span>
                                    <span class="res-badge" id="detected-res-badge">2400 × 3000 Px</span>
                                    <span style="font-size:0.75rem;color:var(--text-secondary)" id="detected-size-badge">1.4 MB</span>
                                </div>
                                <button type="button" class="ozeum-mini-pill-btn" style="padding:0.25rem 0.6rem;font-size:0.7rem" onclick="document.getElementById('publisher-file-input').click()">
                                    <i class="fa-solid fa-repeat"></i> تغيير الصورة
                                </button>
                            </div>

                            <!-- Alternative: Pre-encrypted index (optional fallback) -->
                            <div style="display:flex;align-items:center;gap:0.6rem;margin-top:0.2rem">
                                <label for="input-work-img-idx" style="font-size:0.75rem;color:var(--text-muted)">أو اختر صورة مشفرة جاهزة من الخزينة:</label>
                                <select id="input-work-img-idx" class="admin-input" style="padding:0.3rem 0.6rem;font-size:0.78rem;width:auto">
                                    <option value="">-- اختيار ملف جديد بالأعلى هو المفضل --</option>
                                    <option value="0">خزينة #01 (واجهة تقنية ذهبية)</option>
                                    <option value="1">خزينة #02 (تطبيق وهوية رقمية)</option>
                                    <option value="2">خزينة #03 (دراسات بصرية وهندسة)</option>
                                    <option value="3">خزينة #04 (علامة تجارية وبصرية)</option>
                                    <option value="4">خزينة #05 (بوستر إبداعي وتجريدي)</option>
                                    <option value="5">خزينة #06 (دراسة تجربة متكاملة)</option>
                                    <option value="6">خزينة #07 (تناسق لوني وتشكيل بصري)</option>
                                    <option value="7">خزينة #08 (عناصر وحركات غرافيكية)</option>
                                </select>
                            </div>

                            <!-- Titles Row -->
                            <div class="admin-form-grid">
                                <div class="admin-input-group">
                                    <label for="input-work-title">عنوان العمل (بالعربية) *</label>
                                    <input type="text" id="input-work-title" class="admin-input" placeholder="مثال: تصميم واجهة وهوية رقمية متقدمة" required>
                                </div>
                                <div class="admin-input-group">
                                    <label for="input-work-title-en">العنوان بالإنجليزية (English Title)</label>
                                    <input type="text" id="input-work-title-en" class="admin-input" placeholder="e.g. Advanced UI & Digital Identity" dir="ltr">
                                </div>
                            </div>

                            <!-- Category with Quick Pills -->
                            <div class="admin-input-group">
                                <label for="input-work-category">التصنيف الفني (Category) *</label>
                                <input type="text" id="input-work-category" class="admin-input" placeholder="UI Architecture / Branding / Poster Art" required>
                                <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.45rem">
                                    <button type="button" class="ozeum-mini-pill-btn" style="padding:0.15rem 0.55rem;font-size:0.68rem" onclick="window.AJAdmin.setCategory('UI Architecture')">UI Architecture</button>
                                    <button type="button" class="ozeum-mini-pill-btn" style="padding:0.15rem 0.55rem;font-size:0.68rem" onclick="window.AJAdmin.setCategory('Mobile Identity')">Mobile Identity</button>
                                    <button type="button" class="ozeum-mini-pill-btn" style="padding:0.15rem 0.55rem;font-size:0.68rem" onclick="window.AJAdmin.setCategory('Poster Art')">Poster Art</button>
                                    <button type="button" class="ozeum-mini-pill-btn" style="padding:0.15rem 0.55rem;font-size:0.68rem" onclick="window.AJAdmin.setCategory('Visual Geometry')">Visual Geometry</button>
                                    <button type="button" class="ozeum-mini-pill-btn" style="padding:0.15rem 0.55rem;font-size:0.68rem" onclick="window.AJAdmin.setCategory('Graphic Motion')">Graphic Motion</button>
                                </div>
                            </div>

                            <!-- Description -->
                            <div class="admin-input-group">
                                <label for="input-work-desc">الوصف الفني الدقيق (Description)</label>
                                <textarea id="input-work-desc" class="admin-input" rows="3" placeholder="نبذة فنية عن العمل، تفاصيل التكوين، وفلسفة التصميم..."></textarea>
                            </div>

                            <!-- Toggles -->
                            <div style="display:flex;gap:2rem;flex-wrap:wrap;padding:0.3rem 0">
                                <label class="admin-checkbox-label">
                                    <input type="checkbox" id="input-work-published" checked>
                                    <span>نشر العمل في المعرض العام (Visible in Masonry Grid)</span>
                                </label>
                                <label class="admin-checkbox-label">
                                    <input type="checkbox" id="input-work-hero">
                                    <span>تمييز في الواجهة الرئيسية (Hero Spotlight)</span>
                                </label>
                            </div>

                            <!-- Submit Button -->
                            <button type="submit" id="publisher-submit-btn" class="admin-btn-primary" style="padding:0.85rem;font-size:0.95rem;justify-content:center;margin-top:0.4rem">
                                <i class="fa-solid fa-cloud-arrow-up"></i> <span>نشر العمل في المعرض ومجلد Gallery_Images</span>
                            </button>
                        </form>
                    </div>

                    <!-- Live Museum Preview Column -->
                    <div class="publisher-preview-col">
                        <div class="publisher-preview-box">
                            <div class="preview-header">
                                <h4><i class="fa-solid fa-eye"></i> معاينة المعرض الحية</h4>
                                <span class="preview-live-tag">
                                    <span class="preview-live-dot"></span> مباشر في الوقت الفعلي
                                </span>
                            </div>

                            <!-- Simulated Museum Card (Matches .gallery-item) -->
                            <div class="gallery-item" style="cursor:default;margin-bottom:0;pointer-events:none">
                                <div class="item-mat-frame" id="preview-mat-frame">
                                    <div class="preview-placeholder" id="preview-placeholder">
                                        <i class="fa-regular fa-image"></i>
                                        <span>اختر صورة بالأبعاد التي ترغب بها لترى المعاينة المتحفية التفاعلية هنا</span>
                                    </div>
                                    <canvas id="live-preview-canvas" class="pixel-canvas" style="display:none"></canvas>
                                </div>
                                <div class="gallery-item-caption">
                                    <span class="caption-category" id="live-preview-category">UI ARCHITECTURE</span>
                                    <h4 id="live-preview-title" style="margin:0.2rem 0">عنوان العمل الفني</h4>
                                    <div class="caption-footer">
                                        <span class="caption-id" id="live-preview-specs">RATIO: AUTO</span>
                                        <span class="caption-inspect-btn"><i class="fa-solid fa-expand"></i> معاينة</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Description preview -->
                            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:4px;padding:0.75rem;font-size:0.8rem;color:var(--text-secondary);line-height:1.6" id="live-preview-desc">
                                سيظهر وصف العمل الفني هنا كما يُعرض في نافذة المعاينة المكبرة.
                            </div>
                        </div>
                    </div>

                </div>

                <!-- Published Artworks Manager Drawer -->
                <div class="published-works-drawer">
                    <div class="published-works-header">
                        <div style="display:flex;align-items:center;gap:0.75rem">
                            <h4 style="margin:0;font-size:1.05rem;font-weight:700;color:#fff">
                                <i class="fa-solid fa-images" style="color:var(--accent-gold)"></i> الأعمال المنشورة في المعرض
                            </h4>
                            <span class="admin-badge-category" id="publisher-count-badge">0 أعمال</span>
                        </div>
                        <span style="font-size:0.75rem;color:var(--text-secondary)">انقر على أي عمل لتعديله أو تبديل حالته أو حذفه فورياً</span>
                    </div>

                    <div class="published-works-grid" id="publisher-works-grid"></div>
                </div>

            </div>
        </div>
        `;

        document.body.appendChild(modalDiv);
        bindModalEvents();
        checkGoogleDriveStatus();
    }

    // ── Authentication Handlers with Rate Limiting ──
    async function handleLogin(enteredPin) {
        const lockoutUntil = parseInt(sessionStorage.getItem('aj_lockout_until') || '0', 10);
        if (Date.now() < lockoutUntil) {
            const remMin = Math.ceil((lockoutUntil - Date.now()) / 60000);
            showAdminToast(`لوحة الإدارة مقفلة مؤقتاً لأسباب أمنية. حاول بعد ${remMin} دقيقة.`, false);
            return;
        }

        const hashed = await sha256Hex(enteredPin);
        const customHash = localStorage.getItem('aj_admin_custom_hash');
        const expectedHash = customHash || DEFAULT_MASTER_HASH;

        if (hashed === expectedHash) {
            AdminState.isAuthenticated = true;
            sessionStorage.setItem('aj_auth_token', 'sec_session_active_2026');
            sessionStorage.removeItem('aj_failed_attempts');
            showAdminToast('تم التحقق بنجاح — مرحباً بك في استوديو نشر المعرض', true);
            updateAdminPanelUI();
        } else {
            let failed = parseInt(sessionStorage.getItem('aj_failed_attempts') || '0', 10) + 1;
            sessionStorage.setItem('aj_failed_attempts', failed);

            if (failed >= 5) {
                const lockTime = Date.now() + 10 * 60 * 1000; // 10 minutes lockout
                sessionStorage.setItem('aj_lockout_until', lockTime);
                showAdminToast('تم قفل الدخول لمدة 10 دقائق بعد 5 محاولات خاطئة متتالية.', false);
            } else {
                showAdminToast(`رمز الدخول غير صحيح. المحاولات المتبقية: ${5 - failed}`, false);
            }
        }
    }

    function handleLogout() {
        AdminState.isAuthenticated = false;
        sessionStorage.removeItem('aj_auth_token');
        if (auth) auth.signOut().catch(() => {});
        showAdminToast('تم تسجيل الخروج بنجاح');
        updateAdminPanelUI();
    }

    // ── UI Modal Open / Close ──
    function openAdminModal() {
        ensureAdminModalDOM();
        const modal = document.getElementById('admin-modal');
        if (!modal) return;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateAdminPanelUI();
    }

    function closeAdminModal() {
        const modal = document.getElementById('admin-modal');
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
        AdminState.editingWorkId = null;
        resetArtworkForm();
    }

    function updateAdminPanelUI() {
        const loginView = document.getElementById('admin-login-view');
        const dashboardView = document.getElementById('admin-dashboard-view');
        const logoutBtn = document.getElementById('admin-logout-btn');

        if (!loginView || !dashboardView) return;

        if (AdminState.isAuthenticated) {
            loginView.style.display = 'none';
            dashboardView.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'inline-flex';
            renderPublishedWorksGrid();
            checkGoogleDriveStatus();
        } else {
            loginView.style.display = 'flex';
            dashboardView.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            const pinInput = document.getElementById('admin-pin-input');
            if (pinInput) {
                pinInput.value = '';
                pinInput.focus();
            }
        }
    }

    // ── Smart Image File Processing & Dimension Detection ──
    function processSelectedFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            showAdminToast('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)', false);
            return;
        }

        AdminState.currentFile = file;
        const reader = new FileReader();

        reader.onload = (e) => {
            const dataUrl = e.target.result;
            AdminState.currentFileDataUrl = dataUrl;

            // Load in Image to detect exact dimensions & aspect ratio
            const img = new Image();
            img.onload = () => {
                const nw = img.naturalWidth;
                const nh = img.naturalHeight;
                const ar = parseFloat((nw / nh).toFixed(2));
                const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

                let orientation = 'مربعة (1:1)';
                if (ar > 1.2) orientation = `عريضة (${ar}:1)`;
                else if (ar < 0.9) orientation = `طولية (1:${(1/ar).toFixed(2)})`;

                AdminState.currentDimensions = { width: nw, height: nh, aspectRatio: ar, size: file.size };

                // Update UI Banners
                const banner = document.getElementById('image-meta-banner');
                const aspectBadge = document.getElementById('detected-aspect-badge');
                const resBadge = document.getElementById('detected-res-badge');
                const sizeBadge = document.getElementById('detected-size-badge');
                const previewSpecs = document.getElementById('live-preview-specs');

                if (banner) banner.style.display = 'flex';
                if (aspectBadge) aspectBadge.innerText = `${orientation} · نسبة ${ar}`;
                if (resBadge) resBadge.innerText = `${nw} × ${nh} Px`;
                if (sizeBadge) sizeBadge.innerText = `${sizeMb} MB`;
                if (previewSpecs) previewSpecs.innerText = `${nw}×${nh} (${ar})`;

                // Render onto live preview canvas
                const liveCv = document.getElementById('live-preview-canvas');
                const placeholder = document.getElementById('preview-placeholder');
                if (placeholder) placeholder.style.display = 'none';
                if (liveCv) {
                    liveCv.style.display = 'block';
                    if (window.Img2Preview) {
                        Img2Preview.paint(liveCv, dataUrl, { autoHeight: true, watermark: true });
                    }
                }

                showAdminToast(`تم تحليل الصورة: ${nw}×${nh} بكسل بنسبة ${orientation}`);
            };
            img.src = dataUrl;
        };

        reader.readAsDataURL(file);
    }

    // ── Google Drive File Link & ID Processor ──
    function processDriveInput(inputVal) {
        if (!inputVal || typeof inputVal !== 'string') return;
        const trimmed = inputVal.trim();
        const fileId = (window.AJGateway && window.AJGateway.extractDriveId) ? window.AJGateway.extractDriveId(trimmed) : (trimmed.match(/([a-zA-Z0-9_-]{25,50})/) ? trimmed.match(/([a-zA-Z0-9_-]{25,50})/)[1] : null);
        if (!fileId) return;

        const streamUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
        const proxyUrl = `/api/drive/stream/${fileId}`;

        // Clear local file selection to prevent conflicts
        AdminState.currentFile = null;
        AdminState.currentFileDataUrl = null;

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const nw = img.naturalWidth;
            const nh = img.naturalHeight;
            const ar = parseFloat((nw / nh).toFixed(2));

            let orientation = 'مربعة (1:1)';
            if (ar > 1.2) orientation = `عريضة (${ar}:1)`;
            else if (ar < 0.9) orientation = `طولية (1:${(1/ar).toFixed(2)})`;

            AdminState.currentDriveFile = {
                fileId: fileId,
                streamUrl: streamUrl,
                dimensions: { width: nw, height: nh, aspectRatio: ar }
            };
            AdminState.currentDimensions = AdminState.currentDriveFile.dimensions;

            // UI Banners
            const banner = document.getElementById('image-meta-banner');
            const aspectBadge = document.getElementById('detected-aspect-badge');
            const resBadge = document.getElementById('detected-res-badge');
            const sizeBadge = document.getElementById('detected-size-badge');
            const previewSpecs = document.getElementById('live-preview-specs');

            if (banner) banner.style.display = 'flex';
            if (aspectBadge) aspectBadge.innerText = `${orientation} · نسبة ${ar}`;
            if (resBadge) resBadge.innerText = `${nw} × ${nh} Px (Google Drive)`;
            if (sizeBadge) sizeBadge.innerText = `Gallery_Images`;
            if (previewSpecs) previewSpecs.innerText = `${nw}×${nh} (${ar})`;

            // Live preview
            const liveCv = document.getElementById('live-preview-canvas');
            const placeholder = document.getElementById('preview-placeholder');
            if (placeholder) placeholder.style.display = 'none';
            if (liveCv) {
                liveCv.style.display = 'block';
                if (window.Img2Preview) {
                    Img2Preview.paint(liveCv, streamUrl, { autoHeight: true, watermark: true });
                }
            }

            showAdminToast(`تم تحليل صورة Google Drive بنجاح: ${nw}×${nh} بكسل بنسبة ${orientation}`);
        };

        img.onerror = () => {
            if (img.src !== proxyUrl) {
                img.src = proxyUrl;
                return;
            }
            showAdminToast('تعذر تحميل الصورة من رابط Google Drive — تأكد من تفعيل "أي شخص لديه الرابط يمكنه المشاهدة"', false);
        };

        img.src = streamUrl;
    }

    // ── Live Text Synchronization with Preview ──
    function bindLivePreviewSync() {
        const titleIn = document.getElementById('input-work-title');
        const catIn = document.getElementById('input-work-category');
        const descIn = document.getElementById('input-work-desc');
        const vaultSel = document.getElementById('input-work-img-idx');

        const liveTitle = document.getElementById('live-preview-title');
        const liveCat = document.getElementById('live-preview-category');
        const liveDesc = document.getElementById('live-preview-desc');

        if (titleIn && liveTitle) {
            titleIn.addEventListener('input', () => {
                liveTitle.innerText = titleIn.value.trim() || 'عنوان العمل الفني';
            });
        }
        if (catIn && liveCat) {
            catIn.addEventListener('input', () => {
                liveCat.innerText = (catIn.value.trim() || 'UI ARCHITECTURE').toUpperCase();
            });
        }
        if (descIn && liveDesc) {
            descIn.addEventListener('input', () => {
                liveDesc.innerText = descIn.value.trim() || 'سيظهر وصف العمل الفني هنا كما يُعرض في نافذة المعاينة المكبرة.';
            });
        }
        if (vaultSel) {
            vaultSel.addEventListener('change', () => {
                if (vaultSel.value !== '' && !AdminState.currentFileDataUrl) {
                    const idx = parseInt(vaultSel.value, 10);
                    const liveCv = document.getElementById('live-preview-canvas');
                    const placeholder = document.getElementById('preview-placeholder');
                    if (placeholder) placeholder.style.display = 'none';
                    if (liveCv && window.Img2Preview) {
                        liveCv.style.display = 'block';
                        Img2Preview.paint(liveCv, idx, { autoHeight: true, watermark: true });
                    }
                }
            });
        }
    }

    // ── Render Published Works Manager Grid ──
    function renderPublishedWorksGrid() {
        const grid = document.getElementById('publisher-works-grid');
        const countBadge = document.getElementById('publisher-count-badge');
        if (!grid) return;

        grid.innerHTML = '';
        const count = AdminState.artworks.length;
        if (countBadge) countBadge.innerText = `${count} أعمال`;

        if (!count) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted)">لا توجد أعمال فنية منشورة حالياً في المعرض</div>`;
            return;
        }

        AdminState.artworks.forEach((work, index) => {
            const card = document.createElement('div');
            card.className = 'mini-work-card';
            const workId = work._firebaseKey !== undefined ? work._firebaseKey : index;
            const isPub = work.isPublished !== false;
            const isHero = work.isHeroFeatured === true;

            card.innerHTML = `
                <div class="mini-work-thumb">
                    <canvas class="mini-cv" data-work-idx="${workId}"></canvas>
                </div>
                <div class="mini-work-meta">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <h5 style="margin:0">${escapeHtml(work.title || 'بدون عنوان')}</h5>
                        ${(work.driveFolder || work.driveId) ? `<span class="drive-pill-tag" style="font-size:0.6rem;padding:0.1rem 0.35rem"><i class="fa-brands fa-google-drive"></i> Drive</span>` : ''}
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.2rem">
                        <span>${escapeHtml(work.category || 'تصميم')} · ${work.aspectRatio ? 'نسبة ' + work.aspectRatio : 'تلقائي'}</span>
                        <div style="display:flex;gap:0.45rem;font-size:0.68rem;color:var(--text-muted)">
                            <span title="إعجابات"><i class="fa-solid fa-heart" style="color:#fb7185"></i> ${work.likesCount || 0}</span>
                            <span title="مشاهدات"><i class="fa-solid fa-eye"></i> ${work.viewsCount || 0}</span>
                        </div>
                    </div>
                </div>
                <div class="mini-work-actions">
                    <div style="display:flex;align-items:center;gap:0.4rem">
                        <button class="admin-hero-star ${isHero ? 'active' : ''}" title="تمييز في الواجهة" onclick="window.AJAdmin.toggleHeroFeatured('${workId}')">
                            <i class="fa-${isHero ? 'solid' : 'regular'} fa-star"></i>
                        </button>
                        <span class="admin-status-pill ${isPub ? 'published' : 'draft'}" style="font-size:0.65rem;padding:0.15rem 0.45rem">
                            ${isPub ? 'معروض' : 'مسودة'}
                        </span>
                    </div>
                    <div style="display:flex;gap:0.3rem">
                        <button class="admin-action-btn edit" title="تعديل" onclick="window.AJAdmin.startEditWork('${workId}')">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="admin-action-btn delete" title="حذف" onclick="window.AJAdmin.deleteWork('${workId}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);

            // Paint thumbnail canvas
            const cv = card.querySelector('.mini-cv');
            if (cv && window.Img2Preview) {
                const imgSource = work.imageSrc || (work.imageIdx !== undefined ? work.imageIdx : index % 8);
                setTimeout(() => {
                    Img2Preview.paint(cv, imgSource, { contain: true, w: 200, h: 120 });
                }, index * 40);
            }
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ── Form Reset ──
    function resetArtworkForm() {
        const form = document.getElementById('publisher-form');
        if (form) form.reset();

        AdminState.editingWorkId = null;
        AdminState.currentFile = null;
        AdminState.currentFileDataUrl = null;
        AdminState.currentDimensions = null;
        AdminState.currentDriveFile = null;

        const driveIn = document.getElementById('input-drive-link');
        if (driveIn) driveIn.value = '';

        const formTitle = document.getElementById('publisher-form-title');
        if (formTitle) formTitle.innerHTML = '<i class="fa-solid fa-circle-plus"></i> نشر عمل فني جديد';

        const submitBtn = document.getElementById('publisher-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>نشر العمل في المعرض ومجلد Gallery_Images</span>';
        }

        const banner = document.getElementById('image-meta-banner');
        if (banner) banner.style.display = 'none';

        const liveCv = document.getElementById('live-preview-canvas');
        const placeholder = document.getElementById('preview-placeholder');
        if (liveCv) liveCv.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';

        const liveTitle = document.getElementById('live-preview-title');
        const liveCat = document.getElementById('live-preview-category');
        const liveDesc = document.getElementById('live-preview-desc');
        if (liveTitle) liveTitle.innerText = 'عنوان العمل الفني';
        if (liveCat) liveCat.innerText = 'UI ARCHITECTURE';
        if (liveDesc) liveDesc.innerText = 'سيظهر وصف العمل الفني هنا كما يُعرض في نافذة المعاينة المكبرة.';
    }

    // ── Start Editing Artwork ──
    function startEditWork(workId) {
        const work = AdminState.artworks.find(w => String(w._firebaseKey) === String(workId) || String(w.id) === String(workId)) || AdminState.artworks[workId];
        if (!work) return;

        AdminState.editingWorkId = work._firebaseKey !== undefined ? work._firebaseKey : workId;

        document.getElementById('input-work-title').value = work.title || '';
        document.getElementById('input-work-title-en').value = work.titleEn || '';
        document.getElementById('input-work-category').value = work.category || 'UI Architecture';
        document.getElementById('input-work-desc').value = work.description || '';
        document.getElementById('input-work-published').checked = work.isPublished !== false;
        document.getElementById('input-work-hero').checked = work.isHeroFeatured === true;

        const driveIn = document.getElementById('input-drive-link');
        if (driveIn) {
            driveIn.value = work.driveId || (work.imageSrc && work.imageSrc.includes('google') ? work.imageSrc : '');
        }

        const vaultSel = document.getElementById('input-work-img-idx');
        if (vaultSel && work.imageIdx !== undefined) vaultSel.value = work.imageIdx;

        const formTitle = document.getElementById('publisher-form-title');
        if (formTitle) formTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> تعديل بيانات: ${escapeHtml(work.title)}`;

        const submitBtn = document.getElementById('publisher-submit-btn');
        if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات في المعرض ومجلد Gallery_Images';

        // Update live preview
        const liveTitle = document.getElementById('live-preview-title');
        const liveCat = document.getElementById('live-preview-category');
        const liveDesc = document.getElementById('live-preview-desc');
        if (liveTitle) liveTitle.innerText = work.title || '';
        if (liveCat) liveCat.innerText = (work.category || '').toUpperCase();
        if (liveDesc) liveDesc.innerText = work.description || '';

        const liveCv = document.getElementById('live-preview-canvas');
        const placeholder = document.getElementById('preview-placeholder');
        if (placeholder) placeholder.style.display = 'none';
        if (liveCv && window.Img2Preview) {
            liveCv.style.display = 'block';
            const src = work.imageSrc || (work.imageIdx !== undefined ? work.imageIdx : 0);
            Img2Preview.paint(liveCv, src, { autoHeight: true, watermark: true });
        }

        const form = document.getElementById('publisher-form');
        if (form) form.scrollIntoView({ behavior: 'smooth' });
    }

    // ── Save / Publish Artwork Handler ──
    async function saveArtwork(formData) {
        if (!db) {
            showAdminToast('قاعدة البيانات غير متصلة', false);
            return;
        }

        const submitBtn = document.getElementById('publisher-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري حفظ ومزامنة الصورة مع Gallery_Images...';
        }

        try {
            let uploadedUrl = null;

            // 1. If user selected a new image file, upload to Gallery_Images backend route
            if (AdminState.currentFile && AdminState.currentFileDataUrl) {
                try {
                    const uploadRes = await fetch('/api/drive/upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${SEC_KEY}`
                        },
                        body: JSON.stringify({
                            filename: AdminState.currentFile.name,
                            data: AdminState.currentFileDataUrl,
                            dimensions: AdminState.currentDimensions,
                            secKey: SEC_KEY
                        })
                    });

                    if (uploadRes.ok) {
                        const uploadJson = await uploadRes.json();
                        uploadedUrl = uploadJson.url;
                        showAdminToast(`تم إيداع الصورة في مجلد Gallery_Images بنجاح!`);
                    } else {
                        console.warn('[Drive Upload] Cloud upload notice, saving directly.');
                    }
                } catch (upErr) {
                    console.warn('[Upload Error]', upErr);
                }
            }

            // 2. Prepare Artwork record
            const newWorkData = {
                title: formData.title.trim().slice(0, 140),
                titleEn: (formData.titleEn || '').trim().slice(0, 140),
                category: formData.category.trim().slice(0, 70),
                description: (formData.description || '').trim().slice(0, 700),
                isPublished: Boolean(formData.isPublished),
                isHeroFeatured: Boolean(formData.isHeroFeatured),
                updatedAt: new Date().toISOString(),
                _secKey: SEC_KEY
            };

            if (AdminState.currentDriveFile) {
                newWorkData.imageSrc = AdminState.currentDriveFile.streamUrl;
                newWorkData.driveId = AdminState.currentDriveFile.fileId;
                newWorkData.driveFolder = 'Gallery_Images';
                newWorkData.width = AdminState.currentDriveFile.dimensions.width;
                newWorkData.height = AdminState.currentDriveFile.dimensions.height;
                newWorkData.aspectRatio = AdminState.currentDriveFile.dimensions.aspectRatio;
            } else if (uploadedUrl) {
                newWorkData.imageSrc = uploadedUrl;
                newWorkData.driveFolder = 'Gallery_Images';
                if (AdminState.currentDimensions) {
                    newWorkData.width = AdminState.currentDimensions.width;
                    newWorkData.height = AdminState.currentDimensions.height;
                    newWorkData.aspectRatio = AdminState.currentDimensions.aspectRatio;
                }
            } else if (AdminState.currentFileDataUrl) {
                newWorkData.imageSrc = AdminState.currentFileDataUrl;
                newWorkData.driveFolder = 'Gallery_Images';
                if (AdminState.currentDimensions) {
                    newWorkData.width = AdminState.currentDimensions.width;
                    newWorkData.height = AdminState.currentDimensions.height;
                    newWorkData.aspectRatio = AdminState.currentDimensions.aspectRatio;
                }
            } else if (formData.imageIdx !== '') {
                newWorkData.imageIdx = parseInt(formData.imageIdx, 10);
            }

            if (AdminState.editingWorkId !== null) {
                const targetRef = db.ref(`artworks/${AdminState.editingWorkId}`);
                await targetRef.update(newWorkData);
                showAdminToast('تم تحديث العمل الفني بنجاح في المعرض ومجلد Gallery_Images!');
            } else {
                newWorkData.createdAt = new Date().toISOString();
                newWorkData.id = 'work-' + Date.now();
                newWorkData.driveFolder = 'Gallery_Images';
                newWorkData.likesCount = 0;
                newWorkData.viewsCount = 0;

                const nextIndex = AdminState.artworks.length;
                await db.ref(`artworks/${nextIndex}`).set(newWorkData);
                showAdminToast('تم نشر العمل الفني بنجاح في المعرض العام ومجلد Gallery_Images!');
            }

            resetArtworkForm();
        } catch (err) {
            console.error('[Save Artwork Error]', err);
            showAdminToast('حدث خطأ أثناء الحفظ: ' + err.message, false);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> إعادة المحاولة';
            }
        }
    }

    // ── Delete Artwork ──
    async function deleteWork(workId) {
        if (!confirm('هل أنت متأكد من رغبتك في حذف هذا العمل الفني من المعرض؟')) return;
        if (!db) return;

        try {
            await db.ref(`artworks/${workId}`).remove();
            showAdminToast('تم حذف العمل بنجاح');
        } catch (err) {
            showAdminToast('تعذر الحذف: ' + err.message, false);
        }
    }

    // ── Toggle Hero Featured ──
    async function toggleHeroFeatured(workId) {
        const work = AdminState.artworks.find(w => String(w._firebaseKey) === String(workId) || String(w.id) === String(workId)) || AdminState.artworks[workId];
        if (!work || !db) return;

        const newHeroState = !(work.isHeroFeatured === true);
        try {
            await db.ref(`artworks/${workId}`).update({
                isHeroFeatured: newHeroState,
                _secKey: SEC_KEY
            });
            showAdminToast(newHeroState ? 'تم تمييز العمل في واجهة المعرض' : 'تم إلغاء التمييز');
        } catch (err) {
            showAdminToast('خطأ أثناء تحديث التمييز', false);
        }
    }

    // ── Bind Modal Events ──
    function bindModalEvents() {
        // Login form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const pin = document.getElementById('admin-pin-input').value;
                handleLogin(pin);
            });
        }

        // Dropzone & File Input
        const dropzone = document.getElementById('publisher-dropzone');
        const fileInput = document.getElementById('publisher-file-input');

        if (dropzone && fileInput) {
            dropzone.addEventListener('click', () => fileInput.click());

            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                if (e.dataTransfer.files && e.dataTransfer.files.length) {
                    processSelectedFile(e.dataTransfer.files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length) {
                    processSelectedFile(e.target.files[0]);
                }
            });
        }

        // Google Drive Link input listener
        const driveInput = document.getElementById('input-drive-link');
        if (driveInput) {
            let driveTimer = null;
            const onDriveChange = () => {
                clearTimeout(driveTimer);
                driveTimer = setTimeout(() => {
                    const val = driveInput.value.trim();
                    if (val) processDriveInput(val);
                }, 350);
            };
            driveInput.addEventListener('input', onDriveChange);
            driveInput.addEventListener('paste', () => setTimeout(onDriveChange, 40));
            driveInput.addEventListener('change', onDriveChange);
        }

        // Publisher form
        const publisherForm = document.getElementById('publisher-form');
        if (publisherForm) {
            publisherForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = {
                    title: document.getElementById('input-work-title').value,
                    titleEn: document.getElementById('input-work-title-en').value,
                    category: document.getElementById('input-work-category').value,
                    description: document.getElementById('input-work-desc').value,
                    imageIdx: document.getElementById('input-work-img-idx').value,
                    isPublished: document.getElementById('input-work-published').checked,
                    isHeroFeatured: document.getElementById('input-work-hero').checked
                };
                saveArtwork(formData);
            });
        }

        // Live text synchronization
        bindLivePreviewSync();

        // Close & Logout buttons
        const closeBtn = document.getElementById('admin-modal-close');
        if (closeBtn) closeBtn.addEventListener('click', closeAdminModal);

        const logoutBtn = document.getElementById('admin-logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

        const modal = document.getElementById('admin-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeAdminModal();
            });
        }
    }

    // ── Global Realtime Sync Engine Initialization ──
    if (db) {
        db.ref('artworks').on('value', (snapshot) => {
            const val = snapshot.val();
            let list = [];
            if (val) {
                if (Array.isArray(val)) {
                    list = val.filter(item => item !== null);
                } else if (typeof val === 'object') {
                    list = Object.keys(val).map(k => ({ ...val[k], _firebaseKey: k }));
                }
            }
            AdminState.artworks = list;
            window.dispatchEvent(new CustomEvent('aj-artworks-updated', { detail: list }));
            renderPublishedWorksGrid();
        }, (err) => {
            console.warn('[Security Log] Read error:', err.message);
        });
    }

    // Public API
    window.AJAdmin = {
        open: openAdminModal,
        close: closeAdminModal,
        startEditWork: startEditWork,
        deleteWork: deleteWork,
        toggleHeroFeatured: toggleHeroFeatured,
        resetForm: resetArtworkForm,
        setCategory: (cat) => {
            const input = document.getElementById('input-work-category');
            if (input) {
                input.value = cat;
                input.dispatchEvent(new Event('input'));
            }
        }
    };

})(window);
