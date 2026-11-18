const widthInput = document.querySelector("#width-input");
const heightInput = document.querySelector("#height-input");
const diagonalInput = document.querySelector("#diagonal-input");

const widthError = document.querySelector("#width-error");
const heightError = document.querySelector("#height-error");
const diagonalError = document.querySelector("#diagonal-error");

const ppiOutput = document.querySelector("#ppi-output");
const pixelPitchOutput = document.querySelector("#pixel-pitch-output");
const widthPhysicalOutput = document.querySelector("#width-output");
const heightPhysicalOutput = document.querySelector("#height-output");
const aspectOutput = document.querySelector("#aspect-output");

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function simplifyAspectRatio(width, height) {
  const divisor = gcd(Math.round(width), Math.round(height));
  return `${Math.round(width) / divisor}:${Math.round(height) / divisor}`;
}

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

function validateAndCalculate() {
  const width = Number(widthInput.value.trim());
  const height = Number(heightInput.value.trim());
  const diagonal = Number(diagonalInput.value.trim());

  let hasError = false;

  // Validate width
  if (widthInput.value.trim() === "" || !Number.isFinite(width)) {
    showError(widthError, widthInput, "Enter a horizontal resolution.");
    hasError = true;
  } else if (width <= 0) {
    showError(widthError, widthInput, "Resolution must be greater than zero.");
    hasError = true;
  } else if (!Number.isInteger(width)) {
    showError(widthError, widthInput, "Resolution must be a whole number.");
    hasError = true;
  } else if (width > 1e6) {
    showError(widthError, widthInput, "That value is unrealistically large.");
    hasError = true;
  } else {
    clearError(widthError, widthInput);
  }

  // Validate height
  if (heightInput.value.trim() === "" || !Number.isFinite(height)) {
    showError(heightError, heightInput, "Enter a vertical resolution.");
    hasError = true;
  } else if (height <= 0) {
    showError(heightError, heightInput, "Resolution must be greater than zero.");
    hasError = true;
  } else if (!Number.isInteger(height)) {
    showError(heightError, heightInput, "Resolution must be a whole number.");
    hasError = true;
  } else if (height > 1e6) {
    showError(heightError, heightInput, "That value is unrealistically large.");
    hasError = true;
  } else {
    clearError(heightError, heightInput);
  }

  // Validate diagonal
  if (diagonalInput.value.trim() === "" || !Number.isFinite(diagonal)) {
    showError(diagonalError, diagonalInput, "Enter a diagonal screen size.");
    hasError = true;
  } else if (diagonal <= 0) {
    showError(diagonalError, diagonalInput, "Screen size must be greater than zero.");
    hasError = true;
  } else if (diagonal > 1000) {
    showError(diagonalError, diagonalInput, "That screen size is unrealistically large.");
    hasError = true;
  } else {
    clearError(diagonalError, diagonalInput);
  }

  if (hasError) {
    ppiOutput.textContent = "—";
    pixelPitchOutput.textContent = "—";
    widthPhysicalOutput.textContent = "—";
    heightPhysicalOutput.textContent = "—";
    aspectOutput.textContent = "—";
    return;
  }

  // Calculate PPI
  const diagonalPixels = Math.sqrt(width * width + height * height);
  const ppi = diagonalPixels / diagonal;

  if (!Number.isFinite(ppi)) {
    ppiOutput.textContent = "—";
    pixelPitchOutput.textContent = "—";
    widthPhysicalOutput.textContent = "—";
    heightPhysicalOutput.textContent = "—";
    aspectOutput.textContent = "—";
    return;
  }

  // Calculate pixel pitch in mm
  const pixelPitch = 25.4 / ppi;

  // Calculate physical dimensions
  const widthInches = (diagonal * width) / diagonalPixels;
  const heightInches = (diagonal * height) / diagonalPixels;
  const widthCm = widthInches * 2.54;
  const heightCm = heightInches * 2.54;

  // Calculate aspect ratio
  const aspectRatio = simplifyAspectRatio(width, height);

  // Update outputs
  ppiOutput.textContent = formatNumber(ppi, 2);
  pixelPitchOutput.textContent = `${formatNumber(pixelPitch, 3)} mm`;
  widthPhysicalOutput.textContent = `${formatNumber(widthCm, 1)} cm`;
  heightPhysicalOutput.textContent = `${formatNumber(heightCm, 1)} cm`;
  aspectOutput.textContent = aspectRatio;
}

widthInput.addEventListener("input", validateAndCalculate);
heightInput.addEventListener("input", validateAndCalculate);
diagonalInput.addEventListener("input", validateAndCalculate);

// Initial calculation
validateAndCalculate();
