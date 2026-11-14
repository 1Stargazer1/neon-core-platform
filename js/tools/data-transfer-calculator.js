const modeInputs = document.querySelectorAll('input[name="transfer-mode"]');
const modeContainers = {
  data: document.querySelector("#data-mode-inputs"),
  duration: document.querySelector("#duration-mode-inputs"),
  speed: document.querySelector("#speed-mode-inputs"),
};
const resultTitle = document.querySelector("#transfer-result-title");
const equationOutput = document.querySelector("#transfer-equation");
const resultOutput = document.querySelector("#transfer-result");
const resultCaption = document.querySelector("#transfer-caption");
const formulaOutput = document.querySelector("#transfer-formula");
const errorMessage = document.querySelector("#transfer-error");

const dataUnits = {
  B: { label: "B", bytes: 1 },
  KB: { label: "KB", bytes: 1e3 },
  MB: { label: "MB", bytes: 1e6 },
  GB: { label: "GB", bytes: 1e9 },
  TB: { label: "TB", bytes: 1e12 },
  KiB: { label: "KiB", bytes: 1024 },
  MiB: { label: "MiB", bytes: 1024 ** 2 },
  GiB: { label: "GiB", bytes: 1024 ** 3 },
  TiB: { label: "TiB", bytes: 1024 ** 4 },
};

const speedUnits = {
  kbps: { label: "Kbps", bytesPerSecond: 1e3 / 8 },
  mbps: { label: "Mbps", bytesPerSecond: 1e6 / 8 },
  gbps: { label: "Gbps", bytesPerSecond: 1e9 / 8 },
  kBps: { label: "KB/s", bytesPerSecond: 1e3 },
  MBps: { label: "MB/s", bytesPerSecond: 1e6 },
  GBps: { label: "GB/s", bytesPerSecond: 1e9 },
};

const timeUnits = {
  1: { label: "seconds", shortLabel: "s", seconds: 1 },
  60: { label: "minutes", shortLabel: "min", seconds: 60 },
  3600: { label: "hours", shortLabel: "h", seconds: 3600 },
};

function formatNumber(value) {
  if (value !== 0 && (Math.abs(value) >= 1e15 || Math.abs(value) < 1e-6)) {
    return value.toExponential(3);
  }

  return new Intl.NumberFormat(undefined, {
    maximumSignificantDigits: 8,
  }).format(value);
}

function readNonNegative(input, label, invalidFields, allowZero = true) {
  const rawValue = input.value.trim();
  const value = Number(rawValue);
  const isInvalid = rawValue === ""
    || !Number.isFinite(value)
    || value < 0
    || (!allowZero && value === 0);

  if (isInvalid) {
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
  const fieldDescriptions = invalidFields.map(({ input, label, allowZero }) => {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", "transfer-error");
    return `${label} ${allowZero ? "must be zero or more" : "must be greater than zero"}`;
  });

  errorMessage.textContent = `Check your values: ${fieldDescriptions.join("; ")}.`;
  errorMessage.hidden = false;
  equationOutput.textContent = "Result unavailable";
  resultOutput.textContent = "—";
  resultCaption.textContent = "Correct the highlighted values to calculate a result.";
}

function readDataInBytes(amountInput, unitSelect, label, invalidFields) {
  const amount = readNonNegative(amountInput, label, invalidFields);
  if (amount === null) return null;

  const bytes = amount * dataUnits[unitSelect.value].bytes;
  if (!Number.isFinite(bytes)) {
    invalidFields.push({ input: amountInput, label, allowZero: true });
    return null;
  }

  return bytes;
}

function readSpeedInBytesPerSecond(speedInput, unitSelect, invalidFields, allowZero) {
  const speed = readNonNegative(speedInput, "Transfer speed", invalidFields, allowZero);
  if (speed === null) return null;

  const bytesPerSecond = speed * speedUnits[unitSelect.value].bytesPerSecond;
  if (!Number.isFinite(bytesPerSecond) || (!allowZero && bytesPerSecond === 0)) {
    invalidFields.push({ input: speedInput, label: "Transfer speed", allowZero });
    return null;
  }

  return bytesPerSecond;
}

function updateDataTransferred() {
  const speedInput = document.querySelector("#data-speed");
  const speedUnitSelect = document.querySelector("#data-speed-unit");
  const durationInput = document.querySelector("#data-duration");
  const timeUnitSelect = document.querySelector("#data-time-unit");
  const resultUnitSelect = document.querySelector("#data-result-unit");
  const invalidFields = [];

  const bytesPerSecond = readSpeedInBytesPerSecond(speedInput, speedUnitSelect, invalidFields, true);
  const duration = readNonNegative(durationInput, "Duration", invalidFields);
  const durationSeconds = duration === null ? null : duration * timeUnits[timeUnitSelect.value].seconds;

  if (durationSeconds !== null && !Number.isFinite(durationSeconds)) {
    invalidFields.push({ input: durationInput, label: "Duration", allowZero: true });
  }
  if (invalidFields.length > 0) {
    showValidationError(invalidFields);
    return;
  }

  const transferredBytes = bytesPerSecond * durationSeconds;
  if (!Number.isFinite(transferredBytes)) {
    showValidationError([{ input: durationInput, label: "Duration", allowZero: true }]);
    return;
  }

  const resultUnit = dataUnits[resultUnitSelect.value];
  const transferredAmount = transferredBytes / resultUnit.bytes;
  const speedUnit = speedUnits[speedUnitSelect.value].label;
  const timeUnit = timeUnits[timeUnitSelect.value];

  clearValidation();
  resultTitle.textContent = "Data transferred.";
  equationOutput.textContent = `${formatNumber(Number(speedInput.value))} ${speedUnit} × ${formatNumber(Number(durationInput.value))} ${timeUnit.shortLabel}`;
  resultOutput.textContent = `${formatNumber(transferredAmount)} ${resultUnit.label}`;
  resultCaption.textContent = "Calculated data transferred at a steady, ideal rate.";
  formulaOutput.textContent = "Data (bytes) = speed (bytes/second) × duration (seconds)";
}

function updateTransferDuration() {
  const amountInput = document.querySelector("#duration-data");
  const dataUnitSelect = document.querySelector("#duration-data-unit");
  const speedInput = document.querySelector("#duration-speed");
  const speedUnitSelect = document.querySelector("#duration-speed-unit");
  const resultUnitSelect = document.querySelector("#duration-result-unit");
  const invalidFields = [];

  const dataBytes = readDataInBytes(amountInput, dataUnitSelect, "Data amount", invalidFields);
  const bytesPerSecond = readSpeedInBytesPerSecond(speedInput, speedUnitSelect, invalidFields, false);

  if (invalidFields.length > 0) {
    showValidationError(invalidFields);
    return;
  }

  const durationSeconds = dataBytes / bytesPerSecond;
  if (!Number.isFinite(durationSeconds)) {
    showValidationError([{ input: amountInput, label: "Data amount", allowZero: true }]);
    return;
  }

  const resultUnit = timeUnits[resultUnitSelect.value];
  const duration = durationSeconds / resultUnit.seconds;
  const dataUnit = dataUnits[dataUnitSelect.value];
  const speedUnit = speedUnits[speedUnitSelect.value];

  clearValidation();
  resultTitle.textContent = "Transfer duration.";
  equationOutput.textContent = `${formatNumber(Number(amountInput.value))} ${dataUnit.label} ÷ ${formatNumber(Number(speedInput.value))} ${speedUnit.label}`;
  resultOutput.textContent = `${formatNumber(duration)} ${resultUnit.label}`;
  resultCaption.textContent = "Calculated time assumes the selected speed remains constant.";
  formulaOutput.textContent = "Duration (seconds) = data size (bytes) ÷ speed (bytes/second)";
}

function updateRequiredSpeed() {
  const amountInput = document.querySelector("#speed-data");
  const dataUnitSelect = document.querySelector("#speed-data-unit");
  const durationInput = document.querySelector("#required-duration");
  const timeUnitSelect = document.querySelector("#required-time-unit");
  const resultUnitSelect = document.querySelector("#required-speed-unit");
  const invalidFields = [];

  const dataBytes = readDataInBytes(amountInput, dataUnitSelect, "Data amount", invalidFields);
  const duration = readNonNegative(durationInput, "Available duration", invalidFields, false);
  const durationSeconds = duration === null ? null : duration * timeUnits[timeUnitSelect.value].seconds;

  if (durationSeconds !== null && (!Number.isFinite(durationSeconds) || durationSeconds <= 0)) {
    invalidFields.push({ input: durationInput, label: "Available duration", allowZero: false });
  }
  if (invalidFields.length > 0) {
    showValidationError(invalidFields);
    return;
  }

  const requiredBytesPerSecond = dataBytes / durationSeconds;
  if (!Number.isFinite(requiredBytesPerSecond)) {
    showValidationError([{ input: amountInput, label: "Data amount", allowZero: true }]);
    return;
  }

  const resultUnit = speedUnits[resultUnitSelect.value];
  const requiredSpeed = requiredBytesPerSecond / resultUnit.bytesPerSecond;
  const dataUnit = dataUnits[dataUnitSelect.value];
  const timeUnit = timeUnits[timeUnitSelect.value];

  clearValidation();
  resultTitle.textContent = "Required speed.";
  equationOutput.textContent = `${formatNumber(Number(amountInput.value))} ${dataUnit.label} ÷ ${formatNumber(Number(durationInput.value))} ${timeUnit.shortLabel}`;
  resultOutput.textContent = `${formatNumber(requiredSpeed)} ${resultUnit.label}`;
  resultCaption.textContent = "Minimum ideal transfer speed; real connections need headroom for overhead and variation.";
  formulaOutput.textContent = "Speed (bytes/second) = data size (bytes) ÷ duration (seconds)";
}

function updateMode() {
  const mode = document.querySelector('input[name="transfer-mode"]:checked').value;
  Object.entries(modeContainers).forEach(([modeName, container]) => {
    container.hidden = modeName !== mode;
  });

  if (mode === "data") {
    updateDataTransferred();
  } else if (mode === "duration") {
    updateTransferDuration();
  } else {
    updateRequiredSpeed();
  }
}

modeInputs.forEach((radio) => radio.addEventListener("change", updateMode));
document.querySelectorAll(".mode-inputs input, .mode-inputs select").forEach((input) => {
  input.addEventListener("input", updateMode);
  input.addEventListener("change", updateMode);
});

updateMode();