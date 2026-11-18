document.addEventListener('DOMContentLoaded', () => {
    // ========== A. Encode Mode ==========
    const encodeInput = document.getElementById('encode-input');
    const encodeOutput = document.getElementById('encode-output');
    const encodeError = document.getElementById('encode-input-error');
    const resetEncodeBtn = document.getElementById('reset-encode');

    // ========== B. Decode Mode ==========
    const decodeInput = document.getElementById('decode-input');
    const decodeOutput = document.getElementById('decode-output');
    const decodeError = document.getElementById('decode-input-error');
    const resetDecodeBtn = document.getElementById('reset-decode');

    // ========== Mode Switching ==========
    const modeSections = document.querySelectorAll('.mode-section');
    const modeButtons = document.querySelectorAll('.mode-btn');

    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-mode');

            modeButtons.forEach(b => b.classList.remove('active'));
            modeSections.forEach(s => s.classList.add('hidden'));

            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            document.getElementById(mode + '-mode').classList.remove('hidden');

            // Clear results when switching modes
            encodeOutput.textContent = '—';
            decodeOutput.textContent = '—';
            encodeError.textContent = '';
            decodeError.textContent = '';
        });
    });

    // ========== Utility Functions ==========

    // Encode text to Base64
    function encodeToBase64(text) {
        try {
            // Use TextEncoder to handle UTF-8 properly
            const encoder = new TextEncoder();
            const bytes = encoder.encode(text);

            // Convert Uint8Array to binary string
            let binaryString = '';
            for (let i = 0; i < bytes.length; i++) {
                binaryString += String.fromCharCode(bytes[i]);
            }

            // Use native btoa for Base64 encoding
            return btoa(binaryString);
        } catch (err) {
            throw new Error('Encoding failed: ' + err.message);
        }
    }

    // Decode Base64 to text
    function decodeFromBase64(base64String) {
        try {
            // Validate Base64 format
            if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64String)) {
                throw new Error('Invalid Base64 characters.');
            }

            // Check padding
            const length = base64String.length;
            if (length % 4 !== 0) {
                throw new Error('Invalid Base64 length. Must be multiple of 4.');
            }

            // Decode from Base64
            const binaryString = atob(base64String);

            // Convert binary string to Uint8Array
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Decode UTF-8 with strict validation
            const decoder = new TextDecoder('utf-8', { fatal: true });
            const text = decoder.decode(bytes);

            return text;
        } catch (err) {
            if (err.name === 'TypeError') {
                throw new Error('Invalid UTF-8 sequence in decoded data.');
            }
            throw err;
        }
    }

    // ========== A. Encode Calculation ==========
    function updateEncode() {
        encodeError.textContent = '';

        const text = encodeInput.value;

        if (text === '') {
            encodeOutput.textContent = '—';
            return;
        }

        if (text.length > 100000) {
            encodeError.textContent = 'Input too large (max 100,000 characters).';
            encodeOutput.textContent = '—';
            return;
        }

        try {
            const base64 = encodeToBase64(text);
            encodeOutput.textContent = base64;
        } catch (err) {
            encodeError.textContent = err.message;
            encodeOutput.textContent = '—';
        }
    }

    encodeInput.addEventListener('input', updateEncode);

    resetEncodeBtn.addEventListener('click', () => {
        encodeInput.value = '';
        encodeOutput.textContent = '—';
        encodeError.textContent = '';
        encodeInput.focus();
    });

    // ========== B. Decode Calculation ==========
    function updateDecode() {
        decodeError.textContent = '';

        const base64String = decodeInput.value.trim();

        if (base64String === '') {
            decodeOutput.textContent = '—';
            return;
        }

        if (base64String.length > 150000) {
            decodeError.textContent = 'Input too large (max 150,000 characters).';
            decodeOutput.textContent = '—';
            return;
        }

        try {
            const text = decodeFromBase64(base64String);
            decodeOutput.textContent = text;
        } catch (err) {
            decodeError.textContent = err.message;
            decodeOutput.textContent = '—';
        }
    }

    decodeInput.addEventListener('input', updateDecode);

    resetDecodeBtn.addEventListener('click', () => {
        decodeInput.value = '';
        decodeOutput.textContent = '—';
        decodeError.textContent = '';
        decodeInput.focus();
    });

    // ========== Copy to Clipboard ==========
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
});
