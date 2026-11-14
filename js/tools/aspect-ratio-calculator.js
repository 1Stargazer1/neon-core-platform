const ratioModeInputs = document.querySelectorAll('input[name="ratio-mode"]');
const simplifyInputs = document.querySelector("#simplify-inputs");
const missingInputs = document.querySelector("#missing-inputs");
const pixelWidthInput = document.querySelector("#pixel-width");
const pixelHeightInput = document.querySelector("#pixel-height");
const ratioWidthInput = document.querySelector("#ratio-width");
const ratioHeightInput = document.querySelector("#ratio-height");
const knownDimensionInput = document.querySelector("#known-dimension");
const knownSideSelect = document.querySelector("#known-side");
const resultOutput = document.querySelector("#ratio-result");
const equationOutput = document.querySelector("#ratio-equation");
const captionOutput = document.querySelector("#ratio-caption");
const explanationOutput = document.querySelector("#ratio-explanation");
const errorMessage = document.querySelector("#ratio-error");

function greatestCommonDivisor(firstNumber, secondNumber) {
  let largerNumber = firstNumber;
  let smallerNumber = secondNumber;

  while (smallerNumber !== 0) {
    const remainder = largerNumber % smallerNumber;
    largerNumber = smallerNumber;
    smallerNumber = remainder;
  }

  return largerNumber;
}

function formatDimension(value) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 4,
  }).format(value);
}

function showRatioError(message, invalidFields) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  resultOutput.textContent = "—";
  equationOutput.textContent = "Result unavailable";
  captionOutput.textContent = "Correct the highlighted values to calculate an aspect ratio or dimension.";
  invalidFields.forEach((field) => field.setAttribute("aria-invalid", "true"));
  invalidFields.forEach((field) => field.setAttribute("aria-describedby", "ratio-error"));
}

function clearRatioError() {
  errorMessage.hidden = true;
  [pixelWidthInput, pixelHeightInput, ratioWidthInput, ratioHeightInput, knownDimensionInput]
    .forEach((field) => {
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
    });
}

function getPositiveInteger(input) {
  const rawValue = input.value.trim();
  const value = Number(rawValue);
  return rawValue !== "" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function updateRatio() {
  const mode = document.querySelector('input[name="ratio-mode"]:checked').value;
  simplifyInputs.hidden = mode !== "simplify";
  missingInputs.hidden = mode !== "missing";
  clearRatioError();

  if (mode === "simplify") {
    calculateSimplifiedRatio();
  } else {
    calculateMissingDimension();
  }
}

function calculateSimplifiedRatio() {
  const width = getPositiveInteger(pixelWidthInput);
  const height = getPositiveInteger(pixelHeightInput);
  const invalidFields = [];

  if (width === null) invalidFields.push(pixelWidthInput);
  if (height === null) invalidFields.push(pixelHeightInput);
  if (invalidFields.length > 0) {
    showRatioError("Enter whole-number pixel dimensions greater than zero.", invalidFields);
    return;
  }

  const divisor = greatestCommonDivisor(width, height);
  resultOutput.textContent = `${width / divisor}:${height / divisor}`;
  equationOutput.textContent = `${new Intl.NumberFormat().format(width)} × ${new Intl.NumberFormat().format(height)} pixels`;
  captionOutput.textContent = "The two dimensions have been reduced to their simplest whole-number ratio.";
  explanationOutput.textContent = `The greatest common divisor (${new Intl.NumberFormat().format(divisor)}) divides both dimensions by the same amount.`;
}

function calculateMissingDimension() {
  const ratioWidth = getPositiveInteger(ratioWidthInput);
  const ratioHeight = getPositiveInteger(ratioHeightInput);
  const knownDimension = getPositiveInteger(knownDimensionInput);
  const invalidFields = [];

  if (ratioWidth === null) invalidFields.push(ratioWidthInput);
  if (ratioHeight === null) invalidFields.push(ratioHeightInput);
  if (knownDimension === null) invalidFields.push(knownDimensionInput);
  if (invalidFields.length > 0) {
    showRatioError("Enter whole-number ratio parts and a dimension greater than zero.", invalidFields);
    return;
  }

  const knownSide = knownSideSelect.value;
  const missingSide = knownSide === "width" ? "height" : "width";
  const missingDimension = knownSide === "width"
    ? knownDimension * ratioHeight / ratioWidth
    : knownDimension * ratioWidth / ratioHeight;

  if (!Number.isFinite(missingDimension)) {
    showRatioError("That dimension is too large to calculate. Try smaller values.", [knownDimensionInput]);
    return;
  }

  const roundedDimension = Math.round(missingDimension);
  if (roundedDimension < 1) {
    showRatioError("That ratio would round the missing side below one pixel. Use a larger known dimension.", [knownDimensionInput]);
    return;
  }

  const ratioDivisor = greatestCommonDivisor(ratioWidth, ratioHeight);
  resultOutput.textContent = `${new Intl.NumberFormat().format(roundedDimension)} px`;
  equationOutput.textContent = `${ratioWidth / ratioDivisor}:${ratioHeight / ratioDivisor} ratio · ${formatDimension(knownDimension)} px ${knownSide}`;
  captionOutput.textContent = `Exact ${missingSide}: ${formatDimension(missingDimension)} px; rounded to ${new Intl.NumberFormat().format(roundedDimension)} whole pixels.`;
  explanationOutput.textContent = knownSide === "width"
    ? "Missing height = known width × ratio height ÷ ratio width."
    : "Missing width = known height × ratio width ÷ ratio height.";
}

ratioModeInputs.forEach((radio) => radio.addEventListener("change", updateRatio));
[pixelWidthInput, pixelHeightInput, ratioWidthInput, ratioHeightInput, knownDimensionInput]
  .forEach((input) => input.addEventListener("input", updateRatio));
knownSideSelect.addEventListener("change", updateRatio);

updateRatio();