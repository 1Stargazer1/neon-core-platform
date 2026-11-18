const numericDefinitions = [
  { id: "a-cores", key: "cores", label: "total physical cores", min: 1, max: 256, integer: true, required: true },
  { id: "a-threads", key: "threads", label: "total threads", min: 1, max: 512, integer: true, required: true },
  { id: "a-p-cores", key: "pCores", label: "performance core count", min: 0, max: 256, integer: true },
  { id: "a-e-cores", key: "eCores", label: "efficiency core count", min: 0, max: 256, integer: true },
  { id: "a-base-clock", key: "baseClock", label: "base clock", unit: "GHz", min: 0.1, max: 10 },
  { id: "a-boost-clock", key: "boostClock", label: "maximum boost clock", unit: "GHz", min: 0.1, max: 10 },
  { id: "a-l2-cache", key: "l2Cache", label: "L2 cache", unit: "MB", min: 0.01, max: 2048 },
  { id: "a-l3-cache", key: "l3Cache", label: "L3 cache", unit: "MB", min: 0.01, max: 2048 },
  { id: "a-base-power", key: "basePower", label: "manufacturer-rated base/default power", unit: "W", min: 1, max: 1000 },
  { id: "a-max-power", key: "maxPower", label: "manufacturer-rated maximum/turbo power", unit: "W", min: 1, max: 1000 },
  { id: "a-price", key: "price", label: "price", unit: "AUD", min: 0.01, max: 100000, decimalPlaces: 2 },
  { id: "b-cores", key: "cores", label: "total physical cores", min: 1, max: 256, integer: true, required: true },
  { id: "b-threads", key: "threads", label: "total threads", min: 1, max: 512, integer: true, required: true },
  { id: "b-p-cores", key: "pCores", label: "performance core count", min: 0, max: 256, integer: true },
  { id: "b-e-cores", key: "eCores", label: "efficiency core count", min: 0, max: 256, integer: true },
  { id: "b-base-clock", key: "baseClock", label: "base clock", unit: "GHz", min: 0.1, max: 10 },
  { id: "b-boost-clock", key: "boostClock", label: "maximum boost clock", unit: "GHz", min: 0.1, max: 10 },
  { id: "b-l2-cache", key: "l2Cache", label: "L2 cache", unit: "MB", min: 0.01, max: 2048 },
  { id: "b-l3-cache", key: "l3Cache", label: "L3 cache", unit: "MB", min: 0.01, max: 2048 },
  { id: "b-base-power", key: "basePower", label: "manufacturer-rated base/default power", unit: "W", min: 1, max: 1000 },
  { id: "b-max-power", key: "maxPower", label: "manufacturer-rated maximum/turbo power", unit: "W", min: 1, max: 1000 },
  { id: "b-price", key: "price", label: "price", unit: "AUD", min: 0.01, max: 100000, decimalPlaces: 2 },
];

const manufacturerLabels = {
  intel: "Intel",
  amd: "AMD",
  apple: "Apple",
  other: "Other",
};
const graphicsLabels = {
  yes: "Yes",
  no: "No",
  unknown: "Unknown",
};
const cpuForm = document.querySelector("#cpu-comparison-form");
const resetButton = document.querySelector("#reset-cpus");
const numberFormat = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const integerFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});
const currencyFormat = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 2,
});
let hasCompared = false;

function setOutput(id, value) {
  document.querySelector(`#${id}`).textContent = value;
}

function showError(input, message) {
  const error = document.querySelector(`#${input.id}-error`);
  const hint = document.querySelector(`#${input.id}-hint`);
  if (!error) return;
  error.textContent = message;
  error.hidden = false;
  input.setAttribute("aria-invalid", "true");
  if (hint) input.setAttribute("aria-describedby", `${hint.id} ${error.id}`);
  else input.setAttribute("aria-describedby", error.id);
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
  if (input.validity.badInput) {
    showError(input, `Enter a valid ${definition.label}.`);
    return false;
  }
  if (rawValue === "") {
    clearError(input);
    if (definition.required) {
      showError(input, `Enter a ${definition.label}.`);
      return false;
    }
    values[definition.key] = null;
    return true;
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    showError(input, `Enter a valid ${definition.label}.`);
    return false;
  }
  if (value < definition.min || value > definition.max) {
    showError(input, `${definition.label} must be between ${definition.min} and ${integerFormat.format(definition.max)}${definition.unit ? ` ${definition.unit}` : ""}.`);
    return false;
  }
  if (definition.integer && !Number.isInteger(value)) {
    showError(input, `${definition.label} must be a whole number.`);
    return false;
  }
  if (definition.decimalPlaces) {
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

function readRequiredSelect(id, labels, label, values, key) {
  const input = document.querySelector(`#${id}`);
  if (!Object.prototype.hasOwnProperty.call(labels, input.value)) {
    showError(input, `Select a ${label}.`);
    return false;
  }
  clearError(input);
  values[key] = input.value;
  return true;
}

function readRequiredText(id, label, values, key) {
  const input = document.querySelector(`#${id}`);
  const value = input.value.trim();
  if (!value) {
    showError(input, `Enter a ${label}.`);
    return false;
  }
  clearError(input);
  values[key] = value;
  return true;
}

function validateCoreConfiguration(side, values) {
  let valid = true;
  const hasPCores = values.pCores !== undefined && values.pCores !== null;
  const hasECores = values.eCores !== undefined && values.eCores !== null;
  for (const [key, isPresent] of [["pCores", hasPCores], ["eCores", hasECores]]) {
    if (isPresent && values[key] > values.cores) {
      const input = document.querySelector(`#${side}-${key === "pCores" ? "p-cores" : "e-cores"}`);
      showError(input, `${key === "pCores" ? "Performance" : "Efficiency"} core count cannot exceed total physical cores.`);
      valid = false;
    }
  }
  if (hasPCores && hasECores && values.pCores + values.eCores !== values.cores) {
    const pInput = document.querySelector(`#${side}-p-cores`);
    const eInput = document.querySelector(`#${side}-e-cores`);
    showError(pInput, "Performance and efficiency core counts must add up to total physical cores.");
    showError(eInput, "Performance and efficiency core counts must add up to total physical cores.");
    valid = false;
  }
  return valid;
}

function readCPU(side) {
  const values = {};
  let valid = true;
  for (const definition of numericDefinitions) {
    if (!definition.id.startsWith(`${side}-`)) continue;
    if (!readNumericField(definition, values)) valid = false;
  }
  if (!readRequiredSelect(`${side}-manufacturer`, manufacturerLabels, "manufacturer", values, "manufacturer")) valid = false;
  if (!readRequiredSelect(`${side}-graphics`, graphicsLabels, "integrated graphics option", values, "graphics")) valid = false;
  if (!readRequiredText(`${side}-model`, "processor name or model", values, "model")) valid = false;

  for (const key of ["architecture", "socket", "memory"]) {
    values[key] = document.querySelector(`#${side}-${key}`).value.trim();
  }

  if (values.cores !== undefined && !validateCoreConfiguration(side, values)) valid = false;
  if (values.baseClock !== null && values.boostClock !== null && values.boostClock < values.baseClock) {
    showError(document.querySelector(`#${side}-boost-clock`), "Maximum boost clock should not be lower than base clock.");
    valid = false;
  }

  return valid ? values : null;
}

function formatNumber(value) {
  return numberFormat.format(value);
}

function formatSigned(value, unit, formatter = formatNumber) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatter(value)} ${unit}`;
}

function formatCurrencyDifference(value) {
  const amount = currencyFormat.format(Math.abs(value));
  if (value > 0) return `+${amount} AUD`;
  if (value < 0) return `−${amount} AUD`;
  return `${currencyFormat.format(0)} AUD`;
}

function formatOptional(value, unit) {
  return value === null || value === "" ? "Not supplied" : `${formatNumber(value)} ${unit}`;
}

function coreConfiguration(cpu) {
  if (cpu.pCores === null && cpu.eCores === null) return "Not supplied";
  const p = cpu.pCores === null ? "P-cores not supplied" : `${integerFormat.format(cpu.pCores)} P-cores`;
  const e = cpu.eCores === null ? "E-cores not supplied" : `${integerFormat.format(cpu.eCores)} E-cores`;
  return `${p}; ${e}`;
}

function updateMetrics(a, b) {
  const metricIds = [
    "metric-core-difference",
    "metric-core-percent",
    "metric-thread-difference",
    "metric-thread-percent",
    "metric-l2-difference",
    "metric-l3-difference",
    "metric-base-clock-difference",
    "metric-boost-clock-difference",
    "metric-price-difference",
  ];
  if (!a || !b) {
    metricIds.forEach((id) => setOutput(id, "—"));
    return;
  }

  setOutput("metric-core-difference", formatSigned(b.cores - a.cores, "cores", (value) => integerFormat.format(value)));
  setOutput("metric-core-percent", formatSigned(((b.cores - a.cores) / a.cores) * 100, "%"));
  setOutput("metric-thread-difference", formatSigned(b.threads - a.threads, "threads", (value) => integerFormat.format(value)));
  setOutput("metric-thread-percent", formatSigned(((b.threads - a.threads) / a.threads) * 100, "%"));
  setOutput("metric-l2-difference", optionalDifference(a.l2Cache, b.l2Cache, "MB"));
  setOutput("metric-l3-difference", optionalDifference(a.l3Cache, b.l3Cache, "MB"));
  setOutput("metric-base-clock-difference", optionalDifference(a.baseClock, b.baseClock, "GHz"));
  setOutput("metric-boost-clock-difference", optionalDifference(a.boostClock, b.boostClock, "GHz"));
  setOutput("metric-price-difference", a.price === null || b.price === null ? "Both prices needed" : formatCurrencyDifference(b.price - a.price));
}

function optionalDifference(a, b, unit) {
  return a === null || b === null ? "Both values needed" : formatSigned(b - a, unit);
}

function updateTable(a, b) {
  setOutput("a-table-name", a ? a.model : "CPU A");
  setOutput("b-table-name", b ? b.model : "CPU B");

  const rows = [
    { key: "model", value: (cpu) => cpu.model, difference: "—" },
    { key: "manufacturer", value: (cpu) => manufacturerLabels[cpu.manufacturer], difference: "—" },
    { key: "architecture", value: (cpu) => cpu.architecture || "Not supplied", difference: "—" },
    { key: "cores", value: (cpu) => integerFormat.format(cpu.cores), difference: a && b ? formatSigned(b.cores - a.cores, "cores", (value) => integerFormat.format(value)) : "—" },
    { key: "core-config", value: coreConfiguration, difference: "—" },
    { key: "threads", value: (cpu) => integerFormat.format(cpu.threads), difference: a && b ? formatSigned(b.threads - a.threads, "threads", (value) => integerFormat.format(value)) : "—" },
    { key: "base-clock", value: (cpu) => formatOptional(cpu.baseClock, "GHz"), difference: a && b ? optionalDifference(a.baseClock, b.baseClock, "GHz") : "—" },
    { key: "boost-clock", value: (cpu) => formatOptional(cpu.boostClock, "GHz"), difference: a && b ? optionalDifference(a.boostClock, b.boostClock, "GHz") : "—" },
    { key: "l2-cache", value: (cpu) => formatOptional(cpu.l2Cache, "MB"), difference: a && b ? optionalDifference(a.l2Cache, b.l2Cache, "MB") : "—" },
    { key: "l3-cache", value: (cpu) => formatOptional(cpu.l3Cache, "MB"), difference: a && b ? optionalDifference(a.l3Cache, b.l3Cache, "MB") : "—" },
    { key: "base-power", value: (cpu) => formatOptional(cpu.basePower, "W"), difference: "Not directly comparable; rating definitions vary." },
    { key: "max-power", value: (cpu) => formatOptional(cpu.maxPower, "W"), difference: "Not directly comparable; rating definitions vary." },
    { key: "socket", value: (cpu) => cpu.socket || "Not supplied", difference: "—" },
    { key: "graphics", value: (cpu) => graphicsLabels[cpu.graphics], difference: "—" },
    { key: "memory", value: (cpu) => cpu.memory || "Not supplied", difference: "—" },
    { key: "price", value: (cpu) => cpu.price === null ? "Not supplied" : currencyFormat.format(cpu.price), difference: a && b ? (a.price === null || b.price === null ? "Both prices needed" : formatCurrencyDifference(b.price - a.price)) : "—" },
  ];

  for (const row of rows) {
    setOutput(`a-value-${row.key}`, a ? row.value(a) : "—");
    setOutput(`b-value-${row.key}`, b ? row.value(b) : "—");
    const differenceCell = document.querySelector(`#diff-${row.key}`);
    if (differenceCell) differenceCell.textContent = row.difference;
  }
}

function formatOptionalPower(cpu, key) {
  const value = cpu[key];
  return value === null ? "not supplied" : `${formatNumber(value)} W`;
}

function updateExplanations(a, b) {
  const ids = ["gaming", "multitasking", "productivity", "power", "platform", "value"];
  if (!a || !b) {
    ids.forEach((id) => setOutput(`explanation-${id}`, "Enter valid required specifications for both CPUs to see a conditional note."));
    return;
  }

  setOutput("explanation-gaming", `Gaming depends on game engine, architecture, cache behavior, memory, GPU, resolution, and other settings. ${a.model}: architecture ${a.architecture || "not supplied"}, L3 cache ${formatOptional(a.l3Cache, "MB")}, memory support ${a.memory || "not supplied"}. ${b.model}: architecture ${b.architecture || "not supplied"}, L3 cache ${formatOptional(b.l3Cache, "MB")}, memory support ${b.memory || "not supplied"}. GPU and resolution are not entered here, and these specifications do not predict FPS or establish a performance winner.`);
  setOutput("explanation-multitasking", `${a.model} lists ${integerFormat.format(a.cores)} cores and ${integerFormat.format(a.threads)} threads; ${b.model} lists ${integerFormat.format(b.cores)} cores and ${integerFormat.format(b.threads)} threads. Additional cores or threads may help when software can use parallel work, but scheduling, architecture, workload, and other system components affect results; no improvement is guaranteed.`);
  setOutput("explanation-productivity", `${a.model} lists ${integerFormat.format(a.cores)} cores and ${integerFormat.format(a.threads)} threads; ${b.model} lists ${integerFormat.format(b.cores)} cores and ${integerFormat.format(b.threads)} threads. Productivity workloads vary in how well they use multiple cores: some benefit from parallel processing, while others are limited by serial work or software design. These counts are not measured application performance.`);
  setOutput("explanation-power", `${a.model}: base/default ${formatOptionalPower(a, "basePower")}, maximum/turbo ${formatOptionalPower(a, "maxPower")}. ${b.model}: base/default ${formatOptionalPower(b, "basePower")}, maximum/turbo ${formatOptionalPower(b, "maxPower")}. Manufacturer rating definitions may differ; actual measured power depends on workload, platform limits, and cooling and is not calculated here.`);
  setOutput("explanation-platform", `${a.model} platform: ${a.socket || "not supplied"}; ${b.model} platform: ${b.socket || "not supplied"}. Socket labels alone do not guarantee motherboard compatibility. Check the exact motherboard, chipset, BIOS support, board power delivery, and memory requirements; this tool does not verify compatibility.`);
  const valueText = a.price === null || b.price === null
    ? "Enter both prices to calculate a price difference. No performance-per-dollar ranking is produced."
    : `Listed price difference (CPU B − CPU A): ${formatCurrencyDifference(b.price - a.price)}. Prices alone do not establish value without workload-specific performance and other requirements.`;
  setOutput("explanation-value", valueText);
}

function compareCPUs() {
  const a = readCPU("a");
  const b = readCPU("b");
  updateMetrics(a, b);
  updateTable(a, b);
  updateExplanations(a, b);
  const status = document.querySelector("#cpu-comparison-status");
  status.textContent = a && b
    ? "Comparison updated from entered specifications. No benchmarks, FPS, or overall winner are inferred."
    : "Correct the highlighted required or invalid specifications to compare both CPUs.";
}

function clearResults() {
  const outputIds = [
    "metric-core-difference", "metric-core-percent", "metric-thread-difference",
    "metric-thread-percent", "metric-l2-difference", "metric-l3-difference",
    "metric-base-clock-difference", "metric-boost-clock-difference", "metric-price-difference",
    "a-table-name", "b-table-name",
    "a-value-model", "b-value-model",
    "a-value-manufacturer", "b-value-manufacturer",
    "a-value-architecture", "b-value-architecture",
    "a-value-cores", "b-value-cores", "diff-cores",
    "a-value-core-config", "b-value-core-config",
    "a-value-threads", "b-value-threads", "diff-threads",
    "a-value-base-clock", "b-value-base-clock", "diff-base-clock",
    "a-value-boost-clock", "b-value-boost-clock", "diff-boost-clock",
    "a-value-l2-cache", "b-value-l2-cache", "diff-l2-cache",
    "a-value-l3-cache", "b-value-l3-cache", "diff-l3-cache",
    "a-value-base-power", "b-value-base-power",
    "a-value-max-power", "b-value-max-power",
    "a-value-socket", "b-value-socket",
    "a-value-graphics", "b-value-graphics",
    "a-value-memory", "b-value-memory",
    "a-value-price", "b-value-price", "diff-price",
  ];
  outputIds.forEach((id) => setOutput(id, "—"));
  const explanations = ["gaming", "multitasking", "productivity", "power", "platform", "value"];
  explanations.forEach((id) => setOutput(`explanation-${id}`, "Enter valid required specifications for both CPUs to see a conditional note."));
  document.querySelector("#cpu-comparison-status").textContent = "Enter specifications for both processors to compare them.";
}

function clearAllErrors() {
  for (const definition of numericDefinitions) {
    clearError(document.querySelector(`#${definition.id}`));
  }
  for (const side of ["a", "b"]) {
    for (const field of ["manufacturer", "model", "graphics"]) {
      clearError(document.querySelector(`#${side}-${field}`));
    }
  }
}

cpuForm.addEventListener("submit", (event) => {
  event.preventDefault();
  hasCompared = true;
  compareCPUs();
});
cpuForm.addEventListener("input", () => {
  if (hasCompared) compareCPUs();
});
cpuForm.addEventListener("change", () => {
  if (hasCompared) compareCPUs();
});
resetButton.addEventListener("click", () => {
  cpuForm.reset();
  hasCompared = false;
  clearAllErrors();
  clearResults();
});
