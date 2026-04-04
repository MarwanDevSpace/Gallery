/**
 * img2Preview v2.1 — Vector-Fidelity Canvas Protection Engine
 */
(function (window) {
    'use strict';

    const _H = 'https://images.unsplash.com/photo-';
    const _S = ['?w=800&auto=format&fit=crop&q=85', '?w=2400&auto=format&fit=crop&q=90'];
    const _K = [
        '1618005182384-a83a8bd57fbe',
        '1558655146-d09347e92766',
        '1626785774573-4b799315345d',
        '1600132806608-231446b2e7af',
        '1561070791-2526d30994b5',
        '1512295767273-ac109ac3acfa',
        '1550745165-9bc0b252726f',
        '1634084462412-b54873c0a56d'
    ];
    function _url(i, hd) { return _H + _K[i] + _S[hd ? 1 : 0]; }

    const _meta = new WeakMap();

    function _shield(canvas) {
        const warn = () => {
            console.warn('%c⛔ img2Preview: Protected content.', 'color:#e11d48;font-weight:bold');
            return null;
        };
        try {
            Object.defineProperty(canvas, 'toDataURL', { value: warn, writable: false });
            Object.defineProperty(canvas, 'toBlob', {
                value: (cb) => { warn(); if (cb) cb(null); },
                writable: false
            });
        } catch (e) { /* already shielded */ }
    }

    const Img2Preview = {
        async paint(canvas, idx, opt = {}) {
            const src = _url(idx, opt.hd || false);
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const dpr = window.devicePixelRatio || 1;
                    const ar = img.naturalWidth / img.naturalHeight;
                    const nw = img.naturalWidth, nh = img.naturalHeight;

                    let dw, dh;
                    if (opt.contain && opt.w && opt.h) {
                        if (opt.w / opt.h > ar) { dh = opt.h; dw = opt.h * ar; }
                        else { dw = opt.w; dh = opt.w / ar; }
                    } else if (opt.w && opt.h) {
                        dw = opt.w; dh = opt.h;
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

                    // --- Smart Watermark Layer ---
                    if (opt.watermark) {
                        ctx.save();
                        // Mix blend mode to interact intelligently with dark/light images
                        ctx.globalAlpha = 0.12; 
                        ctx.globalCompositeOperation = 'overlay'; 
                        
                        const fontSize = Math.max(30, Math.min(canvas.width, canvas.height) * 0.08); 
                        ctx.font = `900 ${fontSize}px sans-serif`;
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        
                        // Dual shadow for contrast on both dark and light
                        ctx.shadowColor = 'rgba(0,0,0,0.8)';
                        ctx.shadowBlur = 8;
                        ctx.shadowOffsetX = 2;
                        ctx.shadowOffsetY = 2;

                        const text = "AJ";
                        const stepX = fontSize * 3.5;
                        const stepY = fontSize * 3.5;
                        
                        // Rotate canvas to draw diagonal watermark
                        ctx.translate(canvas.width / 2, canvas.height / 2);
                        ctx.rotate(-Math.PI / 6); // -30 degrees
                        ctx.translate(-canvas.width / 2, -canvas.height / 2);

                        // Calculate bounds to fill rotated canvas
                        const diag = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
                        const startX = (canvas.width - diag) / 2;
                        const startY = (canvas.height - diag) / 2;
                        const endX = startX + diag;
                        const endY = startY + diag;

                        for(let x = startX; x <= endX; x += stepX) {
                            for(let y = startY; y <= endY; y += stepY) {
                                ctx.fillText(text, x, y);
                            }
                        }
                        ctx.restore();
                    }

                    img.src = 'data:,';
                    _meta.set(canvas, { nw, nh, dw, dh, idx });
                    _shield(canvas);
                    canvas.classList.add('loaded');
                    resolve({ nw, nh, dw, dh });
                };
                img.onerror = () => reject('[img2Preview] Load failed.');
                img.src = src;
            });
        },
        dims(canvas) {
            const m = _meta.get(canvas);
            return m ? { w: m.nw, h: m.nh } : null;
        }
    };

    setInterval(() => {
        const open = (window.outerWidth - window.innerWidth > 160) ||
                     (window.outerHeight - window.innerHeight > 160);
        document.body.classList.toggle('devtools-open', open);
    }, 2000);

    window.Img2Preview = Img2Preview;
})(window);
