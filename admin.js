/**
 * AJ Gallery — Exclusive Artwork Publisher Studio & Smart Masonry Engine
 * Direct Publishing, Client-Side Compression & Sequential POST Architecture
 * Connected to Firebase Realtime Database (/POSTS) & Google Drive Integration
 * © 2026 Abdul Jabbar · All Rights Reserved
 */
(function (window) {
    'use strict';

    // Retrieve secure database instance and key from gateway
    const db = (window.AJGateway && window.AJGateway.getDb()) || ((window.firebase && typeof firebase.database === 'function') ? firebase.database() : null);
    const auth = (window.firebase && typeof firebase.auth === 'function') ? firebase.auth() : null;
    const SEC_KEY = (window.AJGateway && window.AJGateway.getSecKey()) || 'a4f9b8c2d1e0f7e6d5c4b3a291827364';

    const GOOGLE_DRIVE_FOLDER_ID = '1SIg96z1Ej0LgyC1WsOjT97x7gE_6W-hm';
    const GOOGLE_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}?usp=sharing`;
    const FIREBASE_RTDB_BASE = 'https://aj-gallery-2026-default-rtdb.firebaseio.com';

    const AdminState = {
        isAuthenticated: false,
        artworks: [],
        editingWorkId: null,
        currentFile: null,
        currentFileDataUrl: null,
        currentImageUrl: null,
        currentDimensions: null,
        isProcessingImage: false
    };

    // Check existing session
    if (sessionStorage.getItem('aj_auth_token') === 'sec_session_active_2026') {
        AdminState.isAuthenticated = true;
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

    // ── Check Database Sync Status ──
    async function checkSyncStatus() {
        try {
            const res = await fetch(`${FIREBASE_RTDB_BASE}/POSTS.json?shallow=true`);
            const statusEl = document.getElementById('gdrive-status-badge');
            if (statusEl) {
                if (res.ok) {
                    statusEl.innerHTML = `<i class="fa-solid fa-cloud-check"></i> قاعدة البيانات متصلة (POSTS)`;
                } else {
                    statusEl.innerHTML = `<i class="fa-solid fa-shield-halved"></i> نظام النشر نشط`;
                }
            }
        } catch (_) {}
    }

    // ── Dynamic Admin Modal DOM Injection (Pure Direct Upload - No Share Links) ──
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
                    <i class="fa-solid fa-sliders" style="color:var(--accent-gold);font-size:1.2rem"></i>
                    <div>
                        <h3 id="admin-panel-title" style="margin:0;font-size:1.15rem">إدارة وتعديل المعرض</h3>
                        <span style="font-size:0.75rem;color:var(--text-secondary)">نشر مباشر ومربوط بقاعدة البيانات تلقائياً بتسلسل POST منظم</span>
                    </div>
                </div>
                <div class="admin-header-actions">
                    <span class="gdrive-status-badge" id="gdrive-status-badge">
                        <i class="fa-solid fa-shield-halved"></i> متصل ومحمي
                    </span>
                    <button class="ozeum-mini-pill-btn" id="admin-key-btn" onclick="window.AJAdmin.changePin()" style="display:none;padding:0.25rem 0.65rem;font-size:0.72rem;color:var(--accent-gold);border-color:var(--border-gold)">
                        <i class="fa-solid fa-key"></i> الرمز (AKey)
                    </button>
                    <button class="admin-logout-btn" id="admin-logout-btn" title="تسجيل الخروج" style="display:none">
                        <i class="fa-solid fa-right-from-bracket"></i> خروج
                    </button>
                    <button class="admin-close-btn" id="admin-modal-close" aria-label="إغلاق">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </header>

            <!-- Login View -->
            <div id="admin-login-view" class="admin-login-box">
                <div class="login-card">
                    <div class="login-icon-avatar">
                        <i class="fa-solid fa-shield-halved"></i>
                    </div>
                    <h4>لوحة الإدارة</h4>
                    <p>أدخل رمز الدخول (AKey) للتحكم ونشر الأعمال</p>
                    <form id="admin-login-form">
                        <div class="admin-input-group">
                            <label for="admin-pin-input">رمز الدخول (AKey)</label>
                            <input type="password" id="admin-pin-input" class="admin-input" placeholder="أدخل رمز AKey" autocomplete="current-password" required autofocus>
                        </div>
                        <button type="submit" class="admin-btn-primary" style="width:100%;margin-top:1rem;justify-content:center">
                            <i class="fa-solid fa-arrow-right-to-bracket"></i> دخول
                        </button>
                    </form>
                </div>
            </div>

            <!-- Dedicated Artwork Publisher View -->
            <div id="admin-dashboard-view" class="admin-dashboard" style="display:none;padding:1.8rem;overflow-y:auto;max-height:82vh">
                
                <!-- Publisher Split Layout -->
                <div class="publisher-layout">
                    
                    <!-- Form & Direct Dropzone Column -->
                    <div class="publisher-form-col">
                        <form id="publisher-form" class="admin-form-card" style="padding:1.4rem">
                            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-color);padding-bottom:0.75rem">
                                <div>
                                    <h4 id="publisher-form-title" style="font-size:1.1rem;font-weight:700;color:var(--accent-gold);margin:0">
                                        <i class="fa-solid fa-circle-plus"></i> نشر عمل فني جديد
                                    </h4>
                                    <span id="publisher-form-seq-tag" style="font-size:0.75rem;color:var(--text-secondary)">يتم عنونة المنشور تلقائياً بتسلسل POST1, POST2...</span>
                                </div>
                                <button type="button" class="ozeum-mini-pill-btn" id="publisher-reset-btn" onclick="window.AJAdmin.resetForm()">
                                    <i class="fa-solid fa-rotate-left"></i> تفريغ الحقول
                                </button>
                            </div>

                            <!-- Smart Direct Image Dropzone (Optimized for Mobile Phone Cameras & Galleries) -->
                            <div class="publisher-dropzone" id="publisher-dropzone" style="margin-top:0.75rem" role="button" tabindex="0" title="اختر صورة من هاتفك أو جهازك">
                                <input type="file" id="publisher-file-input" accept="image/*" style="display:none">
                                <i class="fa-solid fa-cloud-arrow-up dropzone-icon"></i>
                                <div class="dropzone-title">اختر صورة من هاتفك أو اسحبها هنا</div>
                                <div class="dropzone-sub">يدعم صور الكاميرا والاستوديو — رفع مباشر، ضغط ذكي فوري، وتحديد تلقائي للأبعاد والنسبة</div>
                                <div class="dropzone-specs">
                                    <span class="dropzone-spec-pill"><i class="fa-solid fa-mobile-screen"></i> يدعم الهاتف بنقرة واحدة</span>
                                    <span class="dropzone-spec-pill"><i class="fa-solid fa-bolt"></i> جودة فائقة ونشر فوري</span>
                                </div>
                            </div>

                            <!-- Image Meta Detected Banner -->
                            <div class="image-meta-banner" id="image-meta-banner" style="display:none">
                                <div class="image-meta-info">
                                    <span class="aspect-badge" id="detected-aspect-badge">النسبة: 16:9</span>
                                    <span class="res-badge" id="detected-res-badge">1920 × 1080 Px</span>
                                    <span style="font-size:0.75rem;color:var(--accent-gold);font-weight:600" id="detected-size-badge">أفقي</span>
                                </div>
                                <button type="button" class="ozeum-mini-pill-btn" style="padding:0.25rem 0.6rem;font-size:0.7rem" onclick="document.getElementById('publisher-file-input').click()">
                                    <i class="fa-solid fa-repeat"></i> تغيير الصورة
                                </button>
                            </div>

                            <!-- Titles Row -->
                            <div class="admin-form-grid" style="margin-top:0.9rem">
                                <div class="admin-input-group">
                                    <label for="input-work-title">عنوان العمل *</label>
                                    <input type="text" id="input-work-title" class="admin-input" placeholder="مثال: تصميم واجهة وهوية رقمية" required>
                                </div>
                                <div class="admin-input-group">
                                    <label for="input-work-title-en">العنوان بالإنجليزية (اختياري)</label>
                                    <input type="text" id="input-work-title-en" class="admin-input" placeholder="e.g. UI & Digital Identity" dir="ltr">
                                </div>
                            </div>

                            <!-- Category with Simple Quick Pills -->
                            <div class="admin-input-group">
                                <label for="input-work-category">التصنيف *</label>
                                <input type="text" id="input-work-category" class="admin-input" placeholder="واجهات UI / هوية بصرية / بوسترات / فنون رقمية" required>
                                <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.45rem">
                                    <button type="button" class="ozeum-mini-pill-btn" style="padding:0.2rem 0.6rem;font-size:0.72rem" onclick="window.AJAdmin.setCategory('واجهات UI')">واجهات UI</button>
                                    <button type="button" class="ozeum-mini-pill-btn" style="padding:0.2rem 0.6rem;font-size:0.72rem" onclick="window.AJAdmin.setCategory('هوية بصرية')">هوية بصرية</button>
                                    <button type="button" class="ozeum-mini-pill-btn" style="padding:0.2rem 0.6rem;font-size:0.72rem" onclick="window.AJAdmin.setCategory('بوسترات')">بوسترات</button>
                                    <button type="button" class="ozeum-mini-pill-btn" style="padding:0.2rem 0.6rem;font-size:0.72rem" onclick="window.AJAdmin.setCategory('فنون رقمية')">فنون رقمية</button>
                                </div>
                            </div>

                            <!-- Description -->
                            <div class="admin-input-group">
                                <label for="input-work-desc">الوصف</label>
                                <textarea id="input-work-desc" class="admin-input" rows="3" placeholder="نبذة موجزة عن فكرة وتفاصيل العمل..."></textarea>
                            </div>

                            <!-- Toggles -->
                            <div style="display:flex;gap:1.5rem;flex-wrap:wrap;padding:0.3rem 0">
                                <label class="admin-checkbox-label">
                                    <input type="checkbox" id="input-work-published" checked>
                                    <span>عرض في المعرض</span>
                                </label>
                                <label class="admin-checkbox-label">
                                    <input type="checkbox" id="input-work-hero">
                                    <span>تمييز في الواجهة (Hero)</span>
                                </label>
                            </div>

                            <!-- Action Buttons -->
                            <div style="display:flex;gap:0.75rem;align-items:center;margin-top:0.8rem">
                                <button type="submit" id="publisher-submit-btn" class="admin-btn-primary" style="flex:1;padding:0.75rem;font-size:0.92rem;justify-content:center">
                                    <i class="fa-solid fa-cloud-arrow-up"></i> <span>نشر العمل في المعرض</span>
                                </button>
                                <button type="button" id="publisher-cancel-edit-btn" class="ozeum-mini-pill-btn" style="display:none;padding:0.75rem 1rem" onclick="window.AJAdmin.resetForm()">
                                    إلغاء التعديل
                                </button>
                            </div>
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
                                        <span>اختر صورة من هاتفك لترى المعاينة المتحفية التفاعلية هنا فورياً</span>
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
                                <i class="fa-solid fa-images" style="color:var(--accent-gold)"></i> المنشورات المعتمدة (/POSTS)
                            </h4>
                            <span class="admin-badge-category" id="publisher-count-badge">0 منشورات</span>
                        </div>
                        <span style="font-size:0.75rem;color:var(--text-secondary)">مرتبة تلقائياً بتسلسل POST1, POST2, POST3... — تحكم مباشر بالتعديل والحذف</span>
                    </div>

                    <div class="published-works-grid" id="publisher-works-grid"></div>
                </div>

            </div>
        </div>
        `;

        document.body.appendChild(modalDiv);
        bindModalEvents();
        checkSyncStatus();
    }

    // ── Authentication Handlers with Firebase AKey (Primary & Authoritative) ──
    async function handleLogin(enteredPin) {
        const pin = String(enteredPin || '').trim();
        if (!pin) {
            showAdminToast('يرجى إدخال رمز الدخول (AKey)', false);
            return;
        }

        let isAuthorized = false;

        // 1. PRIMARY: Direct authoritative check against Firebase Realtime Database AKey.json
        try {
            const directRes = await fetch(`${FIREBASE_RTDB_BASE}/AKey.json`);
            if (directRes.ok) {
                const akeyRaw = await directRes.json();
                if (akeyRaw !== null && akeyRaw !== undefined) {
                    const serverAKey = String(akeyRaw).trim();
                    if (serverAKey && pin === serverAKey) {
                        isAuthorized = true;
                    }
                }
            }
        } catch (fetchErr) {
            console.warn('[AKey Fetch Warning]', fetchErr);
        }

        // 2. Direct Firebase SDK AKey verification
        if (!isAuthorized && db) {
            try {
                const snap = await db.ref('AKey').once('value');
                const akey = snap.val();
                if (akey !== null && akey !== undefined) {
                    if (String(akey).trim() === pin) {
                        isAuthorized = true;
                    }
                }
            } catch (_) {}
        }

        // 3. Backend Proxy verification
        if (!isAuthorized) {
            try {
                const res = await fetch('/api/admin/verify-pin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin: pin })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        isAuthorized = true;
                    }
                }
            } catch (_) {}
        }

        if (isAuthorized) {
            AdminState.isAuthenticated = true;
            sessionStorage.setItem('aj_auth_token', 'sec_session_active_2026');
            showAdminToast('تم الدخول بنجاح عبر رمز AKey');
            updateAdminPanelUI();
        } else {
            showAdminToast('رمز الدخول (AKey) غير صحيح', false);
        }
    }

    async function changePin() {
        const newPin = prompt('أدخل رمز الدخول الجديد (AKey) المكون من 4 خانات على الأقل:');
        if (!newPin) return;
        const clean = newPin.trim();
        if (clean.length < 4) {
            showAdminToast('يجب ألا يقل الرمز عن 4 خانات', false);
            return;
        }

        let updated = false;

        // 1. Direct Firebase RTDB update
        try {
            const res = await fetch(`${FIREBASE_RTDB_BASE}/AKey.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clean)
            });
            if (res.ok) updated = true;
        } catch (_) {}

        // 2. Direct Firebase SDK update
        if (!updated && db) {
            try {
                await db.ref('AKey').set(clean);
                updated = true;
            } catch (err) {
                console.warn('[Update AKey SDK]', err.message);
            }
        }

        if (updated) {
            showAdminToast('تم حفظ رمز الدخول الجديد (AKey) في Firebase بنجاح');
        } else {
            showAdminToast('تعذر تحديث الرمز في Firebase', false);
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
        const keyBtn = document.getElementById('admin-key-btn');

        if (!loginView || !dashboardView) return;

        if (AdminState.isAuthenticated) {
            loginView.style.display = 'none';
            dashboardView.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'inline-flex';
            if (keyBtn) keyBtn.style.display = 'inline-flex';
            renderPublishedWorksGrid();
            checkSyncStatus();
        } else {
            loginView.style.display = 'flex';
            dashboardView.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (keyBtn) keyBtn.style.display = 'none';
            const pinInput = document.getElementById('admin-pin-input');
            if (pinInput) {
                pinInput.value = '';
                pinInput.focus();
            }
        }
    }

    // ── Smart Aspect Ratio & Orientation Calculator ──
    function calculateArtworkDimensions(nw, nh) {
        const rawRatio = nw / nh;
        let orientation = 'مربع';
        let aspectRatio = '1:1';

        if (Math.abs(rawRatio - 16/9) < 0.08) { aspectRatio = '16:9'; orientation = 'أفقي'; }
        else if (Math.abs(rawRatio - 16/10) < 0.08) { aspectRatio = '16:10'; orientation = 'أفقي'; }
        else if (Math.abs(rawRatio - 4/3) < 0.08) { aspectRatio = '4:3'; orientation = 'أفقي'; }
        else if (Math.abs(rawRatio - 3/2) < 0.08) { aspectRatio = '3:2'; orientation = 'أفقي'; }
        else if (Math.abs(rawRatio - 21/9) < 0.08) { aspectRatio = '21:9'; orientation = 'أفقي عريض'; }
        else if (Math.abs(rawRatio - 1) < 0.08) { aspectRatio = '1:1'; orientation = 'مربع'; }
        else if (Math.abs(rawRatio - 4/5) < 0.08) { aspectRatio = '4:5'; orientation = 'عمودي'; }
        else if (Math.abs(rawRatio - 3/4) < 0.08) { aspectRatio = '3:4'; orientation = 'عمودي'; }
        else if (Math.abs(rawRatio - 2/3) < 0.08) { aspectRatio = '2:3'; orientation = 'عمودي'; }
        else if (Math.abs(rawRatio - 9/16) < 0.08) { aspectRatio = '9:16'; orientation = 'عمودي طولي'; }
        else if (rawRatio > 1.15) { orientation = 'أفقي'; aspectRatio = `${rawRatio.toFixed(2)}:1`; }
        else if (rawRatio < 0.88) { orientation = 'عمودي'; aspectRatio = `1:${(1/rawRatio).toFixed(2)}`; }
        else { orientation = 'مربع'; aspectRatio = '1:1'; }

        return {
            width: nw,
            height: nh,
            aspectRatio: aspectRatio,
            orientation: orientation,
            rawRatio: rawRatio
        };
    }

    function applyDetectedDimensions(dim, labelSuffix = '') {
        AdminState.currentDimensions = dim;

        const banner = document.getElementById('image-meta-banner');
        const aspectBadge = document.getElementById('detected-aspect-badge');
        const resBadge = document.getElementById('detected-res-badge');
        const sizeBadge = document.getElementById('detected-size-badge');
        const previewSpecs = document.getElementById('live-preview-specs');

        if (banner) banner.style.display = 'flex';
        if (aspectBadge) aspectBadge.innerText = `${dim.orientation} · نسبة ${dim.aspectRatio}`;
        if (resBadge) resBadge.innerText = `${dim.width} × ${dim.height} Px`;
        if (sizeBadge) sizeBadge.innerText = labelSuffix || `${dim.orientation}`;
        if (previewSpecs) previewSpecs.innerText = `${dim.aspectRatio} · ${dim.orientation}`;
    }

    // ── High-Performance Client-Side Image Compression for Instant Mobile Uploads ──
    function compressImageForUpload(file, maxDimension = 1920, quality = 0.84) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let width = img.naturalWidth;
                    let height = img.naturalHeight;
                    const originalWidth = width;
                    const originalHeight = height;

                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = Math.round((height * maxDimension) / width);
                            width = maxDimension;
                        } else {
                            width = Math.round((width * maxDimension) / height);
                            height = maxDimension;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);

                    // Try WebP first for optimal efficiency, fallback to JPEG
                    let compressedDataUrl = canvas.toDataURL('image/webp', quality);
                    if (!compressedDataUrl.startsWith('data:image/webp')) {
                        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    }

                    const approxSizeKb = Math.round((compressedDataUrl.length * 0.75) / 1024);

                    resolve({
                        dataUrl: compressedDataUrl,
                        width: width,
                        height: height,
                        originalWidth: originalWidth,
                        originalHeight: originalHeight,
                        approxSizeKb: approxSizeKb
                    });
                };
                img.onerror = () => reject(new Error('تعذر قراءة ملف الصورة'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('تعذر تحميل الملف من جهازك'));
            reader.readAsDataURL(file);
        });
    }

    // ── Direct Image Processing (Mobile & Desktop) ──
    async function processSelectedFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            showAdminToast('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)', false);
            return;
        }

        AdminState.currentFile = file;
        AdminState.isProcessingImage = true;

        showAdminToast('جاري تحسين وضغط الصورة تمهيداً للنشر...');

        try {
            const result = await compressImageForUpload(file, 1920, 0.84);
            AdminState.currentFileDataUrl = result.dataUrl;
            AdminState.currentImageUrl = result.dataUrl;
            AdminState.isProcessingImage = false;

            const dim = calculateArtworkDimensions(result.originalWidth, result.originalHeight);
            dim.size = file.size;
            applyDetectedDimensions(dim, `محسنة (${result.approxSizeKb} KB)`);

            // Render on live preview canvas
            const liveCv = document.getElementById('live-preview-canvas');
            const placeholder = document.getElementById('preview-placeholder');
            if (placeholder) placeholder.style.display = 'none';
            if (liveCv) {
                liveCv.style.display = 'block';
                if (window.Img2Preview) {
                    Img2Preview.paint(liveCv, result.dataUrl, { autoHeight: true, watermark: true });
                }
            }

            showAdminToast(`تم تجهيز الصورة بنجاح: ${result.originalWidth}×${result.originalHeight} بكسل (${dim.orientation})`);
        } catch (err) {
            AdminState.isProcessingImage = false;
            console.error('[Image Compression Error]', err);
            showAdminToast('حدث خطأ أثناء معالجة الصورة: ' + err.message, false);
        }
    }

    // ── Calculate Next Sequential POST ID (POST1, POST2, POST3...) ──
    function getNextPostId() {
        if (!AdminState.artworks || AdminState.artworks.length === 0) {
            return 'POST1';
        }
        let maxNum = 0;
        AdminState.artworks.forEach(w => {
            const idStr = String(w.id || w._firebaseKey || '');
            const num = parseInt(idStr.replace(/\D/g, ''), 10);
            if (!isNaN(num) && num > maxNum) {
                maxNum = num;
            }
        });
        return `POST${maxNum + 1}`;
    }

    // ── Live Text Synchronization with Preview ──
    function bindLivePreviewSync() {
        const titleIn = document.getElementById('input-work-title');
        const catIn = document.getElementById('input-work-category');
        const descIn = document.getElementById('input-work-desc');

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
    }

    // ── Render Published Works Manager Grid (Sorted POST1, POST2, POST3...) ──
    function renderPublishedWorksGrid() {
        const grid = document.getElementById('publisher-works-grid');
        const countBadge = document.getElementById('publisher-count-badge');
        if (!grid) return;

        grid.innerHTML = '';
        const count = AdminState.artworks.length;
        if (countBadge) countBadge.innerText = `${count} منشورات`;

        if (!count) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted)">لا توجد أعمال فنية منشورة حالياً في المعرض</div>`;
            return;
        }

        AdminState.artworks.forEach((work, index) => {
            const card = document.createElement('div');
            card.className = 'mini-work-card';
            const workId = String(work.id || work._firebaseKey || `POST${index + 1}`);
            const isPub = work.isPublished !== false;
            const isHero = work.isHeroFeatured === true;

            const orient = work.orientation || (work.aspectRatio ? (parseFloat(work.aspectRatio) > 1.15 ? 'أفقي' : (parseFloat(work.aspectRatio) < 0.88 ? 'عمودي' : 'مربع')) : '');
            const icon = (orient.includes('عمودي') || orient.includes('طولي')) ? 'arrows-up-down' : ((orient.includes('أفقي') || orient.includes('عريض')) ? 'arrows-left-right' : 'vector-square');
            const orientBadge = orient ? `<span class="artwork-ratio-pill" style="font-size:0.6rem;padding:0.1rem 0.4rem"><i class="fa-solid fa-${icon}"></i> ${orient}</span>` : '';

            card.innerHTML = `
                <div class="mini-work-thumb">
                    <canvas class="mini-cv" data-work-idx="${workId}"></canvas>
                </div>
                <div class="mini-work-meta">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:0.35rem">
                        <h5 style="margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(work.title || '')}">
                            <span style="color:var(--accent-gold);font-weight:700">${workId}:</span> ${escapeHtml(work.title || 'بدون عنوان')}
                        </h5>
                        ${orientBadge}
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.25rem">
                        <span>${escapeHtml(work.category || 'تصميم')}</span>
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
                const imgSource = work.imageSrc || workId;
                setTimeout(() => {
                    Img2Preview.paint(cv, imgSource, { contain: true, w: 200, h: 120 });
                }, index * 30);
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
        AdminState.currentImageUrl = null;
        AdminState.currentDimensions = null;
        AdminState.isProcessingImage = false;

        const nextId = getNextPostId();
        const formTitle = document.getElementById('publisher-form-title');
        if (formTitle) formTitle.innerHTML = '<i class="fa-solid fa-circle-plus"></i> نشر عمل فني جديد';

        const seqTag = document.getElementById('publisher-form-seq-tag');
        if (seqTag) seqTag.innerText = `سيتم عنونة المنشور تلقائياً بالمعرف: ${nextId}`;

        const submitBtn = document.getElementById('publisher-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> <span>نشر العمل في المعرض</span>';
        }

        const cancelBtn = document.getElementById('publisher-cancel-edit-btn');
        if (cancelBtn) cancelBtn.style.display = 'none';

        const banner = document.getElementById('image-meta-banner');
        if (banner) banner.style.display = 'none';

        const liveCv = document.getElementById('live-preview-canvas');
        const placeholder = document.getElementById('preview-placeholder');
        if (liveCv) liveCv.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';

        const liveTitle = document.getElementById('live-preview-title');
        const liveCat = document.getElementById('live-preview-category');
        const liveDesc = document.getElementById('live-preview-desc');
        const liveSpecs = document.getElementById('live-preview-specs');
        if (liveTitle) liveTitle.innerText = 'عنوان العمل الفني';
        if (liveCat) liveCat.innerText = 'UI ARCHITECTURE';
        if (liveDesc) liveDesc.innerText = 'سيظهر وصف العمل الفني هنا كما يُعرض في نافذة المعاينة المكبرة.';
        if (liveSpecs) liveSpecs.innerText = 'RATIO: AUTO';
    }

    // ── Start Editing Artwork ──
    function startEditWork(workId) {
        const work = AdminState.artworks.find(w => String(w._firebaseKey) === String(workId) || String(w.id) === String(workId));
        if (!work) return;

        const cleanId = String(work.id || work._firebaseKey || workId);
        AdminState.editingWorkId = cleanId;

        document.getElementById('input-work-title').value = work.title || '';
        document.getElementById('input-work-title-en').value = work.titleEn || '';
        document.getElementById('input-work-category').value = work.category || 'UI Architecture';
        document.getElementById('input-work-desc').value = work.description || '';
        document.getElementById('input-work-published').checked = work.isPublished !== false;
        document.getElementById('input-work-hero').checked = work.isHeroFeatured === true;

        AdminState.currentImageUrl = work.imageSrc || null;

        // Auto-detect or restore dimensions
        if (work.width && work.height) {
            const dim = calculateArtworkDimensions(work.width, work.height);
            if (work.aspectRatio) dim.aspectRatio = work.aspectRatio;
            if (work.orientation) dim.orientation = work.orientation;
            applyDetectedDimensions(dim, 'العمل الحالي');
        } else if (work.aspectRatio) {
            const banner = document.getElementById('image-meta-banner');
            const aspectBadge = document.getElementById('detected-aspect-badge');
            if (banner) banner.style.display = 'flex';
            if (aspectBadge) aspectBadge.innerText = `${work.orientation || ''} · نسبة ${work.aspectRatio}`;
        }

        const formTitle = document.getElementById('publisher-form-title');
        if (formTitle) formTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> تعديل ${cleanId}: ${escapeHtml(work.title)}`;

        const seqTag = document.getElementById('publisher-form-seq-tag');
        if (seqTag) seqTag.innerText = `جاري تعديل المنشور الحامل للمعرف ${cleanId}`;

        const submitBtn = document.getElementById('publisher-submit-btn');
        if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> <span>حفظ التعديلات</span>';

        const cancelBtn = document.getElementById('publisher-cancel-edit-btn');
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';

        // Update live preview
        const liveTitle = document.getElementById('live-preview-title');
        const liveCat = document.getElementById('live-preview-category');
        const liveDesc = document.getElementById('live-preview-desc');
        const liveSpecs = document.getElementById('live-preview-specs');
        if (liveTitle) liveTitle.innerText = work.title || '';
        if (liveCat) liveCat.innerText = (work.category || '').toUpperCase();
        if (liveDesc) liveDesc.innerText = work.description || '';
        if (liveSpecs) liveSpecs.innerText = `${work.aspectRatio || 'AUTO'} · ${work.orientation || ''}`;

        const liveCv = document.getElementById('live-preview-canvas');
        const placeholder = document.getElementById('preview-placeholder');
        if (placeholder) placeholder.style.display = 'none';
        if (liveCv && window.Img2Preview) {
            liveCv.style.display = 'block';
            Img2Preview.paint(liveCv, work.imageSrc || cleanId, { autoHeight: true, watermark: true });
        }

        const form = document.getElementById('publisher-form');
        if (form) form.scrollIntoView({ behavior: 'smooth' });
    }

    // ── Save / Publish Artwork Handler (100% Reliable Upload & Sequential POST Assignment) ──
    async function saveArtwork(formData) {
        if (AdminState.isProcessingImage) {
            showAdminToast('يرجى الانتظار حتى تكتمل معالجة الصورة', false);
            return;
        }

        const submitBtn = document.getElementById('publisher-submit-btn');
        const isEditing = AdminState.editingWorkId !== null;
        const targetPostId = isEditing ? AdminState.editingWorkId : getNextPostId();

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${isEditing ? 'جاري حفظ التعديلات...' : `جاري نشر (${targetPostId})...`}`;
        }

        try {
            const existingWork = isEditing
                ? (AdminState.artworks.find(w => String(w.id) === String(targetPostId) || String(w._firebaseKey) === String(targetPostId)) || {})
                : {};

            let finalImageSrc = null;

            // 1. If user selected a new file from phone/PC
            if (AdminState.currentFile && AdminState.currentFileDataUrl) {
                // Try backend media upload if available
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
                        if (uploadJson.url) {
                            finalImageSrc = uploadJson.url;
                        }
                    }
                } catch (_) {
                    // Backend unavailable (e.g. running statically on GitHub Pages / phone)
                }

                // If backend was unreachable or returned error, use compressed high-res data URL
                if (!finalImageSrc) {
                    finalImageSrc = AdminState.currentFileDataUrl;
                }
            } else if (isEditing && existingWork.imageSrc) {
                // Retain current image on edit
                finalImageSrc = existingWork.imageSrc;
            }

            if (!finalImageSrc) {
                showAdminToast('يرجى اختيار صورة من هاتفك أولاً', false);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = isEditing ? 'حفظ التعديلات' : '<i class="fa-solid fa-cloud-arrow-up"></i> <span>نشر العمل</span>';
                }
                return;
            }

            // 2. Construct Clean POST Record with Merged Likes & Anti-Duplicate Views
            const postRecord = {
                id: targetPostId,
                title: formData.title.trim().slice(0, 140),
                titleEn: (formData.titleEn || '').trim().slice(0, 140),
                category: formData.category.trim().slice(0, 70),
                description: (formData.description || '').trim().slice(0, 700),
                imageSrc: finalImageSrc,
                aspectRatio: AdminState.currentDimensions ? AdminState.currentDimensions.aspectRatio : (existingWork.aspectRatio || '16:9'),
                orientation: AdminState.currentDimensions ? AdminState.currentDimensions.orientation : (existingWork.orientation || 'أفقي'),
                width: AdminState.currentDimensions ? AdminState.currentDimensions.width : (existingWork.width || 1920),
                height: AdminState.currentDimensions ? AdminState.currentDimensions.height : (existingWork.height || 1080),
                likesCount: typeof existingWork.likesCount === 'number' ? existingWork.likesCount : 0,
                viewsCount: typeof existingWork.viewsCount === 'number' ? existingWork.viewsCount : 0,
                viewedUsers: existingWork.viewedUsers || {},
                isPublished: Boolean(formData.isPublished),
                isHeroFeatured: Boolean(formData.isHeroFeatured),
                createdAt: existingWork.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            let savedSuccessfully = false;

            // 3. PRIMARY: Save directly to Firebase RTDB under /POSTS/{targetPostId}
            try {
                const putRes = await fetch(`${FIREBASE_RTDB_BASE}/POSTS/${targetPostId}.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postRecord)
                });
                if (putRes.ok) {
                    savedSuccessfully = true;
                }
            } catch (rtdbErr) {
                console.warn('[RTDB REST Warning]', rtdbErr);
            }

            // 4. Fallback to Firebase SDK if REST failed
            if (!savedSuccessfully && db) {
                try {
                    await db.ref(`POSTS/${targetPostId}`).set(postRecord);
                    savedSuccessfully = true;
                } catch (sdkErr) {
                    console.warn('[Firebase SDK Set Error]', sdkErr);
                }
            }

            if (savedSuccessfully) {
                showAdminToast(isEditing ? `تم حفظ تعديلات ${targetPostId} بنجاح` : `تم نشر العمل بنجاح بالمعرف ${targetPostId}!`);
                resetArtworkForm();
                // Refresh local list
                await refreshPostsFromDatabase();
            } else {
                throw new Error('تعذر الوصول لقاعدة بيانات Firebase');
            }

        } catch (err) {
            console.error('[Save Post Error]', err);
            showAdminToast('حدث خطأ أثناء النشر: ' + err.message, false);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> إعادة المحاولة';
            }
        }
    }

    // ── Delete Artwork & Contiguously Re-Index Remaining (POST1, POST2, POST3...) ──
    async function deleteWork(targetPostId) {
        const idStr = String(targetPostId);
        const work = AdminState.artworks.find(w => String(w.id) === idStr || String(w._firebaseKey) === idStr);
        const title = work ? `"${work.title}" (${idStr})` : idStr;

        if (!confirm(`هل أنت متأكد من حذف ${title} نهائياً؟ سيتم إعادة ترتيب المنشورات المتبقية بتسلسل متصل.`)) {
            return;
        }

        showAdminToast('جاري الحذف وإعادة تنظيم التسلسل...');

        // Filter out target post
        const remaining = AdminState.artworks.filter(w => String(w.id) !== idStr && String(w._firebaseKey) !== idStr);

        // Sort naturally by their existing number
        remaining.sort((a, b) => {
            const numA = parseInt(String(a.id || a._firebaseKey).replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(String(b.id || b._firebaseKey).replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });

        // Re-index contiguously: POST1, POST2, POST3...
        const newPostsMap = {};
        const reindexedList = remaining.map((item, idx) => {
            const newId = `POST${idx + 1}`;
            const updated = {
                ...item,
                id: newId,
                updatedAt: new Date().toISOString()
            };
            delete updated._firebaseKey;
            newPostsMap[newId] = updated;
            return updated;
        });

        try {
            if (reindexedList.length === 0) {
                // Delete entire POSTS node
                await fetch(`${FIREBASE_RTDB_BASE}/POSTS.json`, { method: 'DELETE' });
                if (db) db.ref('POSTS').remove().catch(() => {});
                AdminState.artworks = [];
            } else {
                // Atomically overwrite /POSTS with new contiguous sequence
                const putRes = await fetch(`${FIREBASE_RTDB_BASE}/POSTS.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newPostsMap)
                });
                if (!putRes.ok && db) {
                    await db.ref('POSTS').set(newPostsMap);
                }
                AdminState.artworks = reindexedList;
            }

            renderPublishedWorksGrid();
            window.dispatchEvent(new CustomEvent('aj-artworks-updated', { detail: AdminState.artworks }));
            showAdminToast('تم حذف المنشور وإعادة ترتيب المعرض بتسلسل منظم (POST1, POST2...)');

            if (String(AdminState.editingWorkId) === idStr) {
                resetArtworkForm();
            }
        } catch (err) {
            console.error('[Delete Post Error]', err);
            showAdminToast('حدث خطأ أثناء الحذف: ' + err.message, false);
        }
    }

    // ── Toggle Hero Featured on POST ──
    async function toggleHeroFeatured(targetPostId) {
        const idStr = String(targetPostId);
        const work = AdminState.artworks.find(w => String(w.id) === idStr || String(w._firebaseKey) === idStr);
        if (!work) return;

        const newHeroState = !(work.isHeroFeatured === true);

        try {
            await fetch(`${FIREBASE_RTDB_BASE}/POSTS/${idStr}/isHeroFeatured.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newHeroState)
            });
            if (db) {
                db.ref(`POSTS/${idStr}/isHeroFeatured`).set(newHeroState).catch(() => {});
            }
            work.isHeroFeatured = newHeroState;
            renderPublishedWorksGrid();
            window.dispatchEvent(new CustomEvent('aj-artworks-updated', { detail: AdminState.artworks }));
            showAdminToast(newHeroState ? `تم تمييز ${idStr} في واجهة المعرض` : `تم إلغاء التمييز عن ${idStr}`);
        } catch (err) {
            showAdminToast('تعذر تحديث حالة التمييز', false);
        }
    }

    // ── Helper: Refresh Posts from Firebase RTDB ──
    async function refreshPostsFromDatabase() {
        try {
            const res = await fetch(`${FIREBASE_RTDB_BASE}/POSTS.json`);
            if (res.ok) {
                const data = await res.json();
                if (window.AJGateway && window.AJGateway.normalizePostsData) {
                    AdminState.artworks = window.AJGateway.normalizePostsData(data);
                } else {
                    AdminState.artworks = normalizePostsDirect(data);
                }
                renderPublishedWorksGrid();
                window.dispatchEvent(new CustomEvent('aj-artworks-updated', { detail: AdminState.artworks }));
            }
        } catch (_) {}
    }

    function normalizePostsDirect(val) {
        if (!val) return [];
        let list = [];
        if (Array.isArray(val)) {
            list = val.filter(Boolean).map((item, idx) => ({
                ...item,
                id: item.id || `POST${idx + 1}`,
                _firebaseKey: item.id || `POST${idx + 1}`
            }));
        } else if (typeof val === 'object') {
            const keys = Object.keys(val);
            list = keys.map(k => ({
                ...val[k],
                id: val[k].id || k,
                _firebaseKey: k
            }));
            list.sort((a, b) => {
                const numA = parseInt(String(a.id || a._firebaseKey).replace(/\D/g, ''), 10) || 0;
                const numB = parseInt(String(b.id || b._firebaseKey).replace(/\D/g, ''), 10) || 0;
                return numA - numB;
            });
        }
        return list;
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

        // Dropzone & File Input (Direct Phone & Desktop)
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

    // ── Global Realtime Sync Engine Initialization (/POSTS) ──
    refreshPostsFromDatabase();

    if (db) {
        db.ref('POSTS').on('value', (snapshot) => {
            const val = snapshot.val();
            const list = normalizePostsDirect(val);
            AdminState.artworks = list;
            window.dispatchEvent(new CustomEvent('aj-artworks-updated', { detail: list }));
            renderPublishedWorksGrid();
        }, (err) => {
            console.warn('[Admin Sync Log] Read status:', err.message);
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
        changePin: changePin,
        setCategory: (cat) => {
            const input = document.getElementById('input-work-category');
            if (input) {
                input.value = cat;
                input.dispatchEvent(new Event('input'));
            }
        }
    };

})(window);
