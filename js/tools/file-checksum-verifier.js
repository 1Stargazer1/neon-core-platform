const MAX_FILE_SIZE = 100 * 1024 * 1024;
const FILE_SIZE_LIMIT_LABEL = "100 MiB";

const fileInput = document.querySelector("#file-input");
const dropZone = document.querySelector("#checksum-drop-zone");
const fileInfo = document.querySelector("#checksum-file-info");
const fileError = document.querySelector("#file-error");
const clearFileButton = document.querySelector("#clear-file-button");
const algorithmSelect = document.querySelector("#checksum-algorithm");
const cryptoSupportNote = document.querySelector("#crypto-support-note");
const expectedChecksumInput = document.querySelector("#expected-checksum");
const expectedChecksumError = document.querySelector("#expected-checksum-error");
const calculateButton = document.querySelector("#calculate-checksum-button");
const resetButton = document.querySelector("#reset-checksum-button");
const checksumStatus = document.querySelector("#checksum-status");
const processingIndicator = document.querySelector("#checksum-processing");
const checksumError = document.querySelector("#checksum-error");
const checksumOutput = document.querySelector("#calculated-checksum");
const copyButton = document.querySelector("#copy-checksum-button");
const copyFeedback = document.querySelector("#copy-checksum-feedback");
const comparisonResult = document.querySelector("#checksum-comparison");

let selectedFile = null;
let calculatedChecksum = "";
let isProcessing = false;
let operationVersion = 0;

function isHashingAvailable() {
  return window.isSecureContext === true
    && Boolean(window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === "function");
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KiB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function setFileError(message) {
  fileError.textContent = message;
  fileError.hidden = !message;
}

function setChecksumError(message) {
  checksumError.textContent = message;
  checksumError.hidden = !message;
}

function clearCalculatedResult() {
  calculatedChecksum = "";
  checksumOutput.value = "";
  copyButton.disabled = true;
  copyFeedback.textContent = "";
  comparisonResult.textContent = "No comparison yet.";
  comparisonResult.removeAttribute("data-result");
  setChecksumError("");
}

function updateControls() {
  clearFileButton.disabled = !selectedFile && fileError.hidden;
  calculateButton.disabled = isProcessing || !selectedFile || !isHashingAvailable();

  if (window.isSecureContext !== true) {
    cryptoSupportNote.textContent = "Hashing requires a secure browser context (HTTPS or a secure local origin).";
  } else if (!window.crypto || !window.crypto.subtle || typeof window.crypto.subtle.digest !== "function") {
    cryptoSupportNote.textContent = "This browser does not support the native Web Crypto digest API.";
  } else {
    cryptoSupportNote.textContent = "Hashing runs locally in this secure browser context using the native Web Crypto API.";
  }
}

function validateExpectedChecksum() {
  const value = expectedChecksumInput.value.trim();
  if (value === "") {
    return { value: "", error: "" };
  }

  if (!/^[0-9a-f]+$/i.test(value)) {
    return { value: "", error: "Use hexadecimal characters only (0-9 and A-F)." };
  }

  const expectedLength = algorithmSelect.value === "SHA-256" ? 64 : 128;
  if (value.length !== expectedLength) {
    return { value: "", error: `${algorithmSelect.value} checksums must contain exactly ${expectedLength} hexadecimal characters.` };
  }

  return { value: value.toLowerCase(), error: "" };
}

function updateComparison() {
  const expected = validateExpectedChecksum();
  expectedChecksumError.textContent = expected.error;
  expectedChecksumError.hidden = !expected.error;

  if (expected.error) {
    expectedChecksumInput.setAttribute("aria-invalid", "true");
    comparisonResult.textContent = "Correct the expected checksum before comparing.";
    comparisonResult.removeAttribute("data-result");
    return;
  }

  expectedChecksumInput.removeAttribute("aria-invalid");
  if (expected.value === "") {
    comparisonResult.textContent = calculatedChecksum
      ? "Checksum calculated. Enter an expected checksum to compare."
      : "No comparison yet.";
    comparisonResult.removeAttribute("data-result");
    return;
  }

  if (calculatedChecksum === "") {
    comparisonResult.textContent = "Expected checksum is valid. Calculate the file checksum to compare.";
    comparisonResult.removeAttribute("data-result");
    return;
  }

  const matches = expected.value === calculatedChecksum;
  comparisonResult.textContent = matches ? "MATCH" : "MISMATCH";
  comparisonResult.dataset.result = matches ? "match" : "mismatch";
}

function invalidateCurrentResult(message) {
  operationVersion++;
  clearCalculatedResult();
  if (isProcessing) {
    processingIndicator.textContent = "The current selection changed. The previous calculation will be discarded.";
    processingIndicator.hidden = false;
  } else {
    processingIndicator.hidden = true;
  }
  checksumStatus.textContent = message;
  updateComparison();
  updateControls();
}

function selectFile(file) {
  invalidateCurrentResult("File selection updated.");
  setFileError("");

  if (!file) {
    selectedFile = null;
    fileInfo.textContent = "No file selected.";
    checksumStatus.textContent = "Select one file to begin.";
    updateControls();
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    selectedFile = null;
    fileInput.value = "";
    fileInfo.textContent = `${file.name} | ${formatFileSize(file.size)}`;
    setFileError(`This file exceeds the ${FILE_SIZE_LIMIT_LABEL} limit and was not read.`);
    checksumStatus.textContent = "Choose a file at or below the size limit.";
    updateControls();
    return;
  }

  selectedFile = file;
  fileInfo.textContent = `${file.name} | ${formatFileSize(file.size)}`;
  checksumStatus.textContent = "File selected. Choose an algorithm and calculate its checksum.";
  updateControls();
}

function handleFileSelection() {
  const files = fileInput.files;
  if (files && files.length > 0) {
    selectFile(files[0]);
  }
}

function bytesToHex(bytes) {
  let hexadecimal = "";
  for (const byte of bytes) {
    hexadecimal += byte.toString(16).padStart(2, "0");
  }
  return hexadecimal;
}

async function calculateChecksum() {
  if (isProcessing) {
    return;
  }

  if (!selectedFile) {
    setFileError("Choose a file before calculating a checksum.");
    updateControls();
    return;
  }

  if (selectedFile.size > MAX_FILE_SIZE) {
    setFileError(`This file exceeds the ${FILE_SIZE_LIMIT_LABEL} limit and was not read.`);
    selectedFile = null;
    updateControls();
    return;
  }

  if (!isHashingAvailable()) {
    setChecksumError("Hashing is unavailable. Use Web Crypto in a secure browser context; no fallback is used.");
    updateControls();
    return;
  }

  let fileSnapshot = selectedFile;
  let fileBuffer = null;
  let digestBuffer = null;
  let digestBytes = null;
  let processingPhase = "read";
  const algorithm = algorithmSelect.value;
  const thisOperation = ++operationVersion;

  clearCalculatedResult();
  isProcessing = true;
  processingIndicator.textContent = `Calculating ${algorithm} locally...`;
  processingIndicator.hidden = false;
  checksumStatus.textContent = "Processing file contents in this browser.";
  updateControls();

  try {
    if (typeof fileSnapshot.arrayBuffer !== "function") {
      throw new Error("This browser cannot read the selected file as binary data.");
    }

    fileBuffer = await fileSnapshot.arrayBuffer();
    if (thisOperation !== operationVersion) {
      return;
    }

    processingPhase = "hash";
    digestBuffer = await window.crypto.subtle.digest(algorithm, fileBuffer);
    if (thisOperation !== operationVersion) {
      return;
    }

    digestBytes = new Uint8Array(digestBuffer);
    calculatedChecksum = bytesToHex(digestBytes);
    checksumOutput.value = calculatedChecksum;
    copyButton.disabled = false;
    checksumStatus.textContent = `${algorithm} checksum calculated locally.`;
    updateComparison();
  } catch {
    if (thisOperation === operationVersion) {
      clearCalculatedResult();
      setChecksumError(processingPhase === "read"
        ? "The selected file could not be read. Choose it again or try another file."
        : "The checksum could not be calculated. Check browser support and try again.");
      checksumStatus.textContent = "No checksum was produced.";
    }
  } finally {
    fileSnapshot = null;
    fileBuffer = null;
    digestBytes = null;
    digestBuffer = null;
    isProcessing = false;
    processingIndicator.hidden = true;
    updateControls();
  }
}

async function copyChecksum() {
  if (calculatedChecksum === "") {
    copyFeedback.textContent = "Calculate a checksum before copying.";
    return;
  }

  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
    copyFeedback.textContent = "Clipboard access is unavailable in this browser.";
    return;
  }

  try {
    await navigator.clipboard.writeText(calculatedChecksum);
    copyFeedback.textContent = "Checksum copied.";
  } catch {
    copyFeedback.textContent = "Copy failed. Check clipboard permission or select and copy the checksum manually.";
  }
}

function clearFile() {
  selectedFile = null;
  fileInput.value = "";
  fileInfo.textContent = "No file selected.";
  setFileError("");
  invalidateCurrentResult("File cleared. Select a file to begin.");
}

function resetVerifier() {
  selectedFile = null;
  fileInput.value = "";
  algorithmSelect.value = "SHA-256";
  expectedChecksumInput.value = "";
  fileInfo.textContent = "No file selected.";
  setFileError("");
  expectedChecksumInput.removeAttribute("aria-invalid");
  copyFeedback.textContent = "";
  invalidateCurrentResult("Verifier reset. Select a file to begin.");
}

fileInput.addEventListener("change", handleFileSelection);
clearFileButton.addEventListener("click", clearFile);
resetButton.addEventListener("click", resetVerifier);
calculateButton.addEventListener("click", calculateChecksum);
copyButton.addEventListener("click", copyChecksum);
algorithmSelect.addEventListener("change", () => {
  invalidateCurrentResult("Algorithm changed. Calculate the checksum again.");
});
expectedChecksumInput.addEventListener("input", updateComparison);

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});
dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  const files = event.dataTransfer && event.dataTransfer.files;
  if (!files || files.length !== 1) {
    fileInput.value = "";
    selectFile(null);
    setFileError("Drop one file at a time.");
    return;
  }

  fileInput.value = "";
  selectFile(files[0]);
});

updateComparison();
updateControls();
