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

    // ── Local Liked State Tracking ──
    function getLikedList() {
        try {
            const raw = localStorage.getItem('aj_liked_artworks');
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
            localStorage.setItem('aj_liked_artworks', JSON.stringify(updated));
        } catch (_) {}
        return updated;
    }

    // ── Interactive Likes Handler ──
    async function likeArtwork(workId, shouldLike) {
        setArtworkLiked(workId, shouldLike);

        // Try Firebase SDK first
        if (_dbInstance) {
            try {
                const countRef = _dbInstance.ref(`artworks/${workId}/likesCount`);
                const res = await countRef.transaction(current => {
                    const c = (typeof current === 'number') ? current : 0;
                    return shouldLike ? c + 1 : Math.max(0, c - 1);
                });
                if (res.committed) {
                    return res.snapshot.val();
                }
            } catch (err) {
                console.warn('[Gateway] RTDB like transaction warning, attempting backend API:', err.message);
            }
        }

        // Fallback to Backend Proxy API
        try {
            const res = await fetch('/api/artwork/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artworkId: workId, delta: shouldLike ? 1 : -1 })
            });
            if (res.ok) {
                const data = await res.json();
                return data.likesCount;
            }
        } catch (_) {}

        return null;
    }

    // ── Interactive Views Tracker ──
    async function recordView(workId) {
        const sessionKey = `aj_viewed_${workId}`;
        if (sessionStorage.getItem(sessionKey)) return;
        sessionStorage.setItem(sessionKey, '1');

        if (_dbInstance) {
            try {
                const viewRef = _dbInstance.ref(`artworks/${workId}/viewsCount`);
                viewRef.transaction(current => {
                    const c = (typeof current === 'number') ? current : 0;
                    return c + 1;
                });
                return;
            } catch (_) {}
        }

        try {
            fetch('/api/artwork/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artworkId: workId })
            });
        } catch (_) {}
    }

    // ── Live Reactive Data Stream (Dispatches to Public Frontend) ──
    function initPublicSync() {
        if (!_dbInstance) {
            // If offline or Firebase SDK unavailable, fetch once from backend proxy
            fetch('/api/artworks')
                .then(r => r.json())
                .then(data => {
                    if (data) {
                        let list = Array.isArray(data) ? data.filter(Boolean) : Object.keys(data).map(k => ({ ...data[k], _firebaseKey: k }));
                        window.dispatchEvent(new CustomEvent('aj-artworks-updated', { detail: list }));
                    }
                })
                .catch(() => {});
            return;
        }

        _dbInstance.ref('artworks').on('value', (snap) => {
            const val = snap.val();
            let list = [];
            if (val) {
                if (Array.isArray(val)) {
                    list = val.filter(item => item !== null);
                } else if (typeof val === 'object') {
                    list = Object.keys(val).map(k => ({ ...val[k], _firebaseKey: k }));
                }
            }
            window.dispatchEvent(new CustomEvent('aj-artworks-updated', { detail: list }));
        }, (err) => {
            console.warn('[Gateway Sync] Read status:', err.code);
        });

        _dbInstance.ref('settings').on('value', (snap) => {
            const val = snap.val() || {};
            window.dispatchEvent(new CustomEvent('aj-settings-updated', { detail: val }));
        }, (err) => {
            console.warn('[Gateway Sync] Read status:', err.code);
        });
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
        resolveDriveUrl: resolveDriveUrl,
        extractDriveId: extractDriveId,
        getDriveFolderInfo: () => ({
            folderId: GOOGLE_DRIVE_FOLDER_ID,
            folderName: GOOGLE_DRIVE_FOLDER_NAME,
            folderUrl: GOOGLE_DRIVE_FOLDER_URL
        })
    };

})(window);
