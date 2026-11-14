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
const qrWarning = document.querySelector("#qr-warning");
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
const activeDownloadUrls = new Set();

window.addEventListener("pagehide", () => {
  activeDownloadUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
  activeDownloadUrls.clear();
}, { once: true });

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

function clearQrWarning() {
  qrWarning.hidden = true;
  qrWarning.textContent = "";
}

function encodeEmailAddress(address) {
  return encodeURIComponent(address).replace(/%40/gi, "@");
}

function normalizePhoneNumber(input, invalidFields) {
  const rawValue = input.value.trim();
  let parenthesisDepth = 0;
  let parenthesesAreBalanced = true;
  for (const character of rawValue) {
    if (character === "(") {
      parenthesisDepth += 1;
      if (parenthesisDepth > 1) parenthesesAreBalanced = false;
    } else if (character === ")") {
      parenthesisDepth -= 1;
      if (parenthesisDepth < 0) parenthesesAreBalanced = false;
    }
  }

  if (!/^\+?[0-9\s().-]+$/.test(rawValue) || !parenthesesAreBalanced || parenthesisDepth !== 0 || /\(\s*\)/.test(rawValue)) {
    invalidFields.push(input);
    return null;
  }

  let normalized = rawValue.replace(/[\s().-]/g, "");
  const isInternational = normalized.startsWith("+") || normalized.startsWith("00");
  if (normalized.startsWith("00")) normalized = `+${normalized.slice(2)}`;
  const digits = normalized.startsWith("+") ? normalized.slice(1) : normalized;
  if (digits.length < 7 || digits.length > 15 || (isInternational && !/^[1-9]/.test(digits))) {
    invalidFields.push(input);
    return null;
  }
  return normalized;
}

function isValidEmailAddress(address) {
  if (address.length > 254 || /\s/.test(address)) return false;
  const separator = address.lastIndexOf("@");
  if (separator <= 0 || separator !== address.indexOf("@")) return false;

  const localPart = address.slice(0, separator);
  const domain = address.slice(separator + 1);
  const localPartPattern = /^[\p{L}\p{N}\p{M}!#$%&'*+/=?^_`{|}~-]+(?:\.[\p{L}\p{N}\p{M}!#$%&'*+/=?^_`{|}~-]+)*$/u;
  if (localPart.length > 64 || !localPartPattern.test(localPart) || !domain.includes(".")) return false;

  try {
    const asciiDomain = new URL(`https://${domain}`).hostname;
    return asciiDomain.length <= 253 && asciiDomain.split(".").every((label) =>
      label.length >= 1 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label));
  } catch {
    return false;
  }
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
    if (!isValidEmailAddress(address)) {
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
    if (!phone) return { error: "Enter a phone number with 7 to 15 digits. You can use + or 00 for an international number and common separators.", invalidFields };
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
    if (!phone) return { error: "Enter a phone number with 7 to 15 digits. You can use + or 00 for an international number and common separators.", invalidFields };
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
  const lighterLuminance = Math.max(foregroundLuminance, backgroundLuminance);
  const darkerLuminance = Math.min(foregroundLuminance, backgroundLuminance);
  const contrastRatio = (lighterLuminance + 0.05) / (darkerLuminance + 0.05);
  return contrastRatio >= 4.5;
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

function createSvgMarkup() {
  const { cellSize, margin } = currentQrRenderSettings;
  const imageSize = qrCanvas.width;
  const pathSegments = [];

  for (let row = 0; row < currentQrCode.getModuleCount(); row += 1) {
    for (let column = 0; column < currentQrCode.getModuleCount();) {
      if (!currentQrCode.isDark(row, column)) {
        column += 1;
        continue;
      }

      const startColumn = column;
      while (column < currentQrCode.getModuleCount() && currentQrCode.isDark(row, column)) column += 1;
      const x = margin + startColumn * cellSize;
      const y = margin + row * cellSize;
      const runWidth = (column - startColumn) * cellSize;
      pathSegments.push(`M${x} ${y}h${runWidth}v${cellSize}h-${runWidth}z`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${imageSize}" height="${imageSize}" viewBox="0 0 ${imageSize} ${imageSize}" role="img" aria-label="NEON//CORE QR code"><rect width="100%" height="100%" fill="${backgroundInput.value}"/><path fill="${foregroundInput.value}" d="${pathSegments.join("")}"/></svg>`;
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
  clearQrWarning();
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
    showQrError("Choose colors with at least 4.5:1 contrast for reliable scanning.", [foregroundInput, backgroundInput]);
    qrCaption.textContent = "Increase color contrast to make the code easier to scan.";
    return;
  }

  if (colorLuminance(foregroundInput.value) > colorLuminance(backgroundInput.value)) {
    qrWarning.textContent = "For best scanner compatibility, use a darker foreground and a lighter background.";
    qrWarning.hidden = false;
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
  activeDownloadUrls.add(objectUrl);
  const downloadLink = document.createElement("a");
  downloadLink.href = objectUrl;
  downloadLink.download = filename;
  downloadLink.hidden = true;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  const cleanup = () => {
    if (activeDownloadUrls.delete(objectUrl)) URL.revokeObjectURL(objectUrl);
  };
  setTimeout(cleanup, 30000);
  requestAnimationFrame(() => requestAnimationFrame(cleanup));
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
    const svgMarkup = createSvgMarkup();
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
  clearQrWarning();
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