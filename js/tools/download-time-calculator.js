const fileSizeInput = document.querySelector("#file-size");
const fileUnitSelect = document.querySelector("#file-unit");
const speedInput = document.querySelector("#download-speed");
const speedUnitSelect = document.querySelector("#speed-unit");
const resultOutput = document.querySelector("#download-result");
const equationOutput = document.querySelector("#download-equation");
const resultCaption = document.querySelector("#download-caption");
const errorMessage = document.querySelector("#download-error");

const fileUnitLabels = ["B", "KB", "MB", "GB", "TB"];

function formatNumber(value, maximumSignificantDigits = 8) {
  if (value !== 0 && (Math.abs(value) >= 1e15 || Math.abs(value) < 1e-6)) {
    return value.toExponential(3);
  }

  return new Intl.NumberFormat(undefined, {
    maximumSignificantDigits,
  }).format(value);
}

function formatDuration(seconds) {
  if (seconds === 0) {
    return "0 seconds";
  }

  if (seconds < 1) {
    return "Less than 1 second";
  }

  const durationUnits = [
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
    [1, "second"],
  ];
  let remainingSeconds = Math.ceil(seconds);
  const parts = [];

  durationUnits.forEach(([unitSeconds, unitName]) => {
    const unitCount = Math.floor(remainingSeconds / unitSeconds);
    if (unitCount > 0) {
      const formattedCount = formatNumber(unitCount, 6);
      parts.push(`${formattedCount} ${unitName}${unitCount === 1 ? "" : "s"}`);
      remainingSeconds %= unitSeconds;
    }
  });

  return parts.slice(0, 2).join(" ");
}

function showDownloadError(message, invalidFields) {
  [fileSizeInput, speedInput].forEach((field) => {
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
  });
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  equationOutput.textContent = "Estimate unavailable";
  resultCaption.textContent = "Correct the highlighted values to see an estimate.";
  resultOutput.textContent = "—";
  invalidFields.forEach((field) => {
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", "download-error");
  });
}

function updateDownloadEstimate() {
  const rawFileSize = fileSizeInput.value.trim();
  const rawSpeed = speedInput.value.trim();
  const fileSize = Number(rawFileSize);
  const speed = Number(rawSpeed);
  const invalidFields = [];

  fileSizeInput.removeAttribute("aria-invalid");
  fileSizeInput.removeAttribute("aria-describedby");
  speedInput.removeAttribute("aria-invalid");
  speedInput.removeAttribute("aria-describedby");

  if (rawFileSize === "" || !Number.isFinite(fileSize) || fileSize < 0) {
    invalidFields.push(fileSizeInput);
  }

  if (rawSpeed === "" || !Number.isFinite(speed) || speed <= 0) {
    invalidFields.push(speedInput);
  }

  if (invalidFields.length > 0) {
    showDownloadError("Enter a file size of zero or more and a speed greater than zero.", invalidFields);
    return;
  }

  const fileUnitPower = Number(fileUnitSelect.value);
  const fileSizeInBytes = fileSize * 1000 ** fileUnitPower;
  const bytesPerSecond = speedUnitSelect.value === "mbps" ? speed * 1_000_000 / 8 : speed * 1_000_000;

  if (!Number.isFinite(fileSizeInBytes)) {
    showDownloadError("That file size is too large to estimate. Try a smaller value.", [fileSizeInput]);
    return;
  }

  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) {
    showDownloadError("That speed is outside the supported range. Enter a smaller positive value.", [speedInput]);
    return;
  }

  const seconds = fileSizeInBytes / bytesPerSecond;

  if (!Number.isFinite(seconds)) {
    showDownloadError("That transfer is too large to estimate. Try a smaller value.", [fileSizeInput]);
    return;
  }

  const formattedFileSize = formatNumber(fileSize);
  const speedLabel = speedUnitSelect.value === "mbps" ? "Mbps" : "MB/s";

  errorMessage.hidden = true;
  equationOutput.textContent = `${formattedFileSize} ${fileUnitLabels[fileUnitPower]} at ${formatNumber(speed)} ${speedLabel}`;
  resultCaption.textContent = "A practical estimate assumes a steady connection and excludes network overhead.";
  resultOutput.textContent = fileSize > 0 && seconds === 0 ? "Less than 1 second" : formatDuration(seconds);
}

[fileSizeInput, fileUnitSelect, speedInput, speedUnitSelect].forEach((input) => {
  input.addEventListener("input", updateDownloadEstimate);
  input.addEventListener("change", updateDownloadEstimate);
});

updateDownloadEstimate();