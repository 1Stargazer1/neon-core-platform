document.addEventListener('DOMContentLoaded', () => {
    const colourInput = document.getElementById('colour-input');
    const colourPreview = document.getElementById('colour-preview');
    const resultHex = document.getElementById('result-hex');
    const resultRgb = document.getElementById('result-rgb');
    const resultHsl = document.getElementById('result-hsl');
    const colourError = document.getElementById('colour-input-error');
    const resetConverterBtn = document.getElementById('reset-converter');

    const fgColour = document.getElementById('fg-colour');
    const bgColour = document.getElementById('bg-colour');
    const ratioValue = document.getElementById('ratio-value');
    const contrastNormalPreview = document.getElementById('contrast-normal-preview');
    const contrastLargePreview = document.getElementById('contrast-large-preview');
    const wcagAaNormal = document.getElementById('wcag-aa-normal');
    const wcagAaLarge = document.getElementById('wcag-aa-large');
    const wcagAaaNormal = document.getElementById('wcag-aaa-normal');
    const wcagAaaLarge = document.getElementById('wcag-aaa-large');
    const fgError = document.getElementById('fg-colour-error');
    const bgError = document.getElementById('bg-colour-error');
    const resetContrastBtn = document.getElementById('reset-contrast');

    // Utility: Parse colour input
    function parseColour(input) {
        input = input.trim();

        // HEX format: #RGB or #RRGGBB
        if (/^#[0-9A-Fa-f]{3}$/.test(input)) {
            const hex = input.slice(1);
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16)
            };
        }
        if (/^#[0-9A-Fa-f]{6}$/.test(input)) {
            return {
                r: parseInt(input.slice(1, 3), 16),
                g: parseInt(input.slice(3, 5), 16),
                b: parseInt(input.slice(5, 7), 16)
            };
        }

        // RGB format: rgb(r, g, b)
        const rgbMatch = input.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
        if (rgbMatch) {
            const [, r, g, b] = rgbMatch.map(x => x ? parseInt(x, 10) : 0);
            if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
                return { r, g, b };
            }
            return null;
        }

        // HSL format: hsl(h, s%, l%)
        const hslMatch = input.match(/^hsl\s*\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*%\s*,\s*(\d+(?:\.\d+)?)\s*%\s*\)$/i);
        if (hslMatch) {
            const h = parseFloat(hslMatch[1]);
            const s = parseFloat(hslMatch[2]);
            const l = parseFloat(hslMatch[3]);
            if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
                return hslToRgb(h, s, l);
            }
            return null;
        }

        return null;
    }

    // Convert HSL to RGB
    function hslToRgb(h, s, l) {
        h = (h % 360 + 360) % 360;
        s = Math.max(0, Math.min(100, s)) / 100;
        l = Math.max(0, Math.min(100, l)) / 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;

        let r, g, b;
        if (h < 60) [r, g, b] = [c, x, 0];
        else if (h < 120) [r, g, b] = [x, c, 0];
        else if (h < 180) [r, g, b] = [0, c, x];
        else if (h < 240) [r, g, b] = [0, x, c];
        else if (h < 300) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    // Convert RGB to HSL
    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    // RGB to HEX
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase();
    }

    // Update colour converter display
    function updateColourConverter() {
        const input = colourInput.value;
        colourError.textContent = '';

        if (!input.trim()) {
            resultHex.textContent = '—';
            resultRgb.textContent = '—';
            resultHsl.textContent = '—';
            colourPreview.style.backgroundColor = 'transparent';
            colourPreview.style.border = '2px dashed var(--grey-400)';
            return;
        }

        const rgb = parseColour(input);
        if (!rgb) {
            colourError.textContent = 'Invalid colour format. Use #RGB, #RRGGBB, rgb(r, g, b), or hsl(h, s%, l%).';
            resultHex.textContent = '—';
            resultRgb.textContent = '—';
            resultHsl.textContent = '—';
            colourPreview.style.backgroundColor = 'transparent';
            colourPreview.style.border = '2px dashed var(--error-colour)';
            return;
        }

        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        resultHex.textContent = hex;
        resultRgb.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        resultHsl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        colourPreview.style.backgroundColor = hex;
        colourPreview.style.border = 'none';
    }

    // Calculate relative luminance for WCAG contrast
    function getLuminance(r, g, b) {
        [r, g, b] = [r, g, b].map(x => {
            x = x / 255;
            return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    // Calculate contrast ratio
    function getContrastRatio(rgb1, rgb2) {
        const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    // Update contrast checker display
    function updateContrastChecker() {
        const fgInput = fgColour.value.trim();
        const bgInput = bgColour.value.trim();
        fgError.textContent = '';
        bgError.textContent = '';

        if (!fgInput || !bgInput) {
            ratioValue.textContent = '—';
            wcagAaNormal.textContent = '—';
            wcagAaLarge.textContent = '—';
            wcagAaaNormal.textContent = '—';
            wcagAaaLarge.textContent = '—';
            contrastNormalPreview.style.color = 'inherit';
            contrastLargePreview.style.color = 'inherit';
            return;
        }

        const fgRgb = parseColour(fgInput);
        const bgRgb = parseColour(bgInput);

        if (!fgRgb) {
            fgError.textContent = 'Invalid foreground colour.';
            return;
        }
        if (!bgRgb) {
            bgError.textContent = 'Invalid background colour.';
            return;
        }

        const ratio = getContrastRatio(fgRgb, bgRgb);
        const ratioText = ratio.toFixed(2) + ':1';
        ratioValue.textContent = ratioText;

        const fgHex = rgbToHex(fgRgb.r, fgRgb.g, fgRgb.b);
        const bgHex = rgbToHex(bgRgb.r, bgRgb.g, bgRgb.b);

        contrastNormalPreview.style.color = fgHex;
        contrastNormalPreview.style.backgroundColor = bgHex;
        contrastLargePreview.style.color = fgHex;
        contrastLargePreview.style.backgroundColor = bgHex;

        const aaNormal = ratio >= 4.5 ? '✓ Pass' : '✗ Fail';
        const aaLarge = ratio >= 3 ? '✓ Pass' : '✗ Fail';
        const aaaNormal = ratio >= 7 ? '✓ Pass' : '✗ Fail';
        const aaaLarge = ratio >= 4.5 ? '✓ Pass' : '✗ Fail';

        wcagAaNormal.textContent = aaNormal;
        wcagAaLarge.textContent = aaLarge;
        wcagAaaNormal.textContent = aaaNormal;
        wcagAaaLarge.textContent = aaaLarge;

        wcagAaNormal.className = 'wcag-value ' + (ratio >= 4.5 ? 'pass' : 'fail');
        wcagAaLarge.className = 'wcag-value ' + (ratio >= 3 ? 'pass' : 'fail');
        wcagAaaNormal.className = 'wcag-value ' + (ratio >= 7 ? 'pass' : 'fail');
        wcagAaaLarge.className = 'wcag-value ' + (ratio >= 4.5 ? 'pass' : 'fail');
    }

    // Copy to clipboard
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            const text = targetElement.textContent;

            if (text === '—') {
                btn.textContent = 'No value';
                setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
                return;
            }

            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
            }).catch(() => {
                btn.textContent = 'Failed';
                setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
            });
        });
    });

    // Reset converter
    resetConverterBtn.addEventListener('click', () => {
        colourInput.value = '';
        colourError.textContent = '';
        resultHex.textContent = '—';
        resultRgb.textContent = '—';
        resultHsl.textContent = '—';
        colourPreview.style.backgroundColor = 'transparent';
        colourPreview.style.border = '2px dashed var(--grey-400)';
        colourInput.focus();
    });

    // Reset contrast
    resetContrastBtn.addEventListener('click', () => {
        fgColour.value = '';
        bgColour.value = '';
        fgError.textContent = '';
        bgError.textContent = '';
        ratioValue.textContent = '—';
        wcagAaNormal.textContent = '—';
        wcagAaLarge.textContent = '—';
        wcagAaaNormal.textContent = '—';
        wcagAaaLarge.textContent = '—';
        wcagAaNormal.className = 'wcag-value';
        wcagAaLarge.className = 'wcag-value';
        wcagAaaNormal.className = 'wcag-value';
        wcagAaaLarge.className = 'wcag-value';
        contrastNormalPreview.style.color = 'inherit';
        contrastLargePreview.style.color = 'inherit';
        fgColour.focus();
    });

    // Event listeners
    colourInput.addEventListener('input', updateColourConverter);
    fgColour.addEventListener('input', updateContrastChecker);
    bgColour.addEventListener('input', updateContrastChecker);
});
