# NEON//CORE QR Code Generator Review Package

## Current Implementation

The source listings later in this document are the original implementation snapshot. The current, authoritative files are [the QR page](../tools/qr-code-generator.html) and [its JavaScript](../js/tools/qr-code-generator.js).

The focused follow-up pass corrected contrast calculation so either high-contrast color polarity is accepted, with an advisory for light-on-dark combinations and validation for low contrast. SVG export is now constructed directly from the QR matrix and uses the same dimensions, module size, and colors as the canvas/PNG. Download object URLs are cleaned after deferred rendering, on page exit, or by a 30-second fallback for suspended tabs. Phone validation accepts common formatting and international prefixes while rejecting malformed/short values; basic email validation supports internationalized addresses and Unicode subject/body text.

Latest browser checks covered all six payload types, punctuation/Unicode, both color polarities, PNG/SVG Blob generation, pixel-for-pixel SVG/preview comparison, invalid phone/email/contrast cases, reset, and local-storage privacy. Diagnostics found no errors. Native save prompts and physical QR scanner behavior were not verified.

## Files

Created for the QR tool:

- `tools/qr-code-generator.html`
- `js/tools/qr-code-generator.js`

Modified for integration/documentation:

- `js/script.js`: added `href: "tools/qr-code-generator.html"` to the existing `qr-code-generator` tool record. The existing stable tool ID remains unchanged.
- `css/tool-pages.css`: added QR-specific layout and controls, reusing existing design tokens and components.
- `README.md`: documented the tool, dependency, supported formats, and privacy/format limitations.

The shared navigation code in `js/platform.js` and shared page header markup were not modified. The new page uses the existing shared header pattern and loads `js/platform.js` with `data-tool-id="qr-code-generator"` so recent-use tracking continues to work.

## Dependency

The page loads [`qrcode-generator`](https://github.com/kazuhikoarase/qrcode-generator) version 2.0.4 from:

```text
https://cdn.jsdelivr.net/npm/qrcode-generator@2.0.4/dist/qrcode.js
```

It is an MIT-licensed browser bundle. It generates the QR matrix locally, supports UTF-8 byte encoding and SVG generation, and requires no backend. The library file must be fetched from jsDelivr, but the QR payload is never sent with that request or uploaded to a service. QR content is not written to LocalStorage.

## Complete HTML

File: `tools/qr-code-generator.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#080b12">
    <meta name="description" content="Create and download QR codes locally in your browser for links, text, email, phone, Wi-Fi, and SMS.">
    <title>QR Code Generator | NEON//CORE</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/tool-pages.css">
    <script src="../js/platform.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@2.0.4/dist/qrcode.js" defer></script>
    <script src="../js/tools/qr-code-generator.js" defer></script>
  </head>
  <body data-tool-id="qr-code-generator">
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="../index.html#top" aria-label="NEON Core home">
          <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
          <span>NEON<span class="brand-divider">//</span>CORE</span>
        </a>
        <nav class="main-nav" aria-label="Main navigation">
          <a class="nav-link" href="../index.html#tools">Tool directory</a>
          <a class="nav-link" href="../index.html#about">About</a>
        </nav>
        <a class="header-action" href="../index.html#tools">All tools <span aria-hidden="true">↗</span></a>
      </div>
    </header>

    <main class="utility-main" id="main-content">
      <div class="utility-shell qr-utility-shell">
        <a class="tool-back-link" href="../index.html#tools"><span aria-hidden="true">←</span> TOOL DIRECTORY</a>
        <header class="tool-heading">
          <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span> EVERYDAY / TOOL 08</p>
          <h1>QR code <span class="accent-text">generator.</span></h1>
          <p>Create a scannable code for a link, message, contact, or network.</p>
        </header>

        <div class="utility-layout qr-layout">
          <section class="surface-panel utility-panel" aria-labelledby="qr-settings-title">
            <div class="utility-panel-heading">
              <span class="mono-label">CODE CONTENT</span>
              <span class="utility-index">NC / 08</span>
            </div>
            <h2 id="qr-settings-title">Choose what to encode.</h2>

            <form class="utility-form" id="qr-form" novalidate>
              <div class="form-field">
                <label for="qr-type">Content type</label>
                <select class="form-control" id="qr-type">
                  <option value="url">URL / Website</option>
                  <option value="text">Plain text</option>
                  <option value="email">Email address</option>
                  <option value="phone">Phone number</option>
                  <option value="wifi">Wi-Fi network</option>
                  <option value="sms">SMS message</option>
                </select>
              </div>

              <div class="qr-content-fields" data-content="url">
                <div class="form-field">
                  <label for="url-value">Website address</label>
                  <input class="form-control" id="url-value" type="url" inputmode="url" placeholder="https://example.com" autocomplete="url">
                </div>
              </div>

              <div class="qr-content-fields" data-content="text" hidden>
                <div class="form-field">
                  <label for="text-value">Text to encode</label>
                  <textarea class="form-control qr-textarea" id="text-value" placeholder="Write a short message..."></textarea>
                </div>
              </div>

              <div class="qr-content-fields" data-content="email" hidden>
                <div class="form-field">
                  <label for="email-value">Email address</label>
                  <input class="form-control" id="email-value" type="email" inputmode="email" placeholder="name@example.com" autocomplete="email">
                </div>
                <div class="form-field">
                  <label for="email-subject">Subject <span class="optional-label">OPTIONAL</span></label>
                  <input class="form-control" id="email-subject" type="text" placeholder="Message subject">
                </div>
                <div class="form-field">
                  <label for="email-body">Message <span class="optional-label">OPTIONAL</span></label>
                  <textarea class="form-control qr-textarea qr-textarea-short" id="email-body" placeholder="Message body"></textarea>
                </div>
              </div>

              <div class="qr-content-fields" data-content="phone" hidden>
                <div class="form-field">
                  <label for="phone-value">Phone number</label>
                  <input class="form-control" id="phone-value" type="tel" inputmode="tel" placeholder="+1 555 123 4567" autocomplete="tel">
                  <span class="field-help">Use an international country code when possible.</span>
                </div>
              </div>

              <div class="qr-content-fields" data-content="wifi" hidden>
                <div class="form-field">
                  <label for="wifi-ssid">Network name (SSID)</label>
                  <input class="form-control" id="wifi-ssid" type="text" autocomplete="off">
                </div>
                <div class="form-field">
                  <label for="wifi-encryption">Encryption</label>
                  <select class="form-control" id="wifi-encryption">
                    <option value="WPA" selected>WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">Open network (no password)</option>
                  </select>
                </div>
                <div class="form-field" id="wifi-password-field">
                  <label for="wifi-password">Network password</label>
                  <input class="form-control" id="wifi-password" type="password" autocomplete="new-password">
                </div>
                <label class="check-option">
                  <input id="wifi-hidden" type="checkbox">
                  <span>Hidden network</span>
                </label>
              </div>

              <div class="qr-content-fields" data-content="sms" hidden>
                <div class="form-field">
                  <label for="sms-phone">Phone number</label>
                  <input class="form-control" id="sms-phone" type="tel" inputmode="tel" placeholder="+1 555 123 4567" autocomplete="tel">
                </div>
                <div class="form-field">
                  <label for="sms-message">Message</label>
                  <textarea class="form-control qr-textarea qr-textarea-short" id="sms-message" placeholder="Text message..."></textarea>
                </div>
              </div>

              <fieldset class="standard-fieldset qr-customization">
                <legend>Appearance</legend>
                <div class="qr-color-row">
                  <label class="color-field" for="qr-foreground">
                    <span>Foreground</span>
                    <input id="qr-foreground" type="color" value="#080b12">
                  </label>
                  <label class="color-field" for="qr-background">
                    <span>Background</span>
                    <input id="qr-background" type="color" value="#ffffff">
                  </label>
                </div>
                <div class="unit-fields qr-options-row">
                  <div class="form-field">
                    <label for="qr-size">Maximum image size</label>
                    <select class="form-control" id="qr-size">
                      <option value="160">160 px</option>
                      <option value="256" selected>256 px</option>
                      <option value="384">384 px</option>
                      <option value="512">512 px</option>
                    </select>
                  </div>
                  <div class="form-field">
                    <label for="qr-error-level">Error correction</label>
                    <select class="form-control" id="qr-error-level">
                      <option value="L">Low · 7%</option>
                      <option value="M" selected>Medium · 15%</option>
                      <option value="Q">Quartile · 25%</option>
                      <option value="H">High · 30%</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              <p class="input-error" id="qr-error" role="alert" hidden></p>
              <p class="qr-library-error" id="qr-library-error" role="alert" hidden>QR generation could not load. Check your connection and reload this page.</p>
            </form>
          </section>

          <section class="surface-panel utility-panel result-panel qr-preview-panel" aria-labelledby="qr-preview-title">
            <div class="utility-panel-heading">
              <span class="mono-label">LOCAL PREVIEW</span>
              <span class="result-live"><span class="status-dot status-dot--primary" aria-hidden="true"></span> PRIVATE</span>
            </div>
            <h2 id="qr-preview-title">Scan to verify.</h2>
            <div class="qr-preview-frame" id="qr-preview-frame">
              <canvas id="qr-canvas" width="256" height="256" role="img" aria-label="QR code preview"></canvas>
              <p class="qr-preview-placeholder" id="qr-placeholder">Choose a content type and enter its details to build a QR code.</p>
            </div>
            <p class="result-caption" id="qr-caption">Preview updates in your browser. Content is not saved or uploaded.</p>
            <div class="qr-download-actions">
              <button class="button button-primary" id="download-png" type="button" disabled>Download PNG <span aria-hidden="true">↓</span></button>
              <button class="button button-secondary" id="download-svg" type="button" disabled>Download SVG <span aria-hidden="true">↓</span></button>
              <button class="button button-quiet" id="reset-qr" type="button">Reset</button>
            </div>
            <div class="calculation-note qr-privacy-note">
              <p class="mono-label">PRIVACY / SAFE SHARING</p>
              <p>Your content is encoded locally in this browser and is not sent to NEON//CORE. Scan and verify the downloaded code before printing or sharing it, especially before embedding passwords or personal details.</p>
            </div>
          </section>
        </div>
        <p class="tool-footnote">A QR reader opens the encoded link or action; it does not verify that destination is safe.</p>
      </div>
    </main>
  </body>
</html>
```

## Complete JavaScript

File: `js/tools/qr-code-generator.js`

```javascript
const qrForm = document.querySelector("#qr-form");
const qrTypeSelect = document.querySelector("#qr-type");
const contentSections = document.querySelectorAll(".qr-content-fields");
const wifiEncryptionSelect = document.querySelector("#wifi-encryption");
const wifiPasswordField = document.querySelector("#wifi-password-field");
const qrCanvas = document.querySelector("#qr-canvas");
const previewPlaceholder = document.querySelector("#qr-placeholder");
const previewFrame = document.querySelector("#qr-preview-frame");
const qrCaption = document.querySelector("#qr-caption");
const qrError = document.querySelector("#qr-error");
const libraryError = document.querySelector("#qr-library-error");
const pngButton = document.querySelector("#download-png");
const svgButton = document.querySelector("#download-svg");
const resetButton = document.querySelector("#reset-qr");
const foregroundInput = document.querySelector("#qr-foreground");
const backgroundInput = document.querySelector("#qr-background");
const sizeSelect = document.querySelector("#qr-size");
const errorLevelSelect = document.querySelector("#qr-error-level");

let currentPayload = "";
let currentGeneration = 0;
let currentQrCode = null;
let currentQrRenderSettings = null;

function showQrError(message, invalidFields = []) {
  document.querySelectorAll(".qr-content-fields input, .qr-content-fields textarea, #qr-foreground, #qr-background").forEach((input) => {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  });
  invalidFields.forEach((input) => {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", "qr-error");
  });
  qrError.textContent = message;
  qrError.hidden = false;
}

function clearQrError() {
  qrError.hidden = true;
  document.querySelectorAll(".qr-content-fields input, .qr-content-fields textarea, #qr-foreground, #qr-background").forEach((input) => {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  });
}

function encodeEmailAddress(address) {
  return encodeURIComponent(address).replace(/%40/gi, "@");
}

function normalizePhoneNumber(input, invalidFields) {
  const rawValue = input.value.trim();
  const normalized = rawValue.replace(/[\s().-]/g, "");
  if (!/^\+?[0-9]{3,15}$/.test(normalized)) {
    invalidFields.push(input);
    return null;
  }
  return normalized;
}

function escapeWifiValue(value) {
  return value.replace(/[\\;,:\"]/g, "\\$&");
}

function buildQrPayload() {
  const contentType = qrTypeSelect.value;
  const invalidFields = [];

  if (contentType === "url") {
    const input = document.querySelector("#url-value");
    const value = input.value.trim();
    if (!value) {
      invalidFields.push(input);
    } else {
      try {
        const url = new URL(value);
        if (url.protocol !== "http:" && url.protocol !== "https:") invalidFields.push(input);
      } catch {
        invalidFields.push(input);
      }
    }
    if (invalidFields.length) return { error: "Enter a complete website address beginning with http:// or https://.", invalidFields };
    return { payload: new URL(value).toString() };
  }

  if (contentType === "text") {
    const input = document.querySelector("#text-value");
    if (!input.value.trim()) return { error: "Enter some text to encode.", invalidFields: [input] };
    return { payload: input.value };
  }

  if (contentType === "email") {
    const addressInput = document.querySelector("#email-value");
    const subjectInput = document.querySelector("#email-subject");
    const bodyInput = document.querySelector("#email-body");
    const address = addressInput.value.trim();
    if (!address || !addressInput.validity.valid) {
      return { error: "Enter a valid email address.", invalidFields: [addressInput] };
    }

    const parameters = [];
    if (subjectInput.value) parameters.push(`subject=${encodeURIComponent(subjectInput.value)}`);
    if (bodyInput.value) parameters.push(`body=${encodeURIComponent(bodyInput.value)}`);
    const query = parameters.length ? `?${parameters.join("&")}` : "";
    return { payload: `mailto:${encodeEmailAddress(address)}${query}` };
  }

  if (contentType === "phone") {
    const phoneInput = document.querySelector("#phone-value");
    const phone = normalizePhoneNumber(phoneInput, invalidFields);
    if (!phone) return { error: "Enter a phone number with 3 to 15 digits, optionally beginning with +.", invalidFields };
    return { payload: `tel:${phone}` };
  }

  if (contentType === "wifi") {
    const ssidInput = document.querySelector("#wifi-ssid");
    const passwordInput = document.querySelector("#wifi-password");
    const encryption = wifiEncryptionSelect.value;
    const ssid = ssidInput.value;
    if (!ssid.trim() || /[\r\n]/.test(ssid)) {
      invalidFields.push(ssidInput);
      return { error: "Enter a network name (SSID) without line breaks.", invalidFields };
    }
    if (encryption !== "nopass" && !passwordInput.value) {
      invalidFields.push(passwordInput);
      return { error: "Enter the Wi-Fi password, or choose an open network.", invalidFields };
    }
    if (/[\r\n]/.test(passwordInput.value)) {
      invalidFields.push(passwordInput);
      return { error: "Wi-Fi passwords cannot contain line breaks in a QR payload.", invalidFields };
    }

    const hidden = document.querySelector("#wifi-hidden").checked;
    const passwordPart = encryption === "nopass" ? "" : `P:${escapeWifiValue(passwordInput.value)};`;
    return { payload: `WIFI:T:${encryption};S:${escapeWifiValue(ssid)};${passwordPart}H:${hidden ? "true" : "false"};;` };
  }

  if (contentType === "sms") {
    const phoneInput = document.querySelector("#sms-phone");
    const messageInput = document.querySelector("#sms-message");
    const phone = normalizePhoneNumber(phoneInput, invalidFields);
    if (!phone) return { error: "Enter a phone number with 3 to 15 digits, optionally beginning with +.", invalidFields };
    if (!messageInput.value.trim()) {
      return { error: "Enter a text message to include.", invalidFields: [messageInput] };
    }
    return { payload: `sms:${phone}:${encodeURIComponent(messageInput.value)}` };
  }

  return { error: "Choose a supported content type.", invalidFields: [] };
}

function getQrOptions() {
  return {
    errorCorrectionLevel: errorLevelSelect.value,
  };
}

function colorLuminance(hexColor) {
  const channels = hexColor.slice(1).match(/.{2}/g).map((channel) => parseInt(channel, 16) / 255);
  const linearChannels = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4);
  return linearChannels[0] * 0.2126 + linearChannels[1] * 0.7152 + linearChannels[2] * 0.0722;
}

function hasReadableQrColors() {
  const foregroundLuminance = colorLuminance(foregroundInput.value);
  const backgroundLuminance = colorLuminance(backgroundInput.value);
  const contrastRatio = (backgroundLuminance + 0.05) / (foregroundLuminance + 0.05);
  return foregroundLuminance < backgroundLuminance && contrastRatio >= 4.5;
}

function renderQrCode(payload) {
  window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs["UTF-8"];
  const qrCode = window.qrcode(0, getQrOptions().errorCorrectionLevel);
  qrCode.addData(payload, "Byte");
  qrCode.make();

  const moduleCount = qrCode.getModuleCount();
  const selectedSize = Number(sizeSelect.value);
  const cellSize = Math.floor(selectedSize / (moduleCount + 8));
  if (cellSize < 1) {
    throw new Error("This content needs a larger image size or a lower error-correction level.");
  }

  const margin = cellSize * 4;
  const imageSize = moduleCount * cellSize + margin * 2;
  qrCanvas.width = imageSize;
  qrCanvas.height = imageSize;
  const context = qrCanvas.getContext("2d");
  context.imageSmoothingEnabled = false;
  context.fillStyle = backgroundInput.value;
  context.fillRect(0, 0, imageSize, imageSize);
  context.fillStyle = foregroundInput.value;

  for (let row = 0; row < moduleCount; row += 1) {
    for (let column = 0; column < moduleCount; column += 1) {
      if (qrCode.isDark(row, column)) {
        context.fillRect(margin + column * cellSize, margin + row * cellSize, cellSize, cellSize);
      }
    }
  }

  currentQrCode = qrCode;
  currentQrRenderSettings = { cellSize, margin };
}

function setPreviewVisible(isVisible) {
  qrCanvas.hidden = !isVisible;
  previewPlaceholder.hidden = isVisible;
  pngButton.disabled = !isVisible;
  svgButton.disabled = !isVisible;
}

function updateQrPreview(showValidation = true) {
  const generation = ++currentGeneration;
  const currentSection = document.querySelector(`.qr-content-fields[data-content="${qrTypeSelect.value}"]`);

  contentSections.forEach((section) => {
    section.hidden = section !== currentSection;
  });
  wifiPasswordField.hidden = wifiEncryptionSelect.value === "nopass";
  clearQrError();
  libraryError.hidden = true;

  if (!window.qrcode) {
    currentPayload = "";
    setPreviewVisible(false);
    previewPlaceholder.textContent = "QR library is unavailable. Reload when connected to the internet.";
    libraryError.hidden = false;
    return;
  }

  const built = buildQrPayload();
  if (!built.payload) {
    currentPayload = "";
    currentQrCode = null;
    currentQrRenderSettings = null;
    setPreviewVisible(false);
    previewPlaceholder.textContent = showValidation && built.error
      ? "Fix the highlighted input to generate a QR code."
      : "Choose a content type and enter its details to build a QR code.";
    if (showValidation && built.error) showQrError(built.error, built.invalidFields);
    qrCaption.textContent = "Add valid content to create a local preview.";
    return;
  }

  if (!hasReadableQrColors()) {
    currentPayload = "";
    currentQrCode = null;
    currentQrRenderSettings = null;
    setPreviewVisible(false);
    previewPlaceholder.textContent = "Choose contrasting colors to preview the QR code.";
    showQrError("Choose a darker foreground and a lighter background with strong contrast.", [foregroundInput, backgroundInput]);
    qrCaption.textContent = "Increase color contrast to make the code easier to scan.";
    return;
  }

  currentPayload = built.payload;
  previewPlaceholder.textContent = "Generating preview…";
  setPreviewVisible(false);

  try {
    renderQrCode(currentPayload);
    if (generation !== currentGeneration) return;
    qrCanvas.setAttribute("aria-label", `QR code preview for ${qrTypeSelect.options[qrTypeSelect.selectedIndex].text}`);
    previewFrame.style.setProperty("--qr-background", backgroundInput.value);
    qrCaption.textContent = `${qrTypeSelect.options[qrTypeSelect.selectedIndex].text} encoded locally at ${qrCanvas.width} × ${qrCanvas.height} px. This is the largest crisp whole-pixel output that fits the selected size.`;
    setPreviewVisible(true);
  } catch (error) {
    if (generation !== currentGeneration) return;
    currentPayload = "";
    setPreviewVisible(false);
    previewPlaceholder.textContent = "This content could not be encoded with these settings.";
    showQrError(error instanceof Error && error.message.includes("larger image size")
      ? error.message
      : "This content could not be encoded. Try shorter text or another error-correction level.");
    qrCaption.textContent = "The QR code could not be generated with these settings.";
  }
}

function downloadBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = objectUrl;
  downloadLink.download = filename;
  downloadLink.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function downloadPng() {
  if (!currentPayload || qrCanvas.hidden) return;
  qrCanvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, "neon-core-qr-code.png");
  }, "image/png");
}

function downloadSvg() {
  if (!currentPayload || qrCanvas.hidden || !currentQrCode || !currentQrRenderSettings) return;
  try {
    const svgMarkup = currentQrCode.createSvgTag(currentQrRenderSettings.cellSize, currentQrRenderSettings.margin, "NEON//CORE QR code")
      .replace('fill="white"', `fill="${backgroundInput.value}"`)
      .replace('fill="black"', `fill="${foregroundInput.value}"`);
    downloadBlob(new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" }), "neon-core-qr-code.svg");
  } catch {
    showQrError("SVG export failed. Try PNG or reduce the content length.");
  }
}

function resetGenerator() {
  qrForm.reset();
  currentPayload = "";
  currentQrCode = null;
  currentQrRenderSettings = null;
  ++currentGeneration;
  clearQrError();
  libraryError.hidden = true;
  setPreviewVisible(false);
  previewPlaceholder.textContent = "Choose a content type and enter its details to build a QR code.";
  qrCaption.textContent = "Preview updates in your browser. Content is not saved or uploaded.";
  updateQrPreview(false);
}

qrForm.addEventListener("input", updateQrPreview);
qrForm.addEventListener("change", updateQrPreview);
pngButton.addEventListener("click", downloadPng);
svgButton.addEventListener("click", downloadSvg);
resetButton.addEventListener("click", resetGenerator);
qrTypeSelect.addEventListener("change", updateQrPreview);
wifiEncryptionSelect.addEventListener("change", updateQrPreview);

updateQrPreview(false);
```

## Existing-file Changes

### Homepage directory (`js/script.js`)

The existing QR tool record keeps its ID (`qr-code-generator`) and is now actionable:

```javascript
{
  name: "QR Code Generator",
  id: "qr-code-generator",
  category: "everyday",
  description: "Turn a link or a short message into a scannable code.",
  keywords: "link url quick response scan",
  href: "tools/qr-code-generator.html",
},
```

This lets the existing renderer display “Ready to use,” link to the page, and retain favorites/recent behavior with the established ID.

### Shared component styles (`css/tool-pages.css`)

Added QR layout classes using existing CSS tokens: `.qr-utility-shell`, `.qr-layout`, `.qr-textarea`, `.qr-color-row`, `.color-field`, `.check-option`, `.qr-preview-panel`, `.qr-preview-frame`, `.qr-download-actions`, `.qr-privacy-note`, and `.qr-library-error`. The QR panels stack at the existing `760px` calculator breakpoint; QR styles tighten at `640px`. The `[hidden]` canvas override is intentional so its base `display: block` rule cannot make an invalid/empty preview visible.

### Shared navigation

No shared navigation implementation was modified. The page uses the existing utility-page header links and loads `js/platform.js` with `data-tool-id="qr-code-generator"` for theme, mobile navigation, and recent-tool integration.

### README

`README.md` now lists the QR page/script and explains the `qrcode-generator` dependency, formats, privacy, CDN requirement, and scanner compatibility caveat.

## Dependency

- `qrcode-generator` v2.0.4, MIT licensed.
- Loaded from jsDelivr using the standalone browser bundle `dist/qrcode.js`.
- The package supplies UTF-8 byte encoding, QR matrix generation, and SVG path generation. The app paints that same matrix to canvas for the preview and PNG.
- No framework, backend, account, API, or user-content upload was added.

## Testing Report

Tested in the browser:

- URL payload normalizes a URL with spaces and Unicode query characters to percent-encoded form.
- Plain text preserves Unicode, punctuation, and line breaks in the payload.
- Email creates a `mailto:` payload with encoded subject and body.
- Phone creates a normalized `tel:` payload.
- Wi-Fi produces an escaped `WIFI:` payload for SSID/password punctuation and hidden-network flag.
- SMS produces the documented `sms:number:encoded-message` payload with UTF-8/punctuation encoding.
- Blank initial form shows no validation alert; color customization rejects identical/low-contrast colors and hides the canvas; reset clears content and disables exports.
- Custom colors and error level generate a live canvas preview.
- PNG Blob has the PNG file signature and expected filename; SVG Blob has the expected MIME type, matching preview dimensions, and selected colors.
- No `qr-code-content` LocalStorage entry was present; only the existing platform preference/recent tool ID is used.
- The QR page showed no horizontal overflow at 320, 375, 640, 760, 768, 900, and 1280px. Workspace diagnostics reported no errors.

The browser automation did not provide a native download event, so the generated Blob contents and download-handler metadata were checked instead of observing the OS/browser save prompt. The generated codes were not scanned with a physical camera or separate QR reader.

## Known Limitations

- The QR library is loaded from jsDelivr, so first use requires a network connection. If the CDN is unavailable, the page displays a library-unavailable message.
- The selected image size is a maximum; QR modules use whole-pixel cells for crisp rendering, so the actual dimensions can be slightly smaller and are displayed in the preview caption.
- SMS and Wi-Fi action handling varies by scanner/device. Verify payload behavior with the scanners your audience uses.
- QR codes can encode unsafe URLs or sensitive data. The generator does not certify destinations; users should verify the code and avoid sharing sensitive QR images publicly.
