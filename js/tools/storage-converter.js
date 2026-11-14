const amountInput = document.querySelector("#storage-amount");
const sourceUnitSelect = document.querySelector("#source-unit");
const targetUnitSelect = document.querySelector("#target-unit");
const standardInputs = document.querySelectorAll('input[name="standard"]');
const resultOutput = document.querySelector("#storage-result");
const equationOutput = document.querySelector("#storage-equation");
const captionOutput = document.querySelector("#storage-caption");
const exampleOutput = document.querySelector("#unit-example");
const errorMessage = document.querySelector("#storage-error");

const unitNames = [
  ["Bytes", "Bytes", "B", "B"],
  ["Kilobytes", "Kibibytes", "KB", "KiB"],
  ["Megabytes", "Mebibytes", "MB", "MiB"],
  ["Gigabytes", "Gibibytes", "GB", "GiB"],
  ["Terabytes", "Tebibytes", "TB", "TiB"],
];

function getSelectedStandard() {
  return document.querySelector('input[name="standard"]:checked').value;
}

function getUnitLabel(unitPower, standard) {
  if (unitPower === 0) {
    return "B";
  }

  return standard === "binary" ? unitNames[unitPower][3] : unitNames[unitPower][2];
}

function formatNumber(value) {
  if (value !== 0 && (Math.abs(value) >= 1e15 || Math.abs(value) < 1e-6)) {
    return value.toExponential(11);
  }

  return new Intl.NumberFormat(undefined, {
    maximumSignificantDigits: 12,
  }).format(value);
}

function updateUnitOptions(standard) {
  [sourceUnitSelect, targetUnitSelect].forEach((select) => {
    Array.from(select.options).forEach((option) => {
      const unitPower = Number(option.value);
      const unitName = unitNames[unitPower][standard === "binary" ? 1 : 0];
      const unitLabel = getUnitLabel(unitPower, standard);
      option.textContent = `${unitName} (${unitLabel})`;
    });
  });
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  amountInput.setAttribute("aria-invalid", "true");
  amountInput.setAttribute("aria-describedby", "storage-error");
  resultOutput.textContent = "—";
  equationOutput.textContent = message;
  captionOutput.textContent = "Correct the highlighted amount to see a conversion.";
}

function updateConversion() {
  const rawAmount = amountInput.value.trim();
  const amount = Number(rawAmount);
  const standard = getSelectedStandard();
  const base = standard === "decimal" ? 1000 : 1024;
  const standardName = standard === "decimal" ? "decimal" : "binary";
  const unitWord = standard === "decimal" ? "KB" : "KiB";

  updateUnitOptions(standard);
  captionOutput.textContent = `Using ${standardName} units (${formatNumber(base)} bytes per ${unitWord}).`;
  exampleOutput.textContent = `1 ${unitWord} = ${formatNumber(base)} bytes`;

  if (rawAmount === "" || !Number.isFinite(amount) || amount < 0) {
    showError("Enter a valid amount of zero or more.");
    return;
  }

  const sourcePower = Number(sourceUnitSelect.value);
  const targetPower = Number(targetUnitSelect.value);
  const convertedAmount = amount * base ** (sourcePower - targetPower);

  if (!Number.isFinite(convertedAmount)) {
    showError("That value is too large to convert. Try a smaller amount.");
    return;
  }

  const sourceLabel = getUnitLabel(sourcePower, standard);
  const targetLabel = getUnitLabel(targetPower, standard);
  const formattedAmount = formatNumber(amount);
  const formattedResult = formatNumber(convertedAmount);
  errorMessage.hidden = true;
  amountInput.removeAttribute("aria-invalid");
  amountInput.removeAttribute("aria-describedby");
  resultOutput.textContent = `${formattedResult} ${targetLabel}`;
  equationOutput.textContent = `${formattedAmount} ${sourceLabel} = ${formattedResult} ${targetLabel}`;
}

amountInput.addEventListener("input", updateConversion);
sourceUnitSelect.addEventListener("change", updateConversion);
targetUnitSelect.addEventListener("change", updateConversion);
standardInputs.forEach((radio) => radio.addEventListener("change", updateConversion));

updateConversion();