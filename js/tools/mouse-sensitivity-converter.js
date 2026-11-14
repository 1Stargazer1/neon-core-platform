const modeInputs = document.querySelectorAll('input[name="sensitivity-mode"]');
const modeContainers = {
  edpi: document.querySelector("#edpi-mode-inputs"),
  convert: document.querySelector("#convert-mode-inputs"),
  cm360: document.querySelector("#cm360-mode-inputs"),
};
const sourceGameSelect = document.querySelector("#source-game");
const targetGameSelect = document.querySelector("#target-game");
const sourceYawField = document.querySelector("#source-yaw-field");
const targetYawField = document.querySelector("#target-yaw-field");
const cm360GameSelect = document.querySelector("#cm360-game");
const cm360YawField = document.querySelector("#cm360-yaw-field");
const errorMessage = document.querySelector("#sensitivity-error");
const resultTitle = document.querySelector("#sensitivity-result-title");
const equationOutput = document.querySelector("#sensitivity-equation");
const resultOutput = document.querySelector("#sensitivity-result");
const resultCaption = document.querySelector("#sensitivity-caption");
const exampleOutput = document.querySelector("#sensitivity-example");
const gameDataNote = document.querySelector("#game-data-note");

const gameYaw = {
  cs2: { name: "Counter-Strike 2", yaw: 0.022 },
  overwatch: { name: "Overwatch", yaw: 0.0066 },
};

function formatNumber(value) {
  if (value !== 0 && (Math.abs(value) >= 1e15 || Math.abs(value) < 1e-6)) {
    return value.toExponential(3);
  }

  return new Intl.NumberFormat(undefined, {
    maximumSignificantDigits: 8,
  }).format(value);
}

function readValue(input, label, invalidFields, allowZero = false) {
  const rawValue = input.value.trim();
  const value = Number(rawValue);
  if (rawValue === "" || !Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
    invalidFields.push({ input, label, allowZero });
    return null;
  }
  return value;
}

function clearValidation() {
  document.querySelectorAll(".mode-inputs input[type='number']").forEach((input) => {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  });
  errorMessage.hidden = true;
}

function showValidationError(invalidFields) {
  clearValidation();
  const problems = invalidFields.map(({ input, label, allowZero }) => {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", "sensitivity-error");
    return `${label} ${allowZero ? "must be zero or more" : "must be greater than zero"}`;
  });
  errorMessage.textContent = `Check your values: ${problems.join("; ")}.`;
  errorMessage.hidden = false;
  equationOutput.textContent = "Result unavailable";
  resultOutput.textContent = "—";
  resultCaption.textContent = "Correct the highlighted values to calculate a result.";
}

function getYaw(gameKey, customYawInput, label, invalidFields) {
  if (gameKey !== "custom") {
    return gameYaw[gameKey].yaw;
  }
  return readValue(customYawInput, label, invalidFields);
}

function updateEdpi() {
  const dpiInput = document.querySelector("#edpi-dpi");
  const sensitivityInput = document.querySelector("#edpi-sensitivity");
  const invalidFields = [];
  const dpi = readValue(dpiInput, "Mouse DPI", invalidFields);
  const sensitivity = readValue(sensitivityInput, "In-game sensitivity", invalidFields, true);

  if (invalidFields.length) {
    showValidationError(invalidFields);
    return;
  }

  const edpi = dpi * sensitivity;
  if (!Number.isFinite(edpi)) {
    showValidationError([{ input: sensitivityInput, label: "In-game sensitivity", allowZero: true }]);
    return;
  }

  clearValidation();
  resultTitle.textContent = "Effective sensitivity.";
  equationOutput.textContent = `${formatNumber(dpi)} DPI × ${formatNumber(sensitivity)} sensitivity`;
  resultOutput.textContent = `${formatNumber(edpi)} eDPI`;
  resultCaption.textContent = "eDPI combines mouse DPI and in-game sensitivity for comparisons within the same game.";
  exampleOutput.textContent = `Example: ${formatNumber(dpi)} DPI × ${formatNumber(sensitivity)} sensitivity = ${formatNumber(edpi)} eDPI`;
}

function updateGameConversion() {
  const sourceDpiInput = document.querySelector("#source-dpi");
  const sourceSensitivityInput = document.querySelector("#source-sensitivity");
  const targetDpiInput = document.querySelector("#target-dpi");
  const sourceYawInput = document.querySelector("#source-yaw");
  const targetYawInput = document.querySelector("#target-yaw");
  const sourceKey = sourceGameSelect.value;
  const targetKey = targetGameSelect.value;
  const invalidFields = [];

  sourceYawField.hidden = sourceKey !== "custom";
  targetYawField.hidden = targetKey !== "custom";
  gameDataNote.textContent = sourceKey === "custom" || targetKey === "custom"
    ? "Enter verified yaw values for custom games. A guessed value will produce an unreliable conversion."
    : "Presets: CS2 uses the documented Source-family default yaw (0.022); Overwatch uses a published yaw value (0.0066). Updates or custom configs may differ.";

  const sourceDpi = readValue(sourceDpiInput, "Current mouse DPI", invalidFields);
  const sourceSensitivity = readValue(sourceSensitivityInput, "Current sensitivity", invalidFields, true);
  const targetDpi = readValue(targetDpiInput, "Destination mouse DPI", invalidFields);
  const sourceYaw = getYaw(sourceKey, sourceYawInput, "Source yaw", invalidFields);
  const targetYaw = getYaw(targetKey, targetYawInput, "Destination yaw", invalidFields);

  if (invalidFields.length) {
    showValidationError(invalidFields);
    return;
  }

  const convertedSensitivity = sourceDpi * sourceSensitivity * sourceYaw / (targetDpi * targetYaw);
  if (!Number.isFinite(convertedSensitivity)) {
    showValidationError([{ input: sourceSensitivityInput, label: "In-game sensitivity", allowZero: true }]);
    return;
  }

  const sourceName = sourceKey === "custom" ? "Custom yaw" : gameYaw[sourceKey].name;
  const targetName = targetKey === "custom" ? "Custom yaw" : gameYaw[targetKey].name;

  clearValidation();
  resultTitle.textContent = "Equivalent sensitivity.";
  equationOutput.textContent = `${sourceName} ${formatNumber(sourceSensitivity)} → ${targetName} at ${formatNumber(targetDpi)} DPI`;
  resultOutput.textContent = formatNumber(convertedSensitivity);
  resultCaption.textContent = `Approximate ${targetName} sensitivity preserving horizontal turn rate.`;
  exampleOutput.textContent = `Destination sensitivity = source DPI × source sensitivity × source yaw ÷ (destination DPI × destination yaw)`;
}

function updateCm360() {
  const dpiInput = document.querySelector("#cm360-dpi");
  const sensitivityInput = document.querySelector("#cm360-sensitivity");
  const yawInput = document.querySelector("#cm360-yaw");
  const gameKey = cm360GameSelect.value;
  const invalidFields = [];

  cm360YawField.hidden = gameKey !== "custom";
  const dpi = readValue(dpiInput, "Mouse DPI", invalidFields);
  const sensitivity = readValue(sensitivityInput, "In-game sensitivity", invalidFields);
  const yaw = getYaw(gameKey, yawInput, "Yaw", invalidFields);

  if (invalidFields.length) {
    showValidationError(invalidFields);
    return;
  }

  const cmPer360 = (360 * 2.54) / (dpi * sensitivity * yaw);
  if (!Number.isFinite(cmPer360) || cmPer360 <= 0) {
    showValidationError([{ input: sensitivityInput, label: "In-game sensitivity", allowZero: false }]);
    return;
  }

  const gameName = gameKey === "custom" ? "Custom yaw game" : gameYaw[gameKey].name;
  clearValidation();
  resultTitle.textContent = "Mouse distance per 360°.";
  equationOutput.textContent = `${gameName} · ${formatNumber(dpi)} DPI × ${formatNumber(sensitivity)} sensitivity`;
  resultOutput.textContent = `${formatNumber(cmPer360)} cm`;
  resultCaption.textContent = "Approximate physical mouse distance for one full horizontal turn.";
  exampleOutput.textContent = "cm/360 = 360 × 2.54 ÷ (DPI × sensitivity × yaw)";
}

function updateMode() {
  const mode = document.querySelector('input[name="sensitivity-mode"]:checked').value;
  Object.entries(modeContainers).forEach(([modeName, container]) => {
    container.hidden = modeName !== mode;
  });

  if (mode === "edpi") {
    updateEdpi();
  } else if (mode === "convert") {
    updateGameConversion();
  } else {
    updateCm360();
  }
}

modeInputs.forEach((radio) => radio.addEventListener("change", updateMode));
document.querySelectorAll(".mode-inputs input, .mode-inputs select").forEach((input) => {
  input.addEventListener("input", updateMode);
  input.addEventListener("change", updateMode);
});

updateMode();