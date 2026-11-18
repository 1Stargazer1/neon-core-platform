const numericDefinitions = [
  { id: "a-vram", key: "vram", label: "VRAM capacity", unit: "GB", min: 0.1, max: 512 },
  { id: "a-bus-width", key: "busWidth", label: "memory bus width", unit: "bits", min: 8, max: 8192, integer: true, multiple: 8 },
  { id: "a-data-rate", key: "dataRate", label: "effective memory data rate", unit: "Gbps per pin", min: 0.1, max: 100 },
  { id: "a-advertised-bandwidth", key: "advertisedBandwidth", label: "advertised memory bandwidth", unit: "GB/s", min: 0.1, max: 10000 },
  { id: "a-base-clock", key: "baseClock", label: "base clock", unit: "MHz", min: 1, max: 10000 },
  { id: "a-boost-clock", key: "boostClock", label: "boost clock", unit: "MHz", min: 1, max: 10000 },
  { id: "a-unit-count", key: "unitCount", label: "shader or compute unit count", min: 1, max: 100000, integer: true },
  { id: "a-board-power", key: "boardPower", label: "manufacturer-rated board power", unit: "W", min: 1, max: 2000 },
  { id: "a-psu", key: "psu", label: "recommended PSU wattage", unit: "W", min: 1, max: 3000 },
  { id: "a-price", key: "price", label: "price", unit: "AUD", min: 0.01, max: 100000, decimalPlaces: 2 },
  { id: "b-vram", key: "vram", label: "VRAM capacity", unit: "GB", min: 0.1, max: 512 },
  { id: "b-bus-width", key: "busWidth", label: "memory bus width", unit: "bits", min: 8, max: 8192, integer: true, multiple: 8 },
  { id: "b-data-rate", key: "dataRate", label: "effective memory data rate", unit: "Gbps per pin", min: 0.1, max: 100 },
  { id: "b-advertised-bandwidth", key: "advertisedBandwidth", label: "advertised memory bandwidth", unit: "GB/s", min: 0.1, max: 10000 },
  { id: "b-base-clock", key: "baseClock", label: "base clock", unit: "MHz", min: 1, max: 10000 },
  { id: "b-boost-clock", key: "boostClock", label: "boost clock", unit: "MHz", min: 1, max: 10000 },
  { id: "b-unit-count", key: "unitCount", label: "shader or compute unit count", min: 1, max: 100000, integer: true },
  { id: "b-board-power", key: "boardPower", label: "manufacturer-rated board power", unit: "W", min: 1, max: 2000 },
  { id: "b-psu", key: "psu", label: "recommended PSU wattage", unit: "W", min: 1, max: 3000 },
  { id: "b-price", key: "price", label: "price", unit: "AUD", min: 0.01, max: 100000, decimalPlaces: 2 },
];

const manufacturerLabels = {
  nvidia: "NVIDIA",
  amd: "AMD",
  intel: "Intel",
  apple: "Apple",
  other: "Other",
};
const gpuTypeLabels = {
  dedicated: "Dedicated",
  integrated: "Integrated",
  other: "Other",
};
const vramTechnologyLabels = {
  gddr6: "GDDR6",
  gddr6x: "GDDR6X",
  gddr7: "GDDR7",
  hbm: "HBM",
  other: "Other",
  unknown: "Unknown",
};
const rayTracingLabels = {
  yes: "Yes",
  no: "No",
  unknown: "Unknown",
};
const externalMemoryTechnologies = new Set(["gddr6", "gddr6x", "gddr7", "hbm"]);
const gpuForm = document.querySelector("#gpu-comparison-form");
const resetButton = document.querySelector("#reset-gpus");
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
  if (definition.multiple && value % definition.multiple !== 0) {
    showError(input, `${definition.label} must be a multiple of ${definition.multiple}.`);
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

function readSelect(id, labels, label, values, key) {
  const input = document.querySelector(`#${id}`);
  if (!Object.prototype.hasOwnProperty.call(labels, input.value)) {
    showError(input, `Select a valid ${label}.`);
    return false;
  }
  clearError(input);
  values[key] = input.value;
  return true;
}

function bandwidthApplicability(gpu) {
  if (gpu.type !== "dedicated") {
    return "Not calculated: formula is not applied to integrated or other GPU types.";
  }
  if (!externalMemoryTechnologies.has(gpu.vramTechnology)) {
    return "Not calculated: select a known GDDR6, GDDR6X, GDDR7, or HBM technology.";
  }
  if (gpu.busWidth === null || gpu.dataRate === null) {
    return "Not calculated: enter both bus width and effective data rate.";
  }
  return "";
}

function calculateTheoreticalBandwidth(gpu) {
  const reason = bandwidthApplicability(gpu);
  if (reason) return { calculatedBandwidth: null, reason };
  const value = (gpu.busWidth * gpu.dataRate) / 8;
  if (!Number.isFinite(value)) {
    return { calculatedBandwidth: null, reason: "Not calculated: inputs do not produce a finite result." };
  }
  return { calculatedBandwidth: value, reason: "" };
}

function readGPU(side) {
  const values = {};
  let valid = true;

  for (const definition of numericDefinitions) {
    if (!definition.id.startsWith(`${side}-`)) continue;
    if (!readNumericField(definition, values)) valid = false;
  }

  const requiredSelections = [
    { id: `${side}-manufacturer`, labels: manufacturerLabels, label: "manufacturer", key: "manufacturer" },
    { id: `${side}-type`, labels: gpuTypeLabels, label: "GPU type", key: "type" },
    { id: `${side}-ray-tracing`, labels: rayTracingLabels, label: "ray tracing support", key: "rayTracing" },
    { id: `${side}-vram-tech`, labels: vramTechnologyLabels, label: "VRAM technology", key: "vramTechnology" },
  ];
  for (const selection of requiredSelections) {
    if (!readSelect(selection.id, selection.labels, selection.label, values, selection.key)) valid = false;
  }

  const modelInput = document.querySelector(`#${side}-model`);
  values.model = modelInput.value.trim();
  if (!values.model) {
    showError(modelInput, "Enter a GPU model or name.");
    valid = false;
  } else {
    clearError(modelInput);
  }

  for (const key of ["architecture", "unitName", "encoding", "displayOutputs"]) {
    values[key] = document.querySelector(`#${side}-${key === "unitName" ? "unit-name" : key === "displayOutputs" ? "display-outputs" : key}`).value.trim();
  }

  if (values.baseClock !== null && values.boostClock !== null && values.boostClock < values.baseClock) {
    showError(document.querySelector(`#${side}-boost-clock`), "Boost clock should not be lower than base clock.");
    valid = false;
  }

  if (!valid) return null;
  const bandwidth = calculateTheoreticalBandwidth(values);
  return { ...values, ...bandwidth };
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

function formatBandwidth(gpu) {
  return gpu.calculatedBandwidth === null
    ? gpu.reason
    : `${formatNumber(gpu.calculatedBandwidth)} GB/s (theoretical)`;
}

function comparableExternalMemory(a, b) {
  return a.type === "dedicated"
    && b.type === "dedicated"
    && externalMemoryTechnologies.has(a.vramTechnology)
    && a.vramTechnology === b.vramTechnology;
}

function vramDifference(a, b, percentage = false) {
  if (!a || !b) return "Both GPUs need valid specifications.";
  if (a.vram === null || b.vram === null) return "Both VRAM capacities are needed.";
  if (a.type !== "dedicated" || b.type !== "dedicated") return "Not directly comparable for integrated or other GPU types.";
  const difference = b.vram - a.vram;
  if (percentage) {
    if (a.vram <= 0) return "Unavailable: GPU A baseline must be above zero.";
    return formatSigned((difference / a.vram) * 100, "%");
  }
  return formatSigned(difference, "GB");
}

function externalMemoryDifference(a, b, key, unit) {
  if (!a || !b) return "Both GPUs need valid specifications.";
  if (!comparableExternalMemory(a, b)) return "Not directly comparable: memory technology or GPU type differs.";
  if (a[key] === null || b[key] === null) return "Both values are needed.";
  return formatSigned(b[key] - a[key], unit);
}

function bandwidthDifference(a, b, key) {
  if (!a || !b) return "Both GPUs need valid specifications.";
  if (key === "calculatedBandwidth" && (a[key] === null || b[key] === null)) {
    return "Both GPUs need applicable calculated bandwidth.";
  }
  if (key === "advertisedBandwidth" && (a[key] === null || b[key] === null)) {
    return "Both advertised values are needed.";
  }
  return formatSigned(b[key] - a[key], "GB/s");
}

function updateMetrics(a, b) {
  const outputIds = [
    "metric-vram-difference",
    "metric-vram-percent",
    "metric-bus-width-difference",
    "metric-calculated-bandwidth-difference",
    "metric-advertised-bandwidth-difference",
    "metric-base-clock-difference",
    "metric-boost-clock-difference",
    "metric-board-power-difference",
    "metric-price-difference",
  ];
  if (!a || !b) {
    outputIds.forEach((id) => setOutput(id, "—"));
    return;
  }
  setOutput("metric-vram-difference", vramDifference(a, b));
  setOutput("metric-vram-percent", vramDifference(a, b, true));
  setOutput("metric-bus-width-difference", externalMemoryDifference(a, b, "busWidth", "bits"));
  setOutput("metric-calculated-bandwidth-difference", bandwidthDifference(a, b, "calculatedBandwidth"));
  setOutput("metric-advertised-bandwidth-difference", bandwidthDifference(a, b, "advertisedBandwidth"));
  setOutput("metric-base-clock-difference", optionalDifference(a.baseClock, b.baseClock, "MHz"));
  setOutput("metric-boost-clock-difference", optionalDifference(a.boostClock, b.boostClock, "MHz"));
  setOutput("metric-board-power-difference", optionalDifference(a.boardPower, b.boardPower, "W"));
  setOutput("metric-price-difference", a.price === null || b.price === null ? "Both prices needed" : formatCurrencyDifference(b.price - a.price));
}

function optionalDifference(a, b, unit) {
  return a === null || b === null ? "Both values needed" : formatSigned(b - a, unit);
}

function formatUnitCount(gpu) {
  if (gpu.unitCount === null) return "Not supplied";
  return gpu.unitName ? `${integerFormat.format(gpu.unitCount)} ${gpu.unitName}` : integerFormat.format(gpu.unitCount);
}

function updateTable(a, b) {
  setOutput("a-table-name", a ? a.model : "GPU A");
  setOutput("b-table-name", b ? b.model : "GPU B");

  const rows = [
    { key: "model", value: (gpu) => gpu.model, difference: "—" },
    { key: "manufacturer", value: (gpu) => manufacturerLabels[gpu.manufacturer], difference: "—" },
    { key: "architecture", value: (gpu) => gpu.architecture || "Not supplied", difference: "—" },
    { key: "type", value: (gpu) => gpuTypeLabels[gpu.type], difference: "—" },
    { key: "vram", value: (gpu) => formatOptional(gpu.vram, "GB"), difference: a && b ? vramDifference(a, b) : "—" },
    { key: "vram-tech", value: (gpu) => vramTechnologyLabels[gpu.vramTechnology], difference: "—" },
    { key: "bus-width", value: (gpu) => formatOptional(gpu.busWidth, "bits"), difference: a && b ? externalMemoryDifference(a, b, "busWidth", "bits") : "—" },
    { key: "data-rate", value: (gpu) => formatOptional(gpu.dataRate, "Gbps per pin"), difference: a && b ? externalMemoryDifference(a, b, "dataRate", "Gbps per pin") : "—" },
    { key: "calculated-bandwidth", value: formatBandwidth, difference: a && b ? bandwidthDifference(a, b, "calculatedBandwidth") : "—" },
    { key: "advertised-bandwidth", value: (gpu) => formatOptional(gpu.advertisedBandwidth, "GB/s"), difference: a && b ? bandwidthDifference(a, b, "advertisedBandwidth") : "—" },
    { key: "base-clock", value: (gpu) => formatOptional(gpu.baseClock, "MHz"), difference: a && b ? optionalDifference(a.baseClock, b.baseClock, "MHz") : "—" },
    { key: "boost-clock", value: (gpu) => formatOptional(gpu.boostClock, "MHz"), difference: a && b ? optionalDifference(a.boostClock, b.boostClock, "MHz") : "—" },
    { key: "unit-count", value: formatUnitCount, difference: a && b ? unitCountDifference(a, b) : "—" },
    { key: "unit-name", value: (gpu) => gpu.unitName || "Not supplied", difference: "—" },
    { key: "board-power", value: (gpu) => formatOptional(gpu.boardPower, "W"), difference: a && b ? optionalDifference(a.boardPower, b.boardPower, "W") : "—" },
    { key: "psu", value: (gpu) => formatOptional(gpu.psu, "W"), difference: a && b ? `${optionalDifference(a.psu, b.psu, "W")} (system recommendation, not GPU draw)` : "—" },
    { key: "ray-tracing", value: (gpu) => rayTracingLabels[gpu.rayTracing], difference: "—" },
    { key: "encoding", value: (gpu) => gpu.encoding || "Not supplied", difference: "—" },
    { key: "display-outputs", value: (gpu) => gpu.displayOutputs || "Not supplied", difference: "—" },
    { key: "price", value: (gpu) => gpu.price === null ? "Not supplied" : currencyFormat.format(gpu.price), difference: a && b ? (a.price === null || b.price === null ? "Both prices needed" : formatCurrencyDifference(b.price - a.price)) : "—" },
  ];

  for (const row of rows) {
    setOutput(`a-value-${row.key}`, a ? row.value(a) : "—");
    setOutput(`b-value-${row.key}`, b ? row.value(b) : "—");
    const differenceCell = document.querySelector(`#diff-${row.key}`);
    if (differenceCell) differenceCell.textContent = row.difference;
  }
}

function unitCountDifference(a, b) {
  if (a.unitCount === null || b.unitCount === null) return "Both counts are needed.";
  const terminologyA = a.unitName.trim().toLowerCase();
  const terminologyB = b.unitName.trim().toLowerCase();
  if (!terminologyA || !terminologyB) return "Unit terminology is needed for comparison.";
  if (terminologyA !== terminologyB) return "Not directly comparable: unit terminology differs.";
  if (a.manufacturer !== b.manufacturer
    || a.type !== b.type
    || !a.architecture
    || !b.architecture
    || a.architecture.trim().toLowerCase() !== b.architecture.trim().toLowerCase()) {
    return "Not directly comparable across manufacturers, architectures, or GPU types.";
  }
  return formatSigned(b.unitCount - a.unitCount, terminologyA, (value) => integerFormat.format(value));
}

function formatBandwidthForGuidance(gpu) {
  return gpu.calculatedBandwidth === null ? "not calculated" : `${formatNumber(gpu.calculatedBandwidth)} GB/s theoretical`;
}

function updateGuidance(a, b) {
  const ids = ["1080p", "1440p", "4k", "high-refresh", "ray-tracing", "vram", "cpu", "video", "rendering", "compute", "streaming", "ai"];
  if (!a || !b) {
    ids.forEach((id) => setOutput(`guide-${id}`, "Enter valid required specifications for both GPUs to see conditional guidance."));
    return;
  }

  const vramA = formatOptional(a.vram, "GB");
  const vramB = formatOptional(b.vram, "GB");
  const encodingA = a.encoding || "not supplied";
  const encodingB = b.encoding || "not supplied";
  setOutput("guide-1080p", `At 1080p, performance still depends on the specific game, settings, drivers, architecture, and system configuration. ${a.model} is listed as ${gpuTypeLabels[a.type].toLowerCase()} with ${vramA}; ${b.model} is ${gpuTypeLabels[b.type].toLowerCase()} with ${vramB}. No FPS is predicted.`);
  setOutput("guide-1440p", `1440p renders more pixels per frame than 1080p, which can increase GPU workload. ${a.model} (${formatOptional(a.vram, "GB")} VRAM) and ${b.model} (${formatOptional(b.vram, "GB")} VRAM) still depend on the game, settings, drivers, architecture, and rest of the system; specifications alone cannot predict frame rates.`);
  setOutput("guide-4k", `4K increases pixel workload relative to lower resolutions. ${a.model} and ${b.model} results depend on game engine, settings, drivers, architecture, and system configuration; these entered specifications do not establish which GPU will meet a particular frame-rate target.`);
  setOutput("guide-high-refresh", `High-refresh gaming needs a GPU and system capable of supplying frames at an appropriate rate, along with a display that supports the target refresh. ${a.model} and ${b.model} have no entered game-FPS or frame-time measurements, so refresh targets cannot be predicted.`);
  setOutput("guide-ray-tracing", `${a.model}: ray tracing support is entered as ${rayTracingLabels[a.rayTracing]}; ${b.model}: ${rayTracingLabels[b.rayTracing]}. Support status does not establish ray tracing speed, image quality, or the performance cost in a specific title.`);
  setOutput("guide-vram", `${a.model}: ${vramA}; ${b.model}: ${vramB}. VRAM needs depend on game, resolution, texture settings, and workload. Capacity alone does not determine speed, and integrated/unified memory is not directly comparable to dedicated VRAM.`);
  setOutput("guide-cpu", `GPU results for ${a.model} and ${b.model} also depend on the CPU, game, resolution, drivers, and system configuration. CPU details are not entered here, so bottlenecks or FPS cannot be assessed.`);
  setOutput("guide-video", `Entered hardware-encoding descriptions: ${a.model} — ${encodingA}; ${b.model} — ${encodingB}. Codec support in the application, drivers, export settings, and workload matter; no render time or quality is inferred.`);
  setOutput("guide-rendering", `${a.model}: ${gpuTypeLabels[a.type].toLowerCase()}, ${vramA} VRAM; ${b.model}: ${gpuTypeLabels[b.type].toLowerCase()}, ${vramB} VRAM. Rendering depends on the application, supported APIs, scene size, drivers, and features; these specifications do not predict render time.`);
  setOutput("guide-compute", `${a.model}: ${formatUnitCount(a)}; ${b.model}: ${formatUnitCount(b)}. Execution-unit counts and terminology may not be equivalent across architectures. Compute support, APIs, precision, software, and workload affect results; no throughput score is generated. Theoretical memory bandwidth is not compute performance.`);
  setOutput("guide-streaming", `Hardware-encoding descriptions: ${a.model} — ${encodingA}; ${b.model} — ${encodingB}. Actual streaming and recording support depends on codec, software, drivers, settings, and system load; no encoding quality or speed is measured.`);
  setOutput("guide-ai", `${a.model}: ${vramA}; ${b.model}: ${vramB}. AI workloads depend on model size, precision, software frameworks, APIs, drivers, and available memory. VRAM or unified-memory capacity alone does not predict model throughput or compatibility.`);
}

function compareGPUs() {
  const a = readGPU("a");
  const b = readGPU("b");
  updateMetrics(a, b);
  updateTable(a, b);
  updateGuidance(a, b);
  const status = document.querySelector("#gpu-comparison-status");
  status.textContent = a && b
    ? "Comparison updated from entered specifications. No benchmarks, FPS, or overall winner are inferred."
    : "Correct the highlighted required or invalid specifications to compare both GPUs.";
}

function clearAllErrors() {
  for (const definition of numericDefinitions) {
    clearError(document.querySelector(`#${definition.id}`));
  }
  for (const side of ["a", "b"]) {
    for (const field of ["manufacturer", "model", "type", "ray-tracing", "vram-tech"]) {
      clearError(document.querySelector(`#${side}-${field}`));
    }
  }
}

function clearResults() {
  const metricIds = [
    "metric-vram-difference", "metric-vram-percent", "metric-bus-width-difference",
    "metric-calculated-bandwidth-difference", "metric-advertised-bandwidth-difference",
    "metric-base-clock-difference", "metric-boost-clock-difference",
    "metric-board-power-difference", "metric-price-difference",
  ];
  metricIds.forEach((id) => setOutput(id, "—"));
  setOutput("a-table-name", "GPU A");
  setOutput("b-table-name", "GPU B");
  const rowKeys = [
    "model", "manufacturer", "architecture", "type", "vram", "vram-tech", "bus-width",
    "data-rate", "calculated-bandwidth", "advertised-bandwidth", "base-clock", "boost-clock",
    "unit-count", "unit-name", "board-power", "psu", "ray-tracing", "encoding",
    "display-outputs", "price",
  ];
  rowKeys.forEach((key) => {
    setOutput(`a-value-${key}`, "—");
    setOutput(`b-value-${key}`, "—");
    const differenceCell = document.querySelector(`#diff-${key}`);
    if (differenceCell) differenceCell.textContent = "—";
  });
  const guideIds = ["1080p", "1440p", "4k", "high-refresh", "ray-tracing", "vram", "cpu", "video", "rendering", "compute", "streaming", "ai"];
  guideIds.forEach((id) => setOutput(`guide-${id}`, "Enter valid required specifications for both GPUs to see conditional guidance."));
  document.querySelector("#gpu-comparison-status").textContent = "Enter required specifications for both GPUs to compare them.";
}

gpuForm.addEventListener("submit", (event) => {
  event.preventDefault();
  hasCompared = true;
  compareGPUs();
});
gpuForm.addEventListener("input", () => {
  if (hasCompared) compareGPUs();
});
gpuForm.addEventListener("change", () => {
  if (hasCompared) compareGPUs();
});
resetButton.addEventListener("click", () => {
  gpuForm.reset();
  hasCompared = false;
  clearAllErrors();
  clearResults();
});
