const numericDefinitions = [
  { id: "installed-ram", key: "installedRam", label: "installed RAM", unit: "GB", min: 0.25, max: 1024, decimalPlaces: 2, required: true },
  { id: "resolution-width", key: "resolutionWidth", label: "custom resolution width", unit: "pixels", min: 320, max: 16384, integer: true, requiredWhen: "resolution", requiredValue: "custom" },
  { id: "resolution-height", key: "resolutionHeight", label: "custom resolution height", unit: "pixels", min: 200, max: 16384, integer: true, requiredWhen: "resolution", requiredValue: "custom" },
  { id: "refresh-rate", key: "refreshRate", label: "refresh rate", unit: "Hz", min: 1, max: 1000, decimalPlaces: 2, required: true },
  { id: "target-fps", key: "targetFps", label: "target FPS", unit: "FPS", min: 1, max: 1000, decimalPlaces: 2 },
  { id: "gpu-util", key: "gpuUtil", label: "GPU utilisation", unit: "%", min: 0, max: 100, decimalPlaces: 2 },
  { id: "cpu-util", key: "cpuUtil", label: "overall CPU utilisation", unit: "%", min: 0, max: 100, decimalPlaces: 2 },
  { id: "thread-util", key: "threadUtil", label: "highest individual CPU core or thread utilisation", unit: "%", min: 0, max: 100, decimalPlaces: 2 },
  { id: "ram-util", key: "ramUtil", label: "RAM utilisation", unit: "%", min: 0, max: 100, decimalPlaces: 2 },
  { id: "vram-util", key: "vramUtil", label: "VRAM utilisation", unit: "%", min: 0, max: 100, decimalPlaces: 2 },
  { id: "average-fps", key: "averageFps", label: "average FPS", unit: "FPS", min: 1, max: 1000, decimalPlaces: 2 },
  { id: "one-percent-low", key: "onePercentLow", label: "1% low FPS", unit: "FPS", min: 1, max: 1000, decimalPlaces: 2 },
  { id: "cpu-temp", key: "cpuTemp", label: "CPU temperature", unit: "°C", min: 0, max: 150, decimalPlaces: 2 },
  { id: "gpu-temp", key: "gpuTemp", label: "GPU temperature", unit: "°C", min: 0, max: 150, decimalPlaces: 2 },
];

const ramConfigurations = {
  single: "Single-channel",
  dual: "Dual-channel",
  other: "Other",
  unknown: "Unknown",
};
const storageTypes = {
  hdd: "HDD",
  "sata-ssd": "SATA SSD",
  "nvme-ssd": "NVMe SSD",
  other: "Other",
  unknown: "Unknown",
};
const resolutions = {
  "1080p": "1080p",
  "1440p": "1440p",
  "4k": "4K",
  ultrawide: "Ultrawide (exact dimensions not supplied)",
  custom: "Custom",
};
const workloads = {
  "competitive-gaming": "Competitive gaming",
  "general-gaming": "General gaming",
  productivity: "Productivity",
  "video-editing": "Video editing",
  "3d-rendering": "3D rendering",
  other: "Other",
};
const graphicsSettings = {
  low: "Low",
  medium: "Medium",
  high: "High",
  ultra: "Ultra",
  custom: "Custom",
};
const frameLimits = {
  unknown: "Unknown",
  uncapped: "Uncapped",
  capped: "Frame-capped",
  vsync: "V-Sync enabled",
  "refresh-limited": "Refresh / external limit",
};
const memoryPressureOptions = {
  unknown: "Unknown",
  yes: "Yes",
  no: "No",
};
const form = document.querySelector("#bottleneck-form");
const resetButton = document.querySelector("#reset-bottleneck");
const resolutionSelect = document.querySelector("#resolution");
const customResolutionFields = [
  {
    wrapper: document.querySelector("#custom-resolution-fields"),
    input: document.querySelector("#resolution-width"),
  },
  {
    wrapper: document.querySelector("#custom-height-fields"),
    input: document.querySelector("#resolution-height"),
  },
];
const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
let hasAnalysed = false;

const initialFactors = {
  gpu: "Enter measurements to see whether a GPU utilisation signal warrants testing.",
  cpu: "Individual-thread and GPU utilisation can help guide a CPU-side investigation.",
  ram: "Capacity alone does not establish a RAM limitation.",
  vram: "Reported usage alone does not establish VRAM pressure.",
  storage: "Storage type may affect loading and asset access; no storage performance measurement is entered.",
  thermal: "Temperature alone cannot establish throttling; compare limits with frequency and power evidence.",
  "frame-limit": "Frame caps, V-Sync, refresh limits, resolution, settings, and workload can change utilisation.",
};

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
  const required = definition.required
    || (definition.requiredWhen && values[definition.requiredWhen] === definition.requiredValue);

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

function readSelect(id, options, label, values, key) {
  const input = document.querySelector(`#${id}`);
  if (!Object.prototype.hasOwnProperty.call(options, input.value)) {
    showError(input, `Select a valid ${label}.`);
    return false;
  }
  clearError(input);
  values[key] = input.value;
  return true;
}

function readInputs() {
  const values = {};
  let valid = true;

  if (!readSelect("ram-configuration", ramConfigurations, "RAM configuration", values, "ramConfiguration")) valid = false;
  if (!readSelect("storage-type", storageTypes, "storage type", values, "storageType")) valid = false;
  if (!readSelect("resolution", resolutions, "display resolution", values, "resolution")) valid = false;
  if (!readSelect("primary-workload", workloads, "primary workload", values, "workload")) valid = false;
  if (!readSelect("graphics-settings", graphicsSettings, "graphics settings", values, "settings")) valid = false;
  if (!readSelect("frame-limit", frameLimits, "frame limit status", values, "frameLimit")) valid = false;
  if (!readSelect("memory-pressure", memoryPressureOptions, "memory pressure observation", values, "memoryPressure")) valid = false;

  for (const definition of numericDefinitions) {
    if (!readNumericField(definition, values)) valid = false;
  }

  values.cpuModel = document.querySelector("#cpu-model").value.trim();
  values.gpuModel = document.querySelector("#gpu-model").value.trim();

  const hasAverageFps = Number.isFinite(values.averageFps);
  const hasOnePercentLow = Number.isFinite(values.onePercentLow);
  if (hasAverageFps && hasOnePercentLow) {
    if (values.onePercentLow > values.averageFps * 1.05 + 1e-8) {
      showError(document.querySelector("#one-percent-low"), "A 1% low is usually at or below average FPS. Check these values; an above-average result within 5% is allowed as possible measurement or rounding noise.");
      valid = false;
    } else {
      values.fpsConsistencyWarning = values.onePercentLow > values.averageFps;
    }
  } else {
    values.fpsConsistencyWarning = false;
  }

  return valid ? values : null;
}

function formatNumber(value, unit = "") {
  return `${numberFormat.format(value)}${unit ? ` ${unit}` : ""}`;
}

function resolutionDescription(values) {
  if (values.resolution === "custom") {
    return `${numberFormat.format(values.resolutionWidth)} × ${numberFormat.format(values.resolutionHeight)} px (custom)`;
  }
  return resolutions[values.resolution];
}

function factorStateLabel(state) {
  if (state === "possible") return "Possible signal — not a confirmed bottleneck";
  if (state === "insufficient") return "Insufficient measurements";
  if (state === "not-indicated") return "No strong signal in supplied data";
  if (state === "context") return "Interpretation caveat";
  return "Not evaluated";
}

function setFactor(id, state, message) {
  const card = document.querySelector(`#factor-${id}`);
  card.dataset.state = state;
  card.querySelector(".bottleneck-factor-state").textContent = factorStateLabel(state);
  card.querySelector(".bottleneck-factor-message").textContent = message;
}

function formatUtil(value) {
  return value === null ? "not supplied" : formatNumber(value, "%");
}

function analyseGpu(values) {
  if (values.gpuUtil === null) {
    return {
      state: "insufficient",
      message: "No GPU utilisation measurement was entered. A high value during an uncapped graphics workload may show the GPU is heavily occupied, but utilisation alone would not prove it limits performance.",
    };
  }
  if (values.gpuUtil >= 90) {
    const capContext = values.frameLimit === "uncapped"
      ? "The run is reported uncapped."
      : `Frame-limit status is ${frameLimits[values.frameLimit].toLowerCase()}, which can change utilisation.`;
    return {
      state: "possible",
      message: `GPU utilisation was ${formatUtil(values.gpuUtil)}. This high reading may indicate the GPU is heavily occupied during this sample; it does not establish a GPU limitation. ${capContext} Compare repeatable runs at different resolutions and settings.`,
    };
  }
  return {
    state: "not-indicated",
    message: `GPU utilisation was ${formatUtil(values.gpuUtil)} in the supplied sample, below this tool's heuristic high-use cue. This does not rule out a GPU-side limit; workload, frame caps, and sampling conditions matter.`,
  };
}

function analyseCpu(values) {
  if (values.gpuUtil === null || values.threadUtil === null) {
    const overallNote = values.cpuUtil === null
      ? " Overall CPU utilisation is also not supplied."
      : ` Overall CPU utilisation is ${formatUtil(values.cpuUtil)}; it need not reach 100% for one thread to be a limit.`;
    return {
      state: "insufficient",
      message: `Both GPU utilisation and highest individual core/thread utilisation help assess a possible CPU-side signal.${overallNote} Enter thread-level measurements and compare under controlled conditions.`,
    };
  }

  if (values.gpuUtil <= 80 && values.threadUtil >= 90) {
    const capNote = ["capped", "vsync", "refresh-limited"].includes(values.frameLimit)
      ? ` The reported ${frameLimits[values.frameLimit].toLowerCase()} can also reduce GPU use.`
      : "";
    const overallNote = values.cpuUtil === null
      ? " Overall CPU utilisation is not required to reach 100% for this pattern to be worth checking."
      : ` Overall CPU utilisation was ${formatUtil(values.cpuUtil)}; whole-CPU averages can hide a busy thread.`;
    return {
      state: "possible",
      message: `GPU utilisation was ${formatUtil(values.gpuUtil)} while the busiest CPU thread was ${formatUtil(values.threadUtil)}. This combination may suggest a CPU-side limitation in this sample, but is not proof.${capNote}${overallNote} Repeat the same scene and check frame times.`,
    };
  }

  if (values.threadUtil >= 90) {
    return {
      state: "insufficient",
      message: `A busy CPU thread was reported at ${formatUtil(values.threadUtil)}, while GPU utilisation was ${formatUtil(values.gpuUtil)}. Both components may be active; these readings do not isolate the limiting factor.`,
    };
  }

  return {
    state: "not-indicated",
    message: `The supplied GPU and busiest-thread readings (${formatUtil(values.gpuUtil)} and ${formatUtil(values.threadUtil)}) do not show the specific low-GPU/high-thread pattern used as a CPU-side investigation cue. Other CPU-side limits are not ruled out.`,
  };
}

function analyseRam(values) {
  if (values.memoryPressure === "yes" && values.ramUtil !== null && values.ramUtil >= 90) {
    return {
      state: "possible",
      message: `Paging or stuttering was observed and RAM utilisation was ${formatUtil(values.ramUtil)}. Together these may indicate memory pressure, but do not prove that installed capacity is insufficient or that RAM is the cause.`,
    };
  }
  if (values.memoryPressure === "yes" || (values.ramUtil !== null && values.ramUtil >= 90)) {
    return {
      state: "insufficient",
      message: `RAM utilisation is ${formatUtil(values.ramUtil)} and paging/stuttering is ${memoryPressureOptions[values.memoryPressure].toLowerCase()}. A single high value or symptom is not enough to identify memory pressure; check paging activity, process use, and repeatable frame-time behavior.`,
    };
  }
  if (values.ramUtil !== null && values.memoryPressure === "no") {
    return {
      state: "not-indicated",
      message: `The supplied RAM utilisation is ${formatUtil(values.ramUtil)} and no paging/stuttering was reported. This sample provides no strong memory-pressure signal, but does not rule out intermittent pressure.`,
    };
  }
  return {
    state: "insufficient",
    message: "RAM utilisation or paging/stuttering observations are incomplete. Installed RAM capacity alone cannot establish whether memory is insufficient.",
  };
}

function analyseVram(values) {
  if (values.vramUtil === null) {
    return {
      state: "insufficient",
      message: "No VRAM utilisation measurement was supplied. Even a high reported allocation would not by itself prove active memory pressure.",
    };
  }
  if (values.vramUtil >= 90) {
    return {
      state: "possible",
      message: `Reported VRAM utilisation was ${formatUtil(values.vramUtil)}. This is a signal to investigate, not proof of a VRAM limitation: allocation can differ from active pressure. Check paging/eviction evidence, frame times, and repeatable texture-setting tests.`,
    };
  }
  return {
    state: "not-indicated",
    message: `Reported VRAM utilisation was ${formatUtil(values.vramUtil)} in this sample. That does not indicate high reported use here, but does not rule out workload-specific or transient VRAM pressure.`,
  };
}

function analyseStorage(values) {
  if (values.storageType === "unknown") {
    return {
      state: "insufficient",
      message: "Storage type is Unknown. Storage can affect loading, streaming, and asset access, but no disk activity, latency, or queue measurement is provided.",
    };
  }
  const storageNote = values.storageType === "hdd"
    ? "The entered primary storage is an HDD; storage activity may affect loading, streaming, or asset access in some workloads."
    : `The entered primary storage is ${storageTypes[values.storageType]}; type alone cannot show whether it limits loading or asset access.`;
  return {
    state: "insufficient",
    message: `${storageNote} Correlate disk activity and latency with stalls. Faster storage does not necessarily increase average FPS.`,
  };
}

function analyseThermal(values) {
  if (values.cpuTemp === null && values.gpuTemp === null) {
    return {
      state: "insufficient",
      message: "No temperature measurements were supplied. This tool has no frequency, power-limit, or throttle-flag measurements and cannot assess thermal or power constraints.",
    };
  }
  const temperatures = [];
  if (values.cpuTemp !== null) temperatures.push(`CPU ${formatNumber(values.cpuTemp, "°C")}`);
  if (values.gpuTemp !== null) temperatures.push(`GPU ${formatNumber(values.gpuTemp, "°C")}`);
  return {
    state: "insufficient",
    message: `User-supplied temperature(s): ${temperatures.join(", ")}. Temperature alone does not establish throttling; compare with the exact component limits and observe sustained frequency, power, and throttle indicators.`,
  };
}

function workloadContext(values) {
  const workloadNotes = {
    "competitive-gaming": "Competitive games can be sensitive to frame pacing and CPU-thread work, but engines and scenes differ.",
    "general-gaming": "Game engines, scenes, settings, and frame limits distribute work differently.",
    productivity: "Productivity workloads vary in whether they are limited by CPU threads, GPU acceleration, memory, or storage.",
    "video-editing": "Video-editing behavior depends on codec, effects, timeline, software, and hardware acceleration.",
    "3d-rendering": "3D rendering depends on the renderer, scene, software support, and whether work is assigned to CPU or GPU.",
    other: "The behavior of this workload depends on its software and task.",
  };
  return workloadNotes[values.workload];
}

function analyseFrameLimits(values) {
  const limitNote = values.frameLimit === "unknown"
    ? "Frame-cap/V-Sync status is Unknown; a cap, V-Sync, or refresh limit can change utilisation and frame pacing."
    : `Frame-limit context: ${frameLimits[values.frameLimit]}. Caps, V-Sync, and refresh limits can change utilisation and frame pacing.`;
  const resolutionNote = `At ${resolutionDescription(values)} and ${graphicsSettings[values.settings].toLowerCase()} settings, higher resolution generally adds GPU rendering work; lowering settings can shift the limiting factor toward CPU-side work. Ray tracing can substantially change GPU demand.`;
  let fpsNote = "";
  if (values.targetFps !== null && values.averageFps !== null) {
    fpsNote = values.averageFps < values.targetFps
      ? ` Measured average FPS (${formatNumber(values.averageFps)}) is below the entered target (${formatNumber(values.targetFps)}); this difference does not identify its cause.`
      : ` Measured average FPS (${formatNumber(values.averageFps)}) meets or exceeds the entered target in this sample; that does not guarantee consistent frame times or 1% lows.`;
  } else if (values.targetFps !== null) {
    fpsNote = ` Target FPS is ${formatNumber(values.targetFps)}; no average FPS was entered for comparison.`;
  }
  const consistencyNote = values.fpsConsistencyWarning
    ? " The entered 1% low is slightly above average within the 5% tolerance; recheck the run and capture method."
    : "";
  return {
    state: "context",
    message: `${limitNote} ${resolutionNote} ${workloadContext(values)}${fpsNote}${consistencyNote}`,
  };
}

function formatMeasurement(value, unit = "") {
  return value === null ? "Not supplied" : `${formatNumber(value)}${unit ? ` ${unit}` : ""} (user-supplied)`;
}

function renderSystemSummary(values) {
  const resolution = resolutionDescription(values);
  const target = values.targetFps === null ? "not supplied" : `${formatNumber(values.targetFps)} FPS`;
  const cpu = values.cpuModel || "model not supplied";
  const gpu = values.gpuModel || "model not supplied";
  return `CPU: ${cpu}; GPU: ${gpu}. RAM: ${formatNumber(values.installedRam)} GB (${ramConfigurations[values.ramConfiguration]}). Primary storage: ${storageTypes[values.storageType]}. Display: ${resolution} at ${formatNumber(values.refreshRate)} Hz. Workload: ${workloads[values.workload]}; graphics settings: ${graphicsSettings[values.settings]}. Target: ${target}.`;
}

function renderMeasurements(values) {
  const items = [
    ["GPU utilisation", formatMeasurement(values.gpuUtil, "%")],
    ["Overall CPU utilisation", formatMeasurement(values.cpuUtil, "%")],
    ["Highest CPU core/thread utilisation", formatMeasurement(values.threadUtil, "%")],
    ["RAM utilisation", formatMeasurement(values.ramUtil, "%")],
    ["VRAM utilisation", formatMeasurement(values.vramUtil, "%")],
    ["Average FPS", formatMeasurement(values.averageFps, "FPS")],
    ["1% low FPS", formatMeasurement(values.onePercentLow, "FPS")],
    ["CPU temperature", formatMeasurement(values.cpuTemp, "°C")],
    ["GPU temperature", formatMeasurement(values.gpuTemp, "°C")],
    ["Frame cap / V-Sync", frameLimits[values.frameLimit]],
    ["Paging / stuttering observed", memoryPressureOptions[values.memoryPressure]],
  ];
  const list = document.querySelector("#measurement-summary");
  while (list.firstChild) list.removeChild(list.firstChild);
  for (const [label, value] of items) {
    const item = document.createElement("li");
    item.textContent = `${label}: ${value}`;
    list.appendChild(item);
  }
  if (values.fpsConsistencyWarning) {
    const item = document.createElement("li");
    item.textContent = "Review note: 1% low is above average within the accepted 5% measurement/rounding tolerance.";
    list.appendChild(item);
  }
}

function renderDiagnostics(values) {
  const suggestions = [
    "Repeat the same scene or task with the same settings, capture method, and background tasks; compare frame-time consistency.",
    "Compare GPU utilisation across resolutions and low versus high graphics settings; keep other conditions unchanged.",
    "Monitor individual CPU threads instead of relying on overall CPU utilisation alone.",
    "Check RAM and VRAM pressure, paging, stuttering, and relevant process usage; high reported allocation is not proof of pressure.",
    "Check background processes and observe power, clock, and temperature behavior against the exact component limits.",
  ];
  if (values.frameLimit !== "uncapped") {
    suggestions.push("Check V-Sync, frame caps, and refresh or external limits; compare a controlled uncapped run where appropriate.");
  }
  if (values.storageType === "hdd") {
    suggestions.push("Correlate HDD activity and latency with loading, streaming, or asset-access stalls; do not assume storage changes average FPS.");
  }

  const list = document.querySelector("#diagnostic-suggestions");
  while (list.firstChild) list.removeChild(list.firstChild);
  for (const suggestion of suggestions) {
    const item = document.createElement("li");
    item.textContent = suggestion;
    list.appendChild(item);
  }
}

function resetAnalysis(message = "Run an analysis to see the entered system summary, measurements, and conditional notes.") {
  document.querySelector("#analysis-summary").textContent = message;
  document.querySelector("#system-summary").textContent = "No system summary yet.";
  const measurementList = document.querySelector("#measurement-summary");
  while (measurementList.firstChild) measurementList.removeChild(measurementList.firstChild);
  const initialItem = document.createElement("li");
  initialItem.textContent = "Not analysed.";
  measurementList.appendChild(initialItem);
  for (const [id, text] of Object.entries(initialFactors)) {
    setFactor(id, "not-evaluated", text);
  }
  const diagnosticList = document.querySelector("#diagnostic-suggestions");
  while (diagnosticList.firstChild) diagnosticList.removeChild(diagnosticList.firstChild);
  [
    "Repeat the same scene with the same settings and background tasks.",
    "Compare GPU utilisation at different resolutions and at low versus high graphics settings.",
    "Monitor individual CPU threads, frame-time consistency, RAM/VRAM pressure, background processes, and power/temperature behaviour.",
  ].forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    diagnosticList.appendChild(item);
  });
}

function analyse() {
  const values = readInputs();
  if (!values) {
    resetAnalysis("Correct the highlighted entries. Invalid input is not used to produce conditional analysis.");
    document.querySelector("#bottleneck-status").textContent = "Fix the highlighted required or invalid values before analysis.";
    return;
  }

  document.querySelector("#system-summary").textContent = renderSystemSummary(values);
  renderMeasurements(values);

  const factors = {
    gpu: analyseGpu(values),
    cpu: analyseCpu(values),
    ram: analyseRam(values),
    vram: analyseVram(values),
    storage: analyseStorage(values),
    thermal: analyseThermal(values),
    "frame-limit": analyseFrameLimits(values),
  };
  for (const [id, result] of Object.entries(factors)) {
    setFactor(id, result.state, result.message);
  }

  const possibleCount = Object.values(factors).filter((result) => result.state === "possible").length;
  const insufficientCount = Object.values(factors).filter((result) => result.state === "insufficient").length;
  const summary = possibleCount
    ? `${possibleCount} possible signal(s) merit follow-up; none is a confirmed bottleneck. Results depend on representative, repeatable measurements and workload context.`
    : insufficientCount
      ? "Insufficient measurements to isolate a limiting factor. No bottleneck verdict, score, or FPS prediction is produced."
      : "No strong signal appears in the supplied data. That does not rule out a workload-specific or intermittent limitation.";
  document.querySelector("#analysis-summary").textContent = summary;
  renderDiagnostics(values);
  document.querySelector("#bottleneck-status").textContent = "Analysis updated from user-supplied information. Repeat controlled tests before drawing conclusions.";
}

function clearAllErrors() {
  form.querySelectorAll("input, select").forEach(clearError);
}

function syncCustomResolution() {
  const custom = resolutionSelect.value === "custom";
  for (const field of customResolutionFields) {
    field.wrapper.hidden = !custom;
    field.input.disabled = !custom;
    field.input.required = custom;
    if (!custom) clearError(field.input);
  }
}

resolutionSelect.addEventListener("change", () => {
  syncCustomResolution();
  if (hasAnalysed) analyse();
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  hasAnalysed = true;
  analyse();
});
form.addEventListener("input", () => {
  if (hasAnalysed) analyse();
});
form.addEventListener("change", () => {
  if (hasAnalysed) analyse();
});
resetButton.addEventListener("click", () => {
  form.reset();
  hasAnalysed = false;
  syncCustomResolution();
  clearAllErrors();
  resetAnalysis();
  document.querySelector("#bottleneck-status").textContent = "Enter system information; measurements are optional.";
});

syncCustomResolution();
