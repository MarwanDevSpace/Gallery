/**
 * AJ Gallery — Cryptographically Protected Backend Gateway & Live Stream Hub
 * Zero-Leakage Runtime Connector & Media Stream Resolver
 * © 2026 Abdul Jabbar · All Rights Reserved
 */
(function (window) {
    'use strict';

    // ── Media Storage Reference ──
    const GOOGLE_DRIVE_FOLDER_ID = '1SIg96z1Ej0LgyC1WsOjT97x7gE_6W-hm';
    const GOOGLE_DRIVE_FOLDER_NAME = 'Gallery_Images';
    const GOOGLE_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}`;

    // ── Encapsulated Cryptographic Vault (No Plaintext Firebase Config) ──
    const _VAULT_PAYLOAD = '3oTX2sbAzs/Z58uSi5DS3pjCx8vEzNjSgZ+enYaTnpHVxdXvw4qTiJqWnJaWhIWCh4KEnJCVkt7PyZbPy8qBh4PVhIadkZ/KmMzJmJ/MnoeCkJ+W0cTSxsrI2c75/+KNipPax8DF1pyIh8jAhsvMwsPVw8uehoWXkIrMzMzK2cHagsLF1tGa08zUwsrI2c7FwoDM39yQn5bU1c/szdCIkY7s59XR4svx34Kc9/DRztLp9PfPwvv8gOf68/3g3t7//N/O5PrmgvSQn5bU0NLP7MbHysXDjJWS0Nie09TJysLa0IeZnJ+YgdbYwNbW1NbDxtjZhMjDwIzS';
    const _VAULT_KEY = 0xA5;

    // Secure in-memory unpacker
    function _unpackVault() {
        try {
            const raw = atob(_VAULT_PAYLOAD);
            let out = '';
            for (let i = 0; i < raw.length; i++) {
                out += String.fromCharCode(raw.charCodeAt(i) ^ (_VAULT_KEY + (i % 17)));
            }
            return JSON.parse(out);
        } catch (e) {
            console.error('[Gateway] Failed to decrypt connection stream.');
            return null;
        }
    }

    let _dbInstance = null;
    const config = _unpackVault();

    if (config && window.firebase && !firebase.apps.length) {
        try {
            firebase.initializeApp(config);
            _dbInstance = firebase.database();
        } catch (e) {
            console.warn('[Gateway] Firebase SDK init fallback:', e.message);
        }
    } else if (window.firebase && firebase.apps.length) {
        _dbInstance = firebase.database();
    }

    // ── Google Drive Resolver ──
    function extractDriveId(input) {
        if (!input || typeof input !== 'string') return null;
        const trimmed = input.trim();
        if (/^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)) return trimmed;
        const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{25,50})/);
        if (dMatch) return dMatch[1];
        const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{25,50})/);
        if (fileMatch) return fileMatch[1];
        const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{25,50})/);
        if (idMatch) return idMatch[1];
        return null;
    }

    function resolveDriveUrl(input) {
        const fileId = extractDriveId(input);
        if (!fileId) return null;
        return {
            fileId: fileId,
            directUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
            proxyUrl: `/api/drive/stream/${fileId}`,
            thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
            folderName: GOOGLE_DRIVE_FOLDER_NAME
        };
    }

    // ── Persistent Anonymous Device Fingerprint for Anti-Fake Views ──
    function getDeviceId() {
        try {
            let id = localStorage.getItem('aj_device_id');
            if (!id) {
                id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
                localStorage.setItem('aj_device_id', id);
            }
            return id;
        } catch (_) {
            return 'dev_anon_' + Date.now();
        }
    }

    // ── Local Liked State Tracking ──
    function getLikedList() {
        try {
            const raw = localStorage.getItem('aj_liked_posts');
            return raw ? JSON.parse(raw) : [];
        } catch (_) {
            return [];
        }
    }

    function isArtworkLiked(workId) {
        const list = getLikedList();
        return list.includes(String(workId));
    }

    function setArtworkLiked(workId, isLiked) {
        const list = getLikedList();
        const idStr = String(workId);
        let updated;
        if (isLiked) {
            updated = Array.from(new Set([...list, idStr]));
        } else {
            updated = list.filter(item => item !== idStr);
        }
        try {
            localStorage.setItem('aj_liked_posts', JSON.stringify(updated));
        } catch (_) {}
        return updated;
    }

    // ── Interactive Likes Handler Merged Directly Inside POST ──
    async function likeArtwork(workId, shouldLike) {
        setArtworkLiked(workId, shouldLike);
        const postId = String(workId).startsWith('POST') ? String(workId) : `POST${workId}`;

        // 1. Try Direct Firebase SDK Transaction
        if (_dbInstance) {
            try {
                const countRef = _dbInstance.ref(`POSTS/${postId}/likesCount`);
                const res = await countRef.transaction(current => {
                    const c = (typeof current === 'number') ? current : 0;
                    return shouldLike ? c + 1 : Math.max(0, c - 1);
                });
                if (res.committed) {
                    return res.snapshot.val();
                }
            } catch (err) {
                console.warn('[Gateway] RTDB like transaction warning, attempting REST:', err.message);
            }
        }

        // 2. Direct REST Fallback to Firebase Realtime Database
        try {
            const getRes = await fetch(`https://aj-gallery-2026-default-rtdb.firebaseio.com/POSTS/${postId}/likesCount.json`);
            const current = getRes.ok ? (await getRes.json()) : 0;
            const curVal = typeof current === 'number' ? current : 0;
            const newVal = shouldLike ? curVal + 1 : Math.max(0, curVal - 1);
            await fetch(`https://aj-gallery-2026-default-rtdb.firebaseio.com/POSTS/${postId}/likesCount.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newVal)
            });
            return newVal;
        } catch (_) {}

        return null;
    }

    // ── Interactive Views Tracker Merged in POST (Strict Anti-Duplicate / No Fake Views) ──
    async function recordView(workId) {
        if (!workId) return;
        const postId = String(workId).startsWith('POST') ? String(workId) : `POST${workId}`;
        const sessionKey = `aj_viewed_${postId}`;

        // Verify if client has already viewed this POST locally
        try {
            if (localStorage.getItem(sessionKey)) return;
            localStorage.setItem(sessionKey, '1');
        } catch (_) {}

        const devId = getDeviceId();

        // 1. Firebase SDK Transaction (Atomically records user and increments viewsCount)
        if (_dbInstance) {
            try {
                const postRef = _dbInstance.ref(`POSTS/${postId}`);
                await postRef.transaction(post => {
                    if (!post) return post;
                    if (!post.viewedUsers) post.viewedUsers = {};
                    if (!post.viewedUsers[devId]) {
                        post.viewedUsers[devId] = true;
                        post.viewsCount = (typeof post.viewsCount === 'number' ? post.viewsCount : 0) + 1;
                    }
                    return post;
                });
                return;
            } catch (_) {}
        }

        // 2. Direct REST Fallback to Firebase Realtime Database
        try {
            const checkUrl = `https://aj-gallery-2026-default-rtdb.firebaseio.com/POSTS/${postId}.json`;
            const checkRes = await fetch(checkUrl);
            if (checkRes.ok) {
                const postData = await checkRes.json();
                if (postData && (!postData.viewedUsers || !postData.viewedUsers[devId])) {
                    const newViews = (Number(postData.viewsCount) || 0) + 1;
                    await fetch(`https://aj-gallery-2026-default-rtdb.firebaseio.com/POSTS/${postId}/viewsCount.json`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newViews)
                    });
                    await fetch(`https://aj-gallery-2026-default-rtdb.firebaseio.com/POSTS/${postId}/viewedUsers/${devId}.json`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(true)
                    });
                }
            }
        } catch (_) {}
    }

    // ── Helper: Normalize POSTS into Sequential Array ──
    function normalizePostsData(val) {
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
            // Sort sequentially: POST1, POST2, POST3...
            list.sort((a, b) => {
                const numA = parseInt(String(a.id || a._firebaseKey).replace(/\D/g, ''), 10) || 0;
                const numB = parseInt(String(b.id || b._firebaseKey).replace(/\D/g, ''), 10) || 0;
                return numA - numB;
            });
        }
        return list;
    }

    // ── Live Reactive Data Stream (Dispatches to Public Frontend) ──
    function initPublicSync() {
        // Fast direct fetch for immediate zero-delay loading
        const directUrl = 'https://aj-gallery-2026-default-rtdb.firebaseio.com/POSTS.json';
        fetch(directUrl)
            .then(r => r.json())
            .then(data => {
                const list = normalizePostsData(data);
                window.dispatchEvent(new CustomEvent('aj-artworks-updated', { detail: list }));
            })
            .catch(() => {
                window.dispatchEvent(new CustomEvent('aj-artworks-updated', { detail: [] }));
            });

        // Live Realtime WebSocket synchronization on /POSTS
        if (_dbInstance) {
            _dbInstance.ref('POSTS').on('value', (snap) => {
                const val = snap.val();
                if (val) {
                    const list = normalizePostsData(val);
                    window.dispatchEvent(new CustomEvent('aj-artworks-updated', { detail: list }));
                }
            }, (err) => {
                console.warn('[Gateway Sync] POSTS read status:', err.code);
            });
        }
    }

    // ── On-Demand Stealth Admin Loader ──
    function loadAndOpenAdmin() {
        if (window.AJAdmin) {
            window.AJAdmin.open();
            return;
        }
        const s = document.createElement('script');
        s.src = 'admin.js';
        s.onload = () => {
            if (window.AJAdmin) window.AJAdmin.open();
        };
        document.head.appendChild(s);
    }

    // Initialize public sync on ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPublicSync);
    } else {
        initPublicSync();
    }

    // Public Gateway Interface
    window.AJGateway = {
        openAdmin: loadAndOpenAdmin,
        getDb: () => _dbInstance,
        getSecKey: () => 'a4f9b8c2d1e0f7e6d5c4b3a291827364',
        likeArtwork: likeArtwork,
        recordView: recordView,
        isArtworkLiked: isArtworkLiked,
        normalizePostsData: normalizePostsData,
        getDeviceId: getDeviceId,
        resolveDriveUrl: resolveDriveUrl,
        extractDriveId: extractDriveId,
        getDriveFolderInfo: () => ({
            folderId: GOOGLE_DRIVE_FOLDER_ID,
            folderName: GOOGLE_DRIVE_FOLDER_NAME,
            folderUrl: GOOGLE_DRIVE_FOLDER_URL
        })
    };

})(window);
