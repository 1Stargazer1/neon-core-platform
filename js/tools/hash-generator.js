const textInput = document.querySelector("#text-input");
const textAlgorithm = document.querySelector("#text-algorithm");
const fileInput = document.querySelector("#file-input");
const fileAlgorithm = document.querySelector("#file-algorithm");
const fileError = document.querySelector("#file-error");
const fileInfoField = document.querySelector("#file-info-field");
const fileName = document.querySelector("#file-name");
const fileSize = document.querySelector("#file-size");

const hashOutput = document.querySelector("#hash-output");
const copyHashButton = document.querySelector("#copy-hash-button");
const clearHashButton = document.querySelector("#clear-hash-button");

const checksumSection = document.querySelector("#checksum-section");
const expectedHashInput = document.querySelector("#expected-hash");
const verifyForm = document.querySelector("#verify-form");
const verifyError = document.querySelector("#verify-error");
const verifyResult = document.querySelector("#verify-result");
const verifyOutput = document.querySelector("#verify-output");

const tabButtons = document.querySelectorAll("[role='tab']");
const tabPanels = document.querySelectorAll("[role='tabpanel']");

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
let currentHash = null;
let currentAlgorithm = null;

function normalizeAlgorithm(algo) {
  const algorithmMap = {
    "SHA-1": "SHA-1",
    "SHA-256": "SHA-256",
    "SHA-384": "SHA-384",
    "SHA-512": "SHA-512",
  };
  return algorithmMap[algo] || algo;
}

async function hashText(text, algorithm) {
  if (!window.crypto || !window.crypto.subtle) {
    return "Web Crypto API unavailable";
  }

  const algo = normalizeAlgorithm(algorithm);
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  try {
    const buffer = await window.crypto.subtle.digest(algo, data);
    const hashArray = Array.from(new Uint8Array(buffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

async function hashFile(file, algorithm) {
  if (!window.crypto || !window.crypto.subtle) {
    return "Web Crypto API unavailable";
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB limit`);
  }

  const algo = normalizeAlgorithm(algorithm);

  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest(algo, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    throw new Error(`Failed to hash file: ${error.message}`);
  }
}

function updateHashDisplay(hash, algorithm) {
  currentHash = hash;
  currentAlgorithm = algorithm;
  hashOutput.textContent = hash;
  copyHashButton.disabled = false;
  clearHashButton.disabled = false;
  checksumSection.hidden = false;
  verifyResult.hidden = true;
  verifyOutput.textContent = "—";
  expectedHashInput.value = "";
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

async function handleTextInput() {
  const text = textInput.value;
  const algorithm = textAlgorithm.value;

  if (text === "") {
    hashOutput.textContent = "—";
    copyHashButton.disabled = true;
    clearHashButton.disabled = true;
    checksumSection.hidden = true;
    return;
  }

  const hash = await hashText(text, algorithm);
  updateHashDisplay(hash, algorithm);
}

async function handleFileSelect() {
  const file = fileInput.files[0];
  fileError.hidden = true;
  fileError.textContent = "";
  fileInfoField.hidden = true;
  hashOutput.textContent = "—";
  copyHashButton.disabled = true;
  clearHashButton.disabled = true;
  checksumSection.hidden = true;

  if (!file) {
    return;
  }

  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  fileInfoField.hidden = false;

  const algorithm = fileAlgorithm.value;

  try {
    const hash = await hashFile(file, algorithm);
    updateHashDisplay(hash, algorithm);
  } catch (error) {
    fileError.textContent = error.message;
    fileError.hidden = false;
    hashOutput.textContent = "—";
    copyHashButton.disabled = true;
    clearHashButton.disabled = true;
    checksumSection.hidden = true;
  }
}

function validateHexHash(hash, expectedLength) {
  if (!hash || hash.length !== expectedLength) {
    return false;
  }
  return /^[0-9a-fA-F]+$/.test(hash);
}

function compareHashes() {
  if (!currentHash) {
    verifyError.textContent = "No hash computed yet.";
    verifyError.hidden = false;
    verifyResult.hidden = true;
    return;
  }

  const expectedHash = expectedHashInput.value.trim().toLowerCase();

  if (!expectedHash) {
    verifyResult.hidden = true;
    return;
  }

  const algorithmLengths = {
    "SHA-256": 64,
    "SHA-384": 96,
    "SHA-512": 128,
  };

  const expectedLength = algorithmLengths[currentAlgorithm] || 64;

  if (!validateHexHash(expectedHash, expectedLength)) {
    verifyError.textContent = `Expected hash must be ${expectedLength} hexadecimal characters for ${currentAlgorithm}.`;
    verifyError.hidden = false;
    verifyResult.hidden = true;
    return;
  }

  verifyError.hidden = true;
  verifyError.textContent = "";

  const computedHashLower = currentHash.toLowerCase();
  const matches = computedHashLower === expectedHash;

  verifyResult.hidden = false;

  if (matches) {
    verifyOutput.textContent = "✓ Hashes match";
    verifyOutput.style.color = "var(--accent-color, #00ff00)";
  } else {
    verifyOutput.textContent = "✗ Hashes do not match";
    verifyOutput.style.color = "var(--error-color, #ff4444)";
  }
}

function clearAll() {
  textInput.value = "";
  fileInput.value = "";
  hashOutput.textContent = "—";
  currentHash = null;
  currentAlgorithm = null;
  copyHashButton.disabled = true;
  clearHashButton.disabled = true;
  checksumSection.hidden = true;
  fileInfoField.hidden = true;
  fileError.hidden = true;
  verifyResult.hidden = true;
  verifyOutput.textContent = "—";
  expectedHashInput.value = "";
  verifyError.hidden = true;
}

function setupTabNavigation() {
  tabButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => {
        btn.setAttribute("aria-selected", "false");
      });
      tabPanels.forEach((panel) => {
        panel.hidden = true;
      });

      button.setAttribute("aria-selected", "true");
      const panelId = button.getAttribute("aria-controls");
      document.getElementById(panelId).hidden = false;
    });

    button.addEventListener("keydown", (e) => {
      let targetIndex;
      if (e.key === "ArrowLeft") {
        targetIndex = index === 0 ? tabButtons.length - 1 : index - 1;
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        targetIndex = index === tabButtons.length - 1 ? 0 : index + 1;
        e.preventDefault();
      } else {
        return;
      }

      tabButtons[targetIndex].focus();
      tabButtons[targetIndex].click();
    });
  });
}

// Event listeners
textInput.addEventListener("input", handleTextInput);
textAlgorithm.addEventListener("change", handleTextInput);
fileInput.addEventListener("change", handleFileSelect);
fileAlgorithm.addEventListener("change", handleFileSelect);

copyHashButton.addEventListener("click", () => {
  if (currentHash && currentHash !== "—") {
    navigator.clipboard.writeText(currentHash).then(() => {
      const originalText = copyHashButton.textContent;
      copyHashButton.textContent = "Copied!";
      setTimeout(() => {
        copyHashButton.textContent = originalText;
      }, 2000);
    });
  }
});

clearHashButton.addEventListener("click", clearAll);

expectedHashInput.addEventListener("input", compareHashes);

setupTabNavigation();
