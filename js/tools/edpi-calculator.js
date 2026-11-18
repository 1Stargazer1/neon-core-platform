const dpiInput = document.querySelector("#dpi-input");
const sensitivityInput = document.querySelector("#sensitivity-input");
const dpiError = document.querySelector("#dpi-error");
const sensitivityError = document.querySelector("#sensitivity-error");
const edpiOutput = document.querySelector("#edpi-output");

const currentDpiInput = document.querySelector("#current-dpi-input");
const currentSensInput = document.querySelector("#current-sens-input");
const targetDpiInput = document.querySelector("#target-dpi-input");
const currentDpiError = document.querySelector("#current-dpi-error");
const currentSensError = document.querySelector("#current-sens-error");
const targetDpiError = document.querySelector("#target-dpi-error");
const currentEdpiOutput = document.querySelector("#current-edpi-output");
const targetSensOutput = document.querySelector("#target-sens-output");

function formatNumber(value, decimals = 2) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1e12 || (value > 0 && value < 1e-6)) {
    return value.toExponential(2);
  }
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function clearError(errorElement, inputElement) {
  errorElement.hidden = true;
  errorElement.textContent = "";
  inputElement.removeAttribute("aria-invalid");
  inputElement.removeAttribute("aria-describedby");
}

function showError(errorElement, inputElement, message) {
  errorElement.textContent = message;
  errorElement.hidden = false;
  inputElement.setAttribute("aria-invalid", "true");
  inputElement.setAttribute("aria-describedby", errorElement.id);
}

function validateAndCalculateEdpi() {
  const dpi = Number(dpiInput.value.trim());
  const sensitivity = Number(sensitivityInput.value.trim());

  let hasError = false;

  // Validate DPI
  if (dpiInput.value.trim() === "" || !Number.isFinite(dpi)) {
    showError(dpiError, dpiInput, "Enter a DPI value.");
    hasError = true;
  } else if (dpi < 0) {
    showError(dpiError, dpiInput, "DPI cannot be negative.");
    hasError = true;
  } else if (dpi === 0) {
    showError(dpiError, dpiInput, "DPI must be greater than zero.");
    hasError = true;
  } else if (dpi > 1e6) {
    showError(dpiError, dpiInput, "That DPI value is unrealistically large.");
    hasError = true;
  } else {
    clearError(dpiError, dpiInput);
  }

  // Validate sensitivity
  if (sensitivityInput.value.trim() === "" || !Number.isFinite(sensitivity)) {
    showError(sensitivityError, sensitivityInput, "Enter a sensitivity value.");
    hasError = true;
  } else if (sensitivity < 0) {
    showError(sensitivityError, sensitivityInput, "Sensitivity cannot be negative.");
    hasError = true;
  } else if (sensitivity > 1e6) {
    showError(sensitivityError, sensitivityInput, "That sensitivity value is unrealistically large.");
    hasError = true;
  } else {
    clearError(sensitivityError, sensitivityInput);
  }

  if (hasError) {
    edpiOutput.textContent = "—";
    return;
  }

  const edpi = dpi * sensitivity;

  if (!Number.isFinite(edpi)) {
    edpiOutput.textContent = "—";
    return;
  }

  edpiOutput.textContent = formatNumber(edpi, 0);

  // Also update comparison section
  validateAndCalculateComparison();
}

function validateAndCalculateComparison() {
  const currentDpi = Number(currentDpiInput.value.trim());
  const currentSens = Number(currentSensInput.value.trim());
  const targetDpi = Number(targetDpiInput.value.trim());

  let hasError = false;

  // Validate current DPI
  if (currentDpiInput.value.trim() === "" || !Number.isFinite(currentDpi)) {
    showError(currentDpiError, currentDpiInput, "Enter a DPI value.");
    hasError = true;
  } else if (currentDpi < 0) {
    showError(currentDpiError, currentDpiInput, "DPI cannot be negative.");
    hasError = true;
  } else if (currentDpi === 0) {
    showError(currentDpiError, currentDpiInput, "DPI must be greater than zero.");
    hasError = true;
  } else if (currentDpi > 1e6) {
    showError(currentDpiError, currentDpiInput, "That DPI value is unrealistically large.");
    hasError = true;
  } else {
    clearError(currentDpiError, currentDpiInput);
  }

  // Validate current sensitivity
  if (currentSensInput.value.trim() === "" || !Number.isFinite(currentSens)) {
    showError(currentSensError, currentSensInput, "Enter a sensitivity value.");
    hasError = true;
  } else if (currentSens < 0) {
    showError(currentSensError, currentSensInput, "Sensitivity cannot be negative.");
    hasError = true;
  } else if (currentSens > 1e6) {
    showError(currentSensError, currentSensInput, "That sensitivity value is unrealistically large.");
    hasError = true;
  } else {
    clearError(currentSensError, currentSensInput);
  }

  // Validate target DPI
  if (targetDpiInput.value.trim() === "" || !Number.isFinite(targetDpi)) {
    showError(targetDpiError, targetDpiInput, "Enter a DPI value.");
    hasError = true;
  } else if (targetDpi < 0) {
    showError(targetDpiError, targetDpiInput, "DPI cannot be negative.");
    hasError = true;
  } else if (targetDpi === 0) {
    showError(targetDpiError, targetDpiInput, "DPI must be greater than zero.");
    hasError = true;
  } else if (targetDpi > 1e6) {
    showError(targetDpiError, targetDpiInput, "That DPI value is unrealistically large.");
    hasError = true;
  } else {
    clearError(targetDpiError, targetDpiInput);
  }

  if (hasError) {
    currentEdpiOutput.textContent = "—";
    targetSensOutput.textContent = "—";
    return;
  }

  const currentEdpi = currentDpi * currentSens;

  if (!Number.isFinite(currentEdpi)) {
    currentEdpiOutput.textContent = "—";
    targetSensOutput.textContent = "—";
    return;
  }

  const targetSens = currentEdpi / targetDpi;

  if (!Number.isFinite(targetSens)) {
    currentEdpiOutput.textContent = "—";
    targetSensOutput.textContent = "—";
    return;
  }

  currentEdpiOutput.textContent = formatNumber(currentEdpi, 0);
  targetSensOutput.textContent = formatNumber(targetSens, 2);
}

// Event listeners for eDPI calculator
dpiInput.addEventListener("input", validateAndCalculateEdpi);
sensitivityInput.addEventListener("input", validateAndCalculateEdpi);

// Event listeners for comparison section
currentDpiInput.addEventListener("input", validateAndCalculateComparison);
currentSensInput.addEventListener("input", validateAndCalculateComparison);
targetDpiInput.addEventListener("input", validateAndCalculateComparison);

// Initial calculations
validateAndCalculateEdpi();
validateAndCalculateComparison();
