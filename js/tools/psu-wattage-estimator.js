const numericDefinitions = [
  { id: "cpu-watts", key: "cpuWatts", label: "estimated CPU peak power", unit: "W", min: 1, max: 2000, required: true, decimalPlaces: 2 },
  { id: "gpu-count", key: "gpuCount", label: "number of GPUs", min: 0, max: 4, integer: true, required: true },
  { id: "gpu-watts", key: "gpuWatts", label: "estimated GPU board power per GPU", unit: "W", min: 1, max: 3000, decimalPlaces: 2, requiredWhen: "gpuCount" },
  { id: "motherboard-watts", key: "motherboardWatts", label: "estimated motherboard power", unit: "W", min: 1, max: 1000, required: true, decimalPlaces: 2 },
  { id: "ram-count", key: "ramCount", label: "number of RAM modules", min: 1, max: 16, integer: true, required: true },
  { id: "ram-watts", key: "ramWatts", label: "estimated power per RAM module", unit: "W", min: 0.1, max: 100, required: true, decimalPlaces: 2 },
  { id: "ssd-count", key: "ssdCount", label: "number of SSDs", min: 0, max: 32, integer: true, required: true },
  { id: "ssd-watts", key: "ssdWatts", label: "estimated power per SSD", unit: "W", min: 0.1, max: 100, decimalPlaces: 2, requiredWhen: "ssdCount" },
  { id: "hdd-count", key: "hddCount", label: "number of HDDs", min: 0, max: 32, integer: true, required: true },
  { id: "hdd-watts", key: "hddWatts", label: "estimated power per HDD", unit: "W", min: 0.1, max: 100, decimalPlaces: 2, requiredWhen: "hddCount" },
  { id: "fan-count", key: "fanCount", label: "number of case fans", min: 0, max: 64, integer: true, required: true },
  { id: "fan-watts", key: "fanWatts", label: "estimated power per fan", unit: "W", min: 0.1, max: 100, decimalPlaces: 2, requiredWhen: "fanCount" },
  { id: "pump-count", key: "pumpCount", label: "number of liquid-cooling pumps", min: 0, max: 8, integer: true, required: true },
  { id: "pump-watts", key: "pumpWatts", label: "estimated power per pump", unit: "W", min: 0.1, max: 500, decimalPlaces: 2, requiredWhen: "pumpCount" },
  { id: "other-watts", key: "otherWatts", label: "additional internal component power", unit: "W", min: 0, max: 5000, required: true, decimalPlaces: 2 },
  { id: "existing-psu", key: "existingPsu", label: "existing PSU rated wattage", unit: "W", min: 1, max: 10000, integer: true },
];

const safetyMarginOptions = new Set(["20", "25", "30", "40", "custom"]);
const standardTiers = [450, 550, 650, 750, 850, 1000, 1200, 1500];
const form = document.querySelector("#psu-estimator-form");
const resetButton = document.querySelector("#reset-psu-estimator");
const marginSelect = document.querySelector("#safety-margin");
const customMarginInput = document.querySelector("#custom-margin");
const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
let hasCalculated = false;

function showError(input, message) {
  const error = document.querySelector(`#${input.id}-error`);
  const hint = document.querySelector(`#${input.id}-hint`);
  if (!error) return;
  error.textContent = message;
  error.hidden = false;
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", hint ? `${hint.id} ${error.id}` : error.id);
}

function clearError(input) {
  const error = document.querySelector(`#${input.id}-error`);
  const hint = document.querySelector(`#${input.id}-hint`);
  if (error) {
    error.textContent = "";
    error.hidden = true;
  }
  input.removeAttribute("aria-invalid");
  if (hint) input.setAttribute("aria-describedby", hint.id);
  else input.removeAttribute("aria-describedby");
}

function readNumericField(definition, values) {
  const input = document.querySelector(`#${definition.id}`);
  const rawValue = input.value.trim();
  const required = definition.required || (definition.requiredWhen && values[definition.requiredWhen] > 0);

  if (input.validity.badInput) {
    showError(input, `Enter a valid ${definition.label}.`);
    return false;
  }
  if (rawValue === "") {
    clearError(input);
    if (required) {
      showError(input, `Enter ${definition.label}${definition.unit ? ` in ${definition.unit}` : ""}.`);
      return false;
    }
    values[definition.key] = null;
    return true;
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    showError(input, `Enter a finite ${definition.label}.`);
    return false;
  }
  if (value < definition.min || value > definition.max) {
    showError(input, `${definition.label} must be between ${numberFormat.format(definition.min)} and ${numberFormat.format(definition.max)}${definition.unit ? ` ${definition.unit}` : ""}.`);
    return false;
  }
  if (definition.integer && !Number.isInteger(value)) {
    showError(input, `${definition.label} must be a whole number.`);
    return false;
  }
  if (definition.decimalPlaces !== undefined) {
    const factor = 10 ** definition.decimalPlaces;
    if (Math.abs(value * factor - Math.round(value * factor)) > 1e-8) {
      showError(input, `${definition.label} must have no more than ${definition.decimalPlaces} decimal places.`);
      return false;
    }
  }

  clearError(input);
  values[definition.key] = value;
  return true;
}

function readMargin(values) {
  if (!safetyMarginOptions.has(marginSelect.value)) {
    showError(marginSelect, "Select a valid safety margin preset or Custom.");
    return false;
  }
  clearError(marginSelect);
  if (marginSelect.value !== "custom") {
    clearError(customMarginInput);
    values.safetyMargin = Number(marginSelect.value);
    return true;
  }
  return readNumericField({
    id: "custom-margin",
    key: "safetyMargin",
    label: "custom safety margin",
    unit: "%",
    min: 0,
    max: 100,
    required: true,
    decimalPlaces: 2,
  }, values);
}

function readModel(id) {
  return document.querySelector(`#${id}`).value.trim();
}

function readInputs() {
  const values = {};
  let valid = true;
  for (const definition of numericDefinitions) {
    if (!readNumericField(definition, values)) valid = false;
  }
  if (!readMargin(values)) valid = false;
  if (!valid) return null;
  values.cpuModel = readModel("cpu-model");
  values.gpuModel = readModel("gpu-model");
  return values;
}

function formatWatts(value) {
  return `${numberFormat.format(value)} W`;
}

function formatDifference(value) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatWatts(Math.abs(value))}`;
}

function formatContribution(count, perUnit, total) {
  const unit = perUnit === null ? "not supplied" : formatWatts(perUnit);
  return `${numberFormat.format(count)} × ${unit} = ${formatWatts(total)}`;
}

function setOutput(id, value) {
  document.querySelector(`#${id}`).textContent = value;
}

function clearResults() {
  [
    "result-cpu",
    "result-gpu",
    "result-motherboard",
    "result-ram",
    "result-ssd",
    "result-hdd",
    "result-fans",
    "result-pumps",
    "result-other",
    "result-total",
    "result-margin",
    "result-target",
    "result-rounded-target",
    "result-tier",
    "existing-psu-diff-estimate",
    "existing-psu-diff-target",
  ].forEach((id) => setOutput(id, "—"));
  const result = document.querySelector("#existing-psu-result");
  result.dataset.state = "not-evaluated";
  setOutput("existing-psu-state", "Not evaluated");
  setOutput("existing-psu-message", "Enter an existing PSU wattage to compare it after calculation.");
}

function setInvalid(message) {
  clearResults();
  setOutput("psu-estimator-status", message);
}

function chooseTier(roundedTarget) {
  const tier = standardTiers.find((value) => value >= roundedTarget);
  if (tier !== undefined) {
    return `${numberFormat.format(tier)} W (first listed tier at or above the target)`;
  }
  return `Above ${numberFormat.format(standardTiers[standardTiers.length - 1])} W; requirement is ${numberFormat.format(roundedTarget)} W. Select a higher-rated PSU and verify its specifications.`;
}

function updateExistingPsu(existingPsu, estimatedPower, target, roundedTarget) {
  const result = document.querySelector("#existing-psu-result");
  if (existingPsu === null) {
    result.dataset.state = "not-supplied";
    setOutput("existing-psu-state", "Not supplied");
    setOutput("existing-psu-message", "No existing PSU wattage was supplied. This comparison does not assess PSU suitability.");
    setOutput("existing-psu-diff-estimate", "—");
    setOutput("existing-psu-diff-target", "—");
    return;
  }

  const estimateDifference = existingPsu - estimatedPower;
  const targetDifference = existingPsu - target;
  setOutput("existing-psu-diff-estimate", formatDifference(estimateDifference));
  setOutput("existing-psu-diff-target", formatDifference(targetDifference));

  if (existingPsu < estimatedPower) {
    result.dataset.state = "below";
    setOutput("existing-psu-state", "Below estimate");
    setOutput("existing-psu-message", `The entered ${formatWatts(existingPsu)} rating is below the estimated system power of ${formatWatts(estimatedPower)} by ${formatWatts(Math.abs(estimateDifference))}. This comparison is not a PSU safety or suitability determination.`);
  } else if (existingPsu < roundedTarget) {
    result.dataset.state = "below-target";
    setOutput("existing-psu-state", "Above estimate, below whole-watt target");
    setOutput("existing-psu-message", `The entered rating is at or above the estimated system power, but below the ${formatWatts(roundedTarget)} whole-watt planning target. This does not establish whether the PSU is suitable.`);
  } else {
    result.dataset.state = "at-target";
    setOutput("existing-psu-state", "At or above whole-watt target");
    setOutput("existing-psu-message", `The entered rating is at or above the ${formatWatts(roundedTarget)} whole-watt planning target. Wattage alone does not establish PSU safety or suitability.`);
  }
}

function calculate() {
  const values = readInputs();
  if (!values) {
    setInvalid("Correct the highlighted entries. Invalid input is not used to generate a power estimate or PSU recommendation.");
    return;
  }

  const gpuPower = (values.gpuWatts || 0) * values.gpuCount;
  const ramPower = values.ramCount * values.ramWatts;
  const ssdPower = (values.ssdWatts || 0) * values.ssdCount;
  const hddPower = (values.hddWatts || 0) * values.hddCount;
  const fanPower = (values.fanWatts || 0) * values.fanCount;
  const pumpPower = (values.pumpWatts || 0) * values.pumpCount;
  const estimatedPower = values.cpuWatts + gpuPower + values.motherboardWatts + ramPower
    + ssdPower + hddPower + fanPower + pumpPower + values.otherWatts;
  const marginTarget = estimatedPower * (1 + values.safetyMargin / 100);
  const roundedTarget = Math.ceil(marginTarget - 1e-10);

  if (![gpuPower, ramPower, ssdPower, hddPower, fanPower, pumpPower, estimatedPower, marginTarget, roundedTarget].every(Number.isFinite)) {
    setInvalid("These inputs produce a value outside the calculator's finite numeric range. Review the entered wattages and counts.");
    return;
  }

  setOutput("result-cpu", `${formatWatts(values.cpuWatts)}${values.cpuModel ? ` · ${values.cpuModel}` : ""}`);
  setOutput("result-gpu", `${formatContribution(values.gpuCount, values.gpuWatts, gpuPower)}${values.gpuModel ? ` · ${values.gpuModel}` : ""}`);
  setOutput("result-motherboard", formatWatts(values.motherboardWatts));
  setOutput("result-ram", formatContribution(values.ramCount, values.ramWatts, ramPower));
  setOutput("result-ssd", formatContribution(values.ssdCount, values.ssdWatts, ssdPower));
  setOutput("result-hdd", formatContribution(values.hddCount, values.hddWatts, hddPower));
  setOutput("result-fans", formatContribution(values.fanCount, values.fanWatts, fanPower));
  setOutput("result-pumps", formatContribution(values.pumpCount, values.pumpWatts, pumpPower));
  setOutput("result-other", formatWatts(values.otherWatts));
  setOutput("result-total", formatWatts(estimatedPower));
  setOutput("result-margin", `${numberFormat.format(values.safetyMargin)}%`);
  setOutput("result-target", formatWatts(marginTarget));
  setOutput("result-rounded-target", formatWatts(roundedTarget));
  setOutput("result-tier", chooseTier(roundedTarget));
  updateExistingPsu(values.existingPsu, estimatedPower, marginTarget, roundedTarget);
  setOutput("psu-estimator-status", "Estimate updated from user-entered wattages. Verify the component sources and PSU specifications before making a purchase or reuse decision.");
}

function clearAllErrors() {
  form.querySelectorAll("input, select").forEach(clearError);
}

marginSelect.addEventListener("change", () => {
  const isCustom = marginSelect.value === "custom";
  customMarginInput.disabled = !isCustom;
  if (!isCustom) clearError(customMarginInput);
  if (hasCalculated) calculate();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  hasCalculated = true;
  calculate();
});
form.addEventListener("input", () => {
  if (hasCalculated) calculate();
});
form.addEventListener("change", () => {
  if (hasCalculated) calculate();
});
resetButton.addEventListener("click", () => {
  form.reset();
  hasCalculated = false;
  customMarginInput.disabled = true;
  clearAllErrors();
  clearResults();
  setOutput("psu-estimator-status", "Enter component power estimates to calculate a planning target.");
});
