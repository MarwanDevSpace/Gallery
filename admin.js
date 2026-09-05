/**
 * AJ Gallery — Exclusive Artwork Publisher Studio & Smart Masonry Engine
 * Protected by Cryptographic Token & Firebase Realtime Database
 * © 2026 Abdul Jabbar · All Rights Reserved
 */
(function (window) {
    'use strict';

    // Retrieve secure database instance and key from gateway
    const db = (window.AJGateway && window.AJGateway.getDb()) || ((window.firebase && typeof firebase.database === 'function') ? firebase.database() : null);
    const auth = (window.firebase && typeof firebase.auth === 'function') ? firebase.auth() : null;
    const SEC_KEY = (window.AJGateway && window.AJGateway.getSecKey()) || 'a4f9b8c2d1e0f7e6d5c4b3a291827364';


    // ── Publisher State & Google Drive Integration ──
    const GOOGLE_DRIVE_FOLDER_ID = '1SIg96z1Ej0LgyC1WsOjT97x7gE_6W-hm';
    const GOOGLE_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}?usp=sharing`;

    const AdminState = {
        isAuthenticated: false,
        artworks: [],
        editingWorkId: null,
        currentFile: null,
        currentFileDataUrl: null,
        currentImageUrl: null,
        currentDriveFileId: null,
        currentDimensions: null
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

    // ── Check Database Sync Status ──
    async function checkSyncStatus() {
        try {
            const res = await fetch('/api/artworks');
            if (res.ok) {
                const statusEl = document.getElementById('gdrive-status-badge');
                if (statusEl) {
                    statusEl.innerHTML = `<i class="fa-solid fa-cloud-check"></i> قاعدة البيانات متصلة`;
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
                    <i class="fa-solid fa-sliders" style="color:var(--accent-gold);font-size:1.2rem"></i>
                    <div>
                        <h3 id="admin-panel-title" style="margin:0;font-size:1.15rem">إدارة وتعديل المعرض</h3>
                        <span style="font-size:0.75rem;color:var(--text-secondary)">نظام تحكم ونشر فوري متصل بقاعدة البيانات</span>
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
                    
                    <!-- Form & Dropzone Column -->
                    <div class="publisher-form-col">
                        <form id="publisher-form" class="admin-form-card" style="padding:1.4rem">
                            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-color);padding-bottom:0.75rem">
                                <div>
                                    <h4 id="publisher-form-title" style="font-size:1.1rem;font-weight:700;color:var(--accent-gold);margin:0">
                                        <i class="fa-solid fa-circle-plus"></i> نشر عمل فني جديد
                                    </h4>
                                    <span style="font-size:0.75rem;color:var(--text-secondary)">يتم نشر العمل الفني فورياً في المعرض وتحديث الصفحة تلقائياً</span>
                                </div>
                                <button type="button" class="ozeum-mini-pill-btn" id="publisher-reset-btn" onclick="window.AJAdmin.resetForm()">
                                    <i class="fa-solid fa-rotate-left"></i> تفريغ الحقول
                                </button>
                            </div>

                            <!-- Google Drive Integration & Folder Hub -->
                            <div class="drive-input-box" style="background:linear-gradient(135deg, rgba(210,176,121,0.08) 0%, rgba(20,20,30,0.6) 100%);border:1px solid rgba(210,176,121,0.28);border-radius:10px;padding:1rem;margin-bottom:1rem">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;flex-wrap:wrap;gap:0.5rem">
                                    <span style="font-size:0.85rem;font-weight:700;color:var(--accent-gold);display:inline-flex;align-items:center;gap:0.45rem">
                                        <i class="fa-brands fa-google-drive"></i> مجلد الوسائط: Gallery_Images
                                    </span>
                                    <a href="${GOOGLE_DRIVE_FOLDER_URL}" target="_blank" rel="noopener noreferrer" class="ozeum-mini-pill-btn" style="background:var(--accent-gold);color:#0a0a0f;font-weight:700;padding:0.35rem 0.85rem;display:inline-flex;align-items:center;gap:0.35rem;text-decoration:none">
                                        <i class="fa-solid fa-arrow-up-right-from-square"></i> فتح مجلد Google Drive ↗
                                    </a>
                                </div>
                                <div class="admin-input-group" style="margin:0 0 0.35rem 0">
                                    <label for="input-drive-link" style="font-size:0.78rem;margin-bottom:0.3rem">رابط مشاركة الصورة من Google Drive (أو معرّف الملف File ID):</label>
                                    <input type="text" id="input-drive-link" class="admin-input" placeholder="الصق رابط مشاركة الصورة من Google Drive أو معرّفها..." dir="ltr">
                                </div>
                                <div id="drive-link-status" style="display:none;margin-top:0.45rem;font-size:0.75rem;padding:0.35rem 0.65rem;border-radius:6px"></div>
                                <div style="font-size:0.72rem;color:var(--text-muted);line-height:1.5;margin-top:0.4rem">
                                    <i class="fa-solid fa-circle-info" style="color:var(--accent-gold)"></i> 
                                    ارفع صورتك في المجلد، ثم اضغط (مشاركة ➔ نسخ الرابط) والصقه هنا. يتم قياس الأبعاد وبثها بدقة 4K أصلية بدون حفظ Base64 في قاعدة البيانات.
                                </div>
                            </div>

                            <div style="text-align:center;margin:0.5rem 0;font-size:0.72rem;color:var(--text-muted)">
                                ── أو اختر صورة من جهازك ──
                            </div>

                            <!-- Smart Dropzone -->
                            <div class="publisher-dropzone" id="publisher-dropzone">
                                <input type="file" id="publisher-file-input" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="display:none">
                                <i class="fa-solid fa-cloud-arrow-up dropzone-icon"></i>
                                <div class="dropzone-title">اسحب وأفلت الصورة هنا، أو اضغط للاختيار</div>
                                <div class="dropzone-sub">يدعم صور PNG, JPG, WEBP — استكشاف فوري لأبعاد الصورة ونسبتها</div>
                                <div class="dropzone-specs">
                                    <span class="dropzone-spec-pill"><i class="fa-solid fa-expand"></i> جميع الأبعاد (طولية / عريضة / مربعة)</span>
                                    <span class="dropzone-spec-pill"><i class="fa-solid fa-bolt"></i> معالجة فائقة النقاء</span>
                                </div>
                            </div>

                            <!-- Image Meta Detected Banner -->
                            <div class="image-meta-banner" id="image-meta-banner" style="display:none">
                                <div class="image-meta-info">
                                    <span class="aspect-badge" id="detected-aspect-badge">النسبة: 16:9</span>
                                    <span class="res-badge" id="detected-res-badge">2400 × 1350 Px</span>
                                    <span style="font-size:0.75rem;color:var(--accent-gold);font-weight:600" id="detected-size-badge">أفقي</span>
                                </div>
                                <button type="button" class="ozeum-mini-pill-btn" style="padding:0.25rem 0.6rem;font-size:0.7rem" onclick="document.getElementById('publisher-file-input').click()">
                                    <i class="fa-solid fa-repeat"></i> تغيير
                                </button>
                            </div>

                            <!-- Titles Row -->
                            <div class="admin-form-grid">
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
                                    <span>تمييز في الواجهة</span>
                                </label>
                            </div>

                            <!-- Action Buttons -->
                            <div style="display:flex;gap:0.75rem;align-items:center;margin-top:0.6rem">
                                <button type="submit" id="publisher-submit-btn" class="admin-btn-primary" style="flex:1;padding:0.75rem;font-size:0.92rem;justify-content:center">
                                    <i class="fa-solid fa-cloud-arrow-up"></i> <span>نشر العمل</span>
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
        checkSyncStatus();
    }

    // ── Authentication Handlers with Firebase AKey (Primary & Direct) ──
    async function handleLogin(enteredPin) {
        const pin = String(enteredPin || '').trim();
        if (!pin) {
            showAdminToast('يرجى إدخال رمز الدخول (AKey)', false);
            return;
        }

        let isAuthorized = false;

        // 1. PRIMARY: Direct authoritative check against Firebase Realtime Database AKey.json
        try {
            const directRes = await fetch('https://aj-gallery-2026-default-rtdb.firebaseio.com/AKey.json');
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
            showAdminToast('رمز الدخول (AKey) غير مصرح به', false);
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
            const res = await fetch('https://aj-gallery-2026-default-rtdb.firebaseio.com/AKey.json', {
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

        // 3. Backend update sync
        try {
            await fetch('/api/admin/update-pin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SEC_KEY}`
                },
                body: JSON.stringify({ newPin: clean })
            });
        } catch (_) {}

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
            AdminState.currentImageUrl = dataUrl;

            const img = new Image();
            img.onload = () => {
                const nw = img.naturalWidth;
                const nh = img.naturalHeight;
                const dim = calculateArtworkDimensions(nw, nh);
                const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
                dim.size = file.size;

                applyDetectedDimensions(dim, `${sizeMb} MB`);

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

                showAdminToast(`تم قياس أبعاد العمل: ${nw}×${nh} بكسل (${dim.orientation} · نسبة ${dim.aspectRatio})`);
            };
            img.src = dataUrl;
        };

        reader.readAsDataURL(file);
    }

    // ── Universal Smart Image Link Processor (Specialized Google Drive Integration) ──
    function processImageLink(inputVal) {
        if (!inputVal || typeof inputVal !== 'string') return;
        const trimmed = inputVal.trim();
        if (!trimmed) return;

        let streamUrl = trimmed;
        let driveId = null;
        const statusEl = document.getElementById('drive-link-status');

        // Automatically resolve Google Drive links (URL or raw File ID)
        if (trimmed.includes('drive.google.com') || trimmed.includes('/d/') || /^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)) {
            driveId = (window.AJGateway && window.AJGateway.extractDriveId) ? window.AJGateway.extractDriveId(trimmed) : (trimmed.match(/([a-zA-Z0-9_-]{25,50})/) ? trimmed.match(/([a-zA-Z0-9_-]{25,50})/)[1] : null);
            if (driveId) {
                streamUrl = `https://lh3.googleusercontent.com/d/${driveId}`;
                AdminState.currentDriveFileId = driveId;
                if (statusEl) {
                    statusEl.style.display = 'block';
                    statusEl.style.background = 'rgba(16, 185, 129, 0.12)';
                    statusEl.style.color = '#10b981';
                    statusEl.style.border = '1px solid rgba(16, 185, 129, 0.3)';
                    statusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> متصل بـ Google Drive · معرّف الملف: <code style="direction:ltr;background:rgba(0,0,0,0.3);padding:1px 4px;border-radius:3px">${driveId}</code>`;
                }
            }
        } else {
            AdminState.currentDriveFileId = null;
            if (statusEl) statusEl.style.display = 'none';
        }

        AdminState.currentFile = null;
        AdminState.currentFileDataUrl = null;
        AdminState.currentImageUrl = streamUrl;

        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            const nw = img.naturalWidth;
            const nh = img.naturalHeight;
            const dim = calculateArtworkDimensions(nw, nh);

            applyDetectedDimensions(dim, driveId ? 'Google Drive' : 'رابط مباشر');

            const liveCv = document.getElementById('live-preview-canvas');
            const placeholder = document.getElementById('preview-placeholder');
            if (placeholder) placeholder.style.display = 'none';
            if (liveCv) {
                liveCv.style.display = 'block';
                if (window.Img2Preview) {
                    Img2Preview.paint(liveCv, streamUrl, { autoHeight: true, watermark: true });
                }
            }

            showAdminToast(`تم ربط الصورة بنجاح: ${nw}×${nh} (${dim.orientation} · نسبة ${dim.aspectRatio})`);
        };

        img.onerror = () => {
            // Google Drive Fallback: Try high-resolution thumbnail stream
            if (driveId) {
                const thumbUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w2000`;
                const imgThumb = new Image();
                imgThumb.onload = () => {
                    const nw = imgThumb.naturalWidth;
                    const nh = imgThumb.naturalHeight;
                    const dim = calculateArtworkDimensions(nw, nh);
                    applyDetectedDimensions(dim, 'Google Drive (HD)');
                    AdminState.currentImageUrl = thumbUrl;

                    const liveCv = document.getElementById('live-preview-canvas');
                    const placeholder = document.getElementById('preview-placeholder');
                    if (placeholder) placeholder.style.display = 'none';
                    if (liveCv && window.Img2Preview) {
                        liveCv.style.display = 'block';
                        Img2Preview.paint(liveCv, thumbUrl, { autoHeight: true, watermark: true });
                    }
                    showAdminToast(`تم ربط الصورة بنجاح من Google Drive (${dim.orientation})`);
                };
                imgThumb.onerror = () => {
                    const imgFallback = new Image();
                    imgFallback.onload = () => {
                        const nw = imgFallback.naturalWidth;
                        const nh = imgFallback.naturalHeight;
                        const dim = calculateArtworkDimensions(nw, nh);
                        applyDetectedDimensions(dim, 'رابط مباشر');
                        const liveCv = document.getElementById('live-preview-canvas');
                        const placeholder = document.getElementById('preview-placeholder');
                        if (placeholder) placeholder.style.display = 'none';
                        if (liveCv && window.Img2Preview) {
                            liveCv.style.display = 'block';
                            Img2Preview.paint(liveCv, streamUrl, { autoHeight: true, watermark: true });
                        }
                    };
                    imgFallback.onerror = () => {
                        if (statusEl && driveId) {
                            statusEl.style.display = 'block';
                            statusEl.style.background = 'rgba(239, 68, 68, 0.12)';
                            statusEl.style.color = '#f87171';
                            statusEl.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                            statusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> يرجى التأكد من تفعيل إذن المشاركة للصورة: (أي شخص لديه الرابط يمكنه العرض Anyone with the link)`;
                        }
                        showAdminToast('تأكد من تفعيل إذن المشاركة للصورة في Google Drive (أي شخص لديه الرابط)', false);
                    };
                    imgFallback.src = streamUrl;
                };
                imgThumb.src = thumbUrl;
            } else {
                const imgFallback = new Image();
                imgFallback.onload = () => {
                    const nw = imgFallback.naturalWidth;
                    const nh = imgFallback.naturalHeight;
                    const dim = calculateArtworkDimensions(nw, nh);
                    applyDetectedDimensions(dim, 'رابط مباشر');
                    const liveCv = document.getElementById('live-preview-canvas');
                    const placeholder = document.getElementById('preview-placeholder');
                    if (placeholder) placeholder.style.display = 'none';
                    if (liveCv && window.Img2Preview) {
                        liveCv.style.display = 'block';
                        Img2Preview.paint(liveCv, streamUrl, { autoHeight: true, watermark: true });
                    }
                    showAdminToast(`تم قياس أبعاد العمل: ${dim.orientation} · نسبة ${dim.aspectRatio}`);
                };
                imgFallback.onerror = () => {
                    showAdminToast('تعذر تحميل الصورة من هذا الرابط — تأكد من صحته وإمكانية الوصول إليه', false);
                };
                imgFallback.src = streamUrl;
            }
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

            const orient = work.orientation || (work.aspectRatio ? (parseFloat(work.aspectRatio) > 1.15 ? 'أفقي' : (parseFloat(work.aspectRatio) < 0.88 ? 'عمودي' : 'مربع')) : '');
            const icon = (orient.includes('عمودي') || orient.includes('طولي')) ? 'arrows-up-down' : ((orient.includes('أفقي') || orient.includes('عريض')) ? 'arrows-left-right' : 'vector-square');
            const orientBadge = orient ? `<span class="artwork-ratio-pill" style="font-size:0.6rem;padding:0.1rem 0.4rem"><i class="fa-solid fa-${icon}"></i> ${orient} ${work.aspectRatio ? '· ' + work.aspectRatio : ''}</span>` : (work.aspectRatio ? `<span class="artwork-ratio-pill" style="font-size:0.6rem;padding:0.1rem 0.4rem">${work.aspectRatio}</span>` : '');

            card.innerHTML = `
                <div class="mini-work-thumb">
                    <canvas class="mini-cv" data-work-idx="${workId}"></canvas>
                </div>
                <div class="mini-work-meta">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:0.35rem">
                        <h5 style="margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(work.title || 'بدون عنوان')}</h5>
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
        AdminState.currentImageUrl = null;
        AdminState.currentDriveFileId = null;
        AdminState.currentDimensions = null;

        const statusEl = document.getElementById('drive-link-status');
        if (statusEl) {
            statusEl.style.display = 'none';
            statusEl.innerHTML = '';
        }

        const linkIn = document.getElementById('input-drive-link');
        if (linkIn) linkIn.value = '';

        const formTitle = document.getElementById('publisher-form-title');
        if (formTitle) formTitle.innerHTML = '<i class="fa-solid fa-circle-plus"></i> نشر عمل فني جديد';

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

    // ── Start Editing Artwork (Smart Auto-Population) ──
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

        const linkIn = document.getElementById('input-drive-link');
        const statusEl = document.getElementById('drive-link-status');

        if (work.driveFileId) {
            AdminState.currentDriveFileId = work.driveFileId;
            if (linkIn) linkIn.value = `https://drive.google.com/file/d/${work.driveFileId}/view?usp=sharing`;
            if (statusEl) {
                statusEl.style.display = 'block';
                statusEl.style.background = 'rgba(16, 185, 129, 0.12)';
                statusEl.style.color = '#10b981';
                statusEl.style.border = '1px solid rgba(16, 185, 129, 0.3)';
                statusEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> متصل بـ Google Drive · معرّف الملف: <code style="direction:ltr;background:rgba(0,0,0,0.3);padding:1px 4px;border-radius:3px">${work.driveFileId}</code>`;
            }
        } else if (work.imageSrc) {
            if (linkIn) linkIn.value = work.imageSrc;
            if (statusEl) statusEl.style.display = 'none';
        }

        AdminState.currentImageUrl = work.imageSrc || null;

        // Auto-detect or restore dimensions
        if (work.width && work.height) {
            const dim = calculateArtworkDimensions(work.width, work.height);
            if (work.aspectRatio) dim.aspectRatio = work.aspectRatio;
            if (work.orientation) dim.orientation = work.orientation;
            applyDetectedDimensions(dim, work.driveFileId ? 'Google Drive' : 'العمل الحالي');
        } else if (work.aspectRatio) {
            const banner = document.getElementById('image-meta-banner');
            const aspectBadge = document.getElementById('detected-aspect-badge');
            if (banner) banner.style.display = 'flex';
            if (aspectBadge) aspectBadge.innerText = `${work.orientation || ''} · نسبة ${work.aspectRatio}`;
        }

        const formTitle = document.getElementById('publisher-form-title');
        if (formTitle) formTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> تعديل بيانات: ${escapeHtml(work.title)}`;

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
        const isEditing = AdminState.editingWorkId !== null;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${isEditing ? 'جاري حفظ التعديلات...' : 'جاري نشر العمل...'}`;
        }

        try {
            let uploadedUrl = null;

            // 1. If user selected a local file, upload or use data URL
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
                    }
                } catch (upErr) {
                    console.warn('[Upload Info]', upErr);
                }
            }

            // Find current work if editing to preserve unchanged media
            const existingWork = isEditing ? (AdminState.artworks.find(w => String(w._firebaseKey) === String(AdminState.editingWorkId) || String(w.id) === String(AdminState.editingWorkId)) || {}) : {};

            // 2. Prepare Clean Artwork Record
            const workRecord = {
                title: formData.title.trim().slice(0, 140),
                titleEn: (formData.titleEn || '').trim().slice(0, 140),
                category: formData.category.trim().slice(0, 70),
                description: (formData.description || '').trim().slice(0, 700),
                isPublished: Boolean(formData.isPublished),
                isHeroFeatured: Boolean(formData.isHeroFeatured),
                createdAt: existingWork.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Image Source Resolution — Strict Protection Against Storing Raw Base64
            if (uploadedUrl) {
                workRecord.imageSrc = uploadedUrl;
            } else if (AdminState.currentImageUrl && !AdminState.currentImageUrl.startsWith('data:')) {
                workRecord.imageSrc = AdminState.currentImageUrl;
            } else if (AdminState.currentDriveFileId) {
                workRecord.imageSrc = `https://lh3.googleusercontent.com/d/${AdminState.currentDriveFileId}`;
            } else if (existingWork.imageSrc && !existingWork.imageSrc.startsWith('data:')) {
                workRecord.imageSrc = existingWork.imageSrc;
            } else {
                showAdminToast('يرجى لصق رابط الصورة من Google Drive أو رفعها للمجلد لتجنب تخزين نصوص Base64', false);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = isEditing ? 'حفظ التعديلات' : '<i class="fa-solid fa-cloud-arrow-up"></i> <span>نشر العمل في المعرض</span>';
                }
                return;
            }

            if (AdminState.currentDriveFileId) {
                workRecord.driveFileId = AdminState.currentDriveFileId;
            } else if (existingWork.driveFileId) {
                workRecord.driveFileId = existingWork.driveFileId;
            }

            // Preserve or initialize likes and views
            workRecord.likesCount = typeof existingWork.likesCount === 'number' ? existingWork.likesCount : 0;
            workRecord.viewsCount = typeof existingWork.viewsCount === 'number' ? existingWork.viewsCount : 0;

            // Dimensions & Orientation Resolution
            if (AdminState.currentDimensions) {
                workRecord.width = AdminState.currentDimensions.width;
                workRecord.height = AdminState.currentDimensions.height;
                workRecord.aspectRatio = AdminState.currentDimensions.aspectRatio;
                workRecord.orientation = AdminState.currentDimensions.orientation;
            } else if (existingWork.aspectRatio) {
                workRecord.width = existingWork.width || null;
                workRecord.height = existingWork.height || null;
                workRecord.aspectRatio = existingWork.aspectRatio;
                workRecord.orientation = existingWork.orientation || 'أفقي';
            } else {
                workRecord.aspectRatio = '16:9';
                workRecord.orientation = 'أفقي';
            }

            if (isEditing) {
                const targetKey = AdminState.editingWorkId;
                workRecord.id = existingWork.id || ('work-' + (parseInt(targetKey, 10) + 1));
                if (db) {
                    await db.ref(`artworks/${targetKey}`).update(workRecord);
                } else {
                    await fetch(`https://aj-gallery-2026-default-rtdb.firebaseio.com/artworks/${targetKey}.json`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(workRecord)
                    });
                }
                showAdminToast('تم حفظ تعديلات العمل بنجاح');
            } else {
                const nextIndex = AdminState.artworks.length;
                workRecord.id = 'work-' + (nextIndex + 1);
                if (db) {
                    await db.ref(`artworks/${nextIndex}`).set(workRecord);
                } else {
                    await fetch(`https://aj-gallery-2026-default-rtdb.firebaseio.com/artworks/${nextIndex}.json`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(workRecord)
                    });
                }
                showAdminToast('تم نشر العمل الفني بنجاح في المعرض!');
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

    // ── Smart Delete Artwork with Contiguous Re-indexing & Resilient Fallback ──
    async function deleteWork(workId) {
        const index = AdminState.artworks.findIndex(w => String(w._firebaseKey) === String(workId) || String(w.id) === String(workId));
        const work = index !== -1 ? AdminState.artworks[index] : null;
        const title = work ? `"${work.title}"` : 'هذا العمل';

        if (!confirm(`هل أنت متأكد من حذف العمل الفني ${title} نهائياً من المعرض؟`)) return;

        const remaining = AdminState.artworks.filter((_, idx) => idx !== index && String(_.id) !== String(workId) && String(_._firebaseKey) !== String(workId));
        
        const reindexed = remaining.map((item, idx) => {
            const clean = { ...item };
            delete clean._firebaseKey;
            clean.id = 'work-' + (idx + 1);
            return clean;
        });

        try {
            if (reindexed.length === 0) {
                if (db) {
                    await db.ref('artworks').remove();
                } else {
                    await fetch('https://aj-gallery-2026-default-rtdb.firebaseio.com/artworks.json', { method: 'DELETE' });
                }
                AdminState.artworks = [];
            } else {
                if (db) {
                    await db.ref('artworks').set(reindexed);
                } else {
                    await fetch('https://aj-gallery-2026-default-rtdb.firebaseio.com/artworks.json', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(reindexed)
                    });
                }
                AdminState.artworks = reindexed;
            }

            renderPublishedWorksGrid();
            window.dispatchEvent(new CustomEvent('aj-artworks-updated', { detail: AdminState.artworks }));
            showAdminToast('تم حذف العمل الفني وإعادة ترتيب المعرض بنجاح');
            if (String(AdminState.editingWorkId) === String(workId)) {
                resetArtworkForm();
            }
        } catch (err) {
            console.error('[Delete Error - Trying REST Fallback]', err);
            try {
                const rtdbUrl = 'https://aj-gallery-2026-default-rtdb.firebaseio.com/artworks.json';
                if (reindexed.length === 0) {
                    await fetch(rtdbUrl, { method: 'DELETE' });
                } else {
                    await fetch(rtdbUrl, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(reindexed)
                    });
                }
                AdminState.artworks = reindexed;
                renderPublishedWorksGrid();
                window.dispatchEvent(new CustomEvent('aj-artworks-updated', { detail: AdminState.artworks }));
                showAdminToast('تم حذف العمل الفني بنجاح');
                if (String(AdminState.editingWorkId) === String(workId)) {
                    resetArtworkForm();
                }
            } catch (fallbackErr) {
                console.error('[Delete Fallback Error]', fallbackErr);
                showAdminToast('تعذر الحذف: ' + err.message, false);
            }
        }
    }

    // ── Toggle Hero Featured ──
    async function toggleHeroFeatured(workId) {
        const work = AdminState.artworks.find(w => String(w._firebaseKey) === String(workId) || String(w.id) === String(workId)) || AdminState.artworks[workId];
        if (!work) return;

        const newHeroState = !(work.isHeroFeatured === true);
        const targetKey = work._firebaseKey !== undefined ? work._firebaseKey : workId;

        try {
            if (db) {
                await db.ref(`artworks/${targetKey}`).update({
                    isHeroFeatured: newHeroState
                });
            } else {
                await fetch(`https://aj-gallery-2026-default-rtdb.firebaseio.com/artworks/${targetKey}.json`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isHeroFeatured: newHeroState })
                });
            }
            work.isHeroFeatured = newHeroState;
            renderPublishedWorksGrid();
            window.dispatchEvent(new CustomEvent('aj-artworks-updated', { detail: AdminState.artworks }));
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

        // Image Link input listener
        const imageLinkInput = document.getElementById('input-drive-link');
        if (imageLinkInput) {
            let linkTimer = null;
            const onLinkChange = () => {
                clearTimeout(linkTimer);
                linkTimer = setTimeout(() => {
                    const val = imageLinkInput.value.trim();
                    if (val) processImageLink(val);
                }, 350);
            };
            imageLinkInput.addEventListener('input', onLinkChange);
            imageLinkInput.addEventListener('paste', () => setTimeout(onLinkChange, 40));
            imageLinkInput.addEventListener('change', onLinkChange);
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
                    imageIdx: document.getElementById('input-work-img-idx') ? document.getElementById('input-work-img-idx').value : '',
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
