/**
 * img2Preview v3.0 — AES-GCM Enterprise Cryptographic Canvas Engine
 * Advanced Zero-Exposure Pixel Protection & Memory Sandbox
 * © 2026 Abdul Jabbar Studio · All Rights Reserved
 */
(function (window) {
    'use strict';

    // ── Cryptographic Vault: AES-256-GCM Encrypted Payloads ──
    const _VAULT_CONFIG = {
        algorithm: 'AES-256-GCM',
        kdf: 'PBKDF2-SHA256',
        iterations: 120000,
        salt: 'YezZ+U7sByvBVODlEjNVKg==',
        passphrase: 'AbdulJabbar@Gallery#2026.AES_GCM_Vault',
        vault: [
            {
                id: 0,
                iv: "sSZCuGhvjHlvEIZN",
                tag: "ipcm0ylE3Gf3zHAsdt8gGQ==",
                cipher: "bS3QgIantbSTIKVuOXmBdToNkwlNZbtPIiV6H8lcp8FltWINMNJ7AoZkmMddGKENWeKsTkpaTElf7K/s8ysNUubz2d1x8ihUrXBc7CzxitLUdrgFvP5wKwZUyNeQwuqAhm5ijX7+iT28ajPLx04NBdTWvHpUXjX+YohIXPMcfOTy7JRZmf1tloogX0fLshsyz1EPbMSAgCzqd5i5H6Lj9GsOmTmX2e9KH8qJ99eAvzpM838KCu3zx4QMv+IQGHIExl2If37XRVdOGLGrAzqLgQ=="
            },
            {
                id: 1,
                iv: "9VKGW//MGhnr8jb1",
                tag: "FcYNDgBct0S8V7XfH+qv/A==",
                cipher: "gKbjHVh2WzTMu8rN6yyszVlytsd2SZbfKpwulkkZwukAwpTt9hiNf+E2l3EuICEP7A45ylQMvMd/XbBvh+FTl88CuppeZzvNYHlbkFH2wGV66HGuiuqyudblLyxe46RbXleGfXdciSkYffJljOBHfr4JjdMosVX+hH28ynaVunuyPtONgNSSfkuevtyoV3Yg0QarVk7RE+55JD7z49+QNYb1hgtYGe1xk+n4XfaqAtFCg8czpW5TJOgBpwQtVBEfCJB+TpiHMEL/mQ=="
            },
            {
                id: 2,
                iv: "9wex66C8uSvdE+xg",
                tag: "akTFHaxtiE2pSuUvH5OQiA==",
                cipher: "Ytw8W9nt8iXnDi3XuBdV136u5vNKmgTbJr/Ay+T5eHteR1XeTSSmgovQwupkTkVW9s8ZPyYPmubQBCogoQi/l2EMs3GiuMsGzyvGWSZbaGIOXQx0Edv7hYyyT7awCLIXGkuzF7kXUrBCw9HDY6Ov8hOF2dxy185L/h8+UgZ2JOIN4Q6W+9LSnxBpm6tUDvAl8h51J0Ow8j8FLBEDy63oQE9+zsO9aDLrqqNsn44p5KRW9Lzlpd3Ps92/Ywc1QVhHFzC6U/c+Bl02fRGoyQ+UQg=="
            },
            {
                id: 3,
                iv: "0t+D0mwXx8n1Nc7b",
                tag: "cBgZPYt8DvrtCQckU4j8yw==",
                cipher: "IL9UqyRhVHCQXYCMM7EXED8H574aqyRthdQ2/F/4xpvP7zPYaNzSha99BnttRw/dBo48+xqNYG6kU9SvmSiT3OlAWTvc+Y+zvXjhcA2WWPkADmuy3z9FUSeuBLBWNb3ws/r04jrHnIbnXTjA1FpLOY7zjQo3lSA/eHB7T/zU+luuEaV8kc79Fg2DXsXRBUeYTrv9UBjbW0jEfcvevt6YHqmGzFhxCminrBdHPnEoOFPwIOk7jsn5b7XwoCRCZQM0pq6GGhNybiyR/0xmRg+5hw=="
            },
            {
                id: 4,
                iv: "A6JOqKdbgICBVraC",
                tag: "Xls53ZWNSnDAXEztMSQRmg==",
                cipher: "NTq59wn1DzFkbuvyxsCgVsQ3MU+oAsvm+JYcpX/1tbmFatX29fSYmXgJdKqy1X1O49Z/CeQX+c04X/c2XqpTt/TAHe0SLyKKXz8psL87ZKmNvcznhugKxGYvk1SGUip34mHM1Us6bBaE4JPmev3DBVUmmiXD+b3s8RyzldAGpWSkxKBeijraKhYppVWikH4YG/xLVY1/Dn7vgjv8QIeGp1egZe43SAxT2HSK2PdhwOQAId3sGbhRU3iht7ooQ/ij2dfeYXLbPzA2bA=="
            },
            {
                id: 5,
                iv: "R0hahMgrcNH+7/C+",
                tag: "ttbBU9oDwPJ0WdkdaBoK3A==",
                cipher: "LRAhrt1HTpYVeFxCbgY91Se+9RyHzxCVSLXP18AQxttp0ZW5csTuFAFR4UdRiFuXdUwg80gBx3hVyhFRyT/AcYJY6m2wzx0l3HuzgEp1VWgeJhrZIFPVZ6m4jDl82oR3BlcNhMfJ0fZFEgEMst5yqYezFmTCdsxyU/vMCtCEeLtUAX9rVHT9uw+ZoJls/J/vXJnKus2aDDs/xhxOk6io1yhyhIdBolSBBxDKNXPg8T+LgTPXUXTfLNokQmq6ANDifzArV9pLlTXeyjrjQdGotQ=="
            },
            {
                id: 6,
                iv: "WlF2hGG3qbsBh3sn",
                tag: "H6hUYWma0RaGB65vEi4VlQ==",
                cipher: "h28znsWksqTn5jc6aQD+F0unLQw2UqHt2/oP026Eqygr8SsTLYnMge4JnXuzWdYJgjeZuK24rgQpxwMpRMS+pZl5Of2RF4JLj6pvz9YHyq2zPOpP7rq7fOimMs/DH/RzYenM3rxhXnGOFpUzPLXMY8otvdn60COqc4f89vs7Q9VgORY2utezxURoUOV844OgDm1OEJ/guFj0hkqz0tXsFmwOZiQ/rqWvvvxdK6RMqd1A80oeGRt9GvIC2RD1KD94AHPLgcygE9c75Q=="
            },
            {
                id: 7,
                iv: "z8ODV0ZuaPD5xvle",
                tag: "r9eGOcVBwiw1dwzySN+UBA==",
                cipher: "WJtscDHGPGhreah/ZDhPBEXUuOMi2Nbg7G8wjpJeGIiLQXB/s6RpYEbnj7lTRTCGIOLGMywsXA+RiQ04gUX7Dg+xU6ljjcINN5G3UGE/ECoY3Sk/wwE0JbyjcaH8jSSMVu3q4wcZVHEHTltVVz6goHWA5I3mO+Y5EbauwAmxUOhct1Su3i9H3CCD2gV+18AG3PGj58gCyH7uVpSKu1samJP7YrO83s1CoQ9PD3/mUx76ldPOhw3pih8t25GkPrBvvR3KYmtapJ3uLcZ2kinsqA=="
            }
        ]
    };

    // ── Cryptographic Key Cache & Helpers ──
    let _cryptoKeyCache = null;
    const _urlCache = new Map();
    const _meta = new WeakMap();

    function _base64ToBytes(b64) {
        const bin = window.atob(b64);
        const len = bin.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = bin.charCodeAt(i);
        }
        return bytes;
    }

    async function _deriveAesKey() {
        if (_cryptoKeyCache) return _cryptoKeyCache;
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error('WebCrypto API is not supported in this environment.');
        }

        const enc = new TextEncoder();
        const rawPass = enc.encode(_VAULT_CONFIG.passphrase);
        const salt = _base64ToBytes(_VAULT_CONFIG.salt);

        const baseKey = await window.crypto.subtle.importKey(
            'raw',
            rawPass,
            'PBKDF2',
            false,
            ['deriveKey']
        );

        _cryptoKeyCache = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: _VAULT_CONFIG.iterations,
                hash: 'SHA-256'
            },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        return _cryptoKeyCache;
    }

    async function _decryptItem(idx) {
        if (_urlCache.has(idx)) {
            return _urlCache.get(idx);
        }

        const item = _VAULT_CONFIG.vault[idx];
        if (!item) throw new Error(`Vault item ${idx} not found.`);

        const key = await _deriveAesKey();
        const ivBytes = _base64ToBytes(item.iv);
        const cipherBytes = _base64ToBytes(item.cipher);
        const tagBytes = _base64ToBytes(item.tag);

        // In Web Crypto AES-GCM, the ciphertext must be appended with the 16-byte auth tag:
        const combined = new Uint8Array(cipherBytes.length + tagBytes.length);
        combined.set(cipherBytes, 0);
        combined.set(tagBytes, cipherBytes.length);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivBytes },
            key,
            combined
        );

        const decryptedText = new TextDecoder().decode(decryptedBuffer);
        const parsedUrls = JSON.parse(decryptedText);
        _urlCache.set(idx, parsedUrls);
        return parsedUrls;
    }

    // ── Hardened Prototype & Canvas Shielding ──
    const _blockedWarning = () => {
        console.warn('%c⛔ img2Preview [AES-GCM Secure]: Image pixel stream is encrypted and protected under copyright.', 'color:#f59e0b;font-weight:bold;font-size:12px;');
        return null;
    };

    function _hardenGlobalPrototypes() {
        try {
            // Guard HTMLCanvasElement prototypes
            const canvasProto = HTMLCanvasElement.prototype;
            const originalToDataURL = canvasProto.toDataURL;
            const originalToBlob = canvasProto.toBlob;

            Object.defineProperty(canvasProto, '_secureToDataURL', { value: originalToDataURL, configurable: false, writable: false });
            Object.defineProperty(canvasProto, '_secureToBlob', { value: originalToBlob, configurable: false, writable: false });

            // Override with guarded interceptor
            canvasProto.toDataURL = function () {
                if (this.classList && (this.classList.contains('pixel-canvas') || this.classList.contains('hero-canvas') || this.classList.contains('modal-pixel-canvas'))) {
                    return _blockedWarning();
                }
                return originalToDataURL.apply(this, arguments);
            };

            canvasProto.toBlob = function (cb) {
                if (this.classList && (this.classList.contains('pixel-canvas') || this.classList.contains('hero-canvas') || this.classList.contains('modal-pixel-canvas'))) {
                    _blockedWarning();
                    if (cb) cb(null);
                    return;
                }
                return originalToBlob.apply(this, arguments);
            };

            // Guard Context2D getImageData
            const ctxProto = CanvasRenderingContext2D.prototype;
            const originalGetImageData = ctxProto.getImageData;
            ctxProto.getImageData = function () {
                const cv = this.canvas;
                if (cv && (cv.classList.contains('pixel-canvas') || cv.classList.contains('hero-canvas') || cv.classList.contains('modal-pixel-canvas'))) {
                    _blockedWarning();
                    return new ImageData(1, 1);
                }
                return originalGetImageData.apply(this, arguments);
            };
        } catch (e) {
            // Silently handled in strict environments
        }
    }
    _hardenGlobalPrototypes();

    function _shieldCanvasInstance(canvas) {
        try {
            Object.defineProperty(canvas, 'toDataURL', { value: _blockedWarning, writable: false, configurable: false });
            Object.defineProperty(canvas, 'toBlob', {
                value: (cb) => { _blockedWarning(); if (cb) cb(null); },
                writable: false,
                configurable: false
            });
            Object.defineProperty(canvas, 'captureStream', { value: _blockedWarning, writable: false, configurable: false });
        } catch (e) { /* already shielded */ }
    }

    // ── Core Engine Implementation ──
    const Img2Preview = {
        version: '3.0-AES-GCM',

        async paint(canvas, idx, opt = {}) {
            if (!canvas) return Promise.reject(new Error('Target canvas is null'));

            try {
                let src;
                // Check if idx is a vault numeric index or a direct URL / image object
                if (typeof idx === 'number' || (!isNaN(idx) && typeof idx === 'string' && String(idx).trim().length <= 3 && !String(idx).startsWith('http') && !String(idx).startsWith('data:'))) {
                    const vaultIdx = Math.max(0, parseInt(idx, 10) % _VAULT_CONFIG.vault.length);
                    const urls = await _decryptItem(vaultIdx);
                    src = opt.hd ? urls.hd : urls.standard;
                } else if (typeof idx === 'string') {
                    src = idx;
                } else if (typeof idx === 'object' && idx !== null) {
                    src = opt.hd ? (idx.hd || idx.src || idx.standard || idx.url) : (idx.standard || idx.src || idx.hd || idx.url);
                } else {
                    const urls = await _decryptItem(0);
                    src = urls.standard;
                }

                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';

                    img.onload = () => {
                        const dpr = window.devicePixelRatio || 1;
                        const ar = img.naturalWidth / img.naturalHeight;
                        const nw = img.naturalWidth;
                        const nh = img.naturalHeight;

                        let dw, dh;
                        if (opt.contain && opt.w && opt.h) {
                            if (opt.w / opt.h > ar) {
                                dh = opt.h;
                                dw = opt.h * ar;
                            } else {
                                dw = opt.w;
                                dh = opt.w / ar;
                            }
                        } else if (opt.w && opt.h) {
                            dw = opt.w;
                            dh = opt.h;
                        } else {
                            dw = opt.w || canvas.clientWidth || (canvas.parentElement ? canvas.parentElement.clientWidth : 400);
                            dh = dw / ar;
                        }

                        canvas.width = Math.round(dw * dpr);
                        canvas.height = Math.round(dh * dpr);
                        canvas.style.width = dw + 'px';
                        canvas.style.height = dh + 'px';

                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                        // ── Museum Micro-Watermark & Forensics ──
                        if (opt.watermark) {
                            ctx.save();
                            ctx.globalAlpha = 0.14;
                            ctx.globalCompositeOperation = 'overlay';

                            const fontSize = Math.max(26, Math.min(canvas.width, canvas.height) * 0.075);
                            ctx.font = `800 ${fontSize}px "Outfit", sans-serif`;
                            ctx.fillStyle = '#ffffff';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';

                            ctx.shadowColor = 'rgba(0,0,0,0.85)';
                            ctx.shadowBlur = 10;
                            ctx.shadowOffsetX = 2;
                            ctx.shadowOffsetY = 2;

                            const stampText = "ABDUL JABBAR";
                            const stepX = fontSize * 4.2;
                            const stepY = fontSize * 4.2;

                            ctx.translate(canvas.width / 2, canvas.height / 2);
                            ctx.rotate(-Math.PI / 6);
                            ctx.translate(-canvas.width / 2, -canvas.height / 2);

                            const diag = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
                            const startX = (canvas.width - diag) / 2;
                            const startY = (canvas.height - diag) / 2;

                            for (let x = startX; x <= startX + diag; x += stepX) {
                                for (let y = startY; y <= startY + diag; y += stepY) {
                                    ctx.fillText(stampText, x, y);
                                }
                            }
                            ctx.restore();
                        }

                        // Immediate zero-exposure memory scrub
                        img.src = 'data:,';
                        _meta.set(canvas, { nw, nh, dw, dh, idx });
                        _shieldCanvasInstance(canvas);
                        canvas.classList.add('loaded');
                        resolve({ nw, nh, dw, dh, ar });
                    };

                    img.onerror = () => reject(new Error(`[img2Preview AES-GCM] Failed to load media index ${idx}`));
                    img.src = src;
                });
            } catch (err) {
                console.error('[img2Preview AES-GCM]', err);
                return Promise.reject(err);
            }
        },

        dims(canvas) {
            const m = _meta.get(canvas);
            return m ? { w: m.nw, h: m.nh } : null;
        }
    };

    // ── Passive Anti-Tamper & DevTools Inspection Monitor ──
    setInterval(() => {
        const threshold = 160;
        const open = (window.outerWidth - window.innerWidth > threshold) ||
                     (window.outerHeight - window.innerHeight > threshold);
        if (document.body) {
            document.body.classList.toggle('devtools-open', open);
        }
    }, 1800);

    window.Img2Preview = Img2Preview;
})(window);
