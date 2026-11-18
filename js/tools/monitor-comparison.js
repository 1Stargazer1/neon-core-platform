const numericFieldDefinitions = [
  { id: "a-size", key: "size", label: "screen size", unit: "inches", min: 8, max: 100, required: true },
  { id: "a-resolution-width", key: "resolutionWidth", label: "resolution width", unit: "pixels", min: 320, max: 16384, integer: true, required: true },
  { id: "a-resolution-height", key: "resolutionHeight", label: "resolution height", unit: "pixels", min: 200, max: 16384, integer: true, required: true },
  { id: "a-refresh-rate", key: "refreshRate", label: "refresh rate", unit: "Hz", min: 1, max: 1000, required: true },
  { id: "a-response-time", key: "responseTime", label: "advertised response time", unit: "ms", min: 0.1, max: 100, required: false },
  { id: "a-brightness", key: "brightness", label: "advertised brightness", unit: "nits", min: 1, max: 5000, required: false },
  { id: "a-price", key: "price", label: "price", unit: "AUD", min: 0.01, max: 100000, decimalPlaces: 2, required: false },
  { id: "b-size", key: "size", label: "screen size", unit: "inches", min: 8, max: 100, required: true },
  { id: "b-resolution-width", key: "resolutionWidth", label: "resolution width", unit: "pixels", min: 320, max: 16384, integer: true, required: true },
  { id: "b-resolution-height", key: "resolutionHeight", label: "resolution height", unit: "pixels", min: 200, max: 16384, integer: true, required: true },
  { id: "b-refresh-rate", key: "refreshRate", label: "refresh rate", unit: "Hz", min: 1, max: 1000, required: true },
  { id: "b-response-time", key: "responseTime", label: "advertised response time", unit: "ms", min: 0.1, max: 100, required: false },
  { id: "b-brightness", key: "brightness", label: "advertised brightness", unit: "nits", min: 1, max: 5000, required: false },
  { id: "b-price", key: "price", label: "price", unit: "AUD", min: 0.01, max: 100000, decimalPlaces: 2, required: false },
];

const panelLabels = {
  ips: "IPS",
  va: "VA",
  tn: "TN",
  oled: "OLED",
  "qd-oled": "QD-OLED",
  "mini-led-lcd": "Mini-LED LCD",
  other: "Other",
  unknown: "Unknown",
};

const syncLabels = {
  freesync: "FreeSync",
  "g-sync-compatible": "G-SYNC Compatible",
  "g-sync": "G-SYNC",
  other: "Other",
  none: "None",
  unknown: "Unknown",
};

const panelExplanations = {
  ips: "IPS LCD is often chosen for viewing angles and colour consistency; contrast and response vary by model.",
  va: "VA LCD is often associated with higher native contrast; transition behavior varies by model.",
  tn: "TN LCD can offer fast transitions in some models, with viewing-angle and colour trade-offs.",
  oled: "OLED is self-emissive and can produce deep blacks; brightness and image-retention considerations vary.",
  "qd-oled": "QD-OLED combines OLED emission with quantum-dot colour conversion; results vary by model.",
  "mini-led-lcd": "Mini-LED LCD uses a zoned backlight that can support local dimming; implementation varies.",
  other: "Other identifies a technology not listed here; the label alone does not predict display performance.",
  unknown: "Panel technology is unknown, so no panel-specific trade-off can be inferred.",
};

const panelSelectValues = Object.keys(panelLabels);
const syncSelectValues = Object.keys(syncLabels);
const comparisonForm = document.querySelector("#monitor-comparison-form");
const resetComparisonButton = document.querySelector("#reset-comparison");
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

function showFieldError(input, message) {
  const error = document.querySelector(`#${input.id}-error`);
  const hint = document.querySelector(`#${input.id}-hint`);
  if (!error) return;
  error.textContent = message;
  error.hidden = false;
  input.setAttribute("aria-invalid", "true");
  if (hint) input.setAttribute("aria-describedby", `${hint.id} ${error.id}`);
  else input.setAttribute("aria-describedby", error.id);
}

function clearFieldError(input) {
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
  if (rawValue === "") {
    clearFieldError(input);
    if (definition.required) {
      showFieldError(input, `Enter a ${definition.label}.`);
      return false;
    }
    values[definition.key] = null;
    return true;
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    showFieldError(input, `Enter a valid ${definition.label}.`);
    return false;
  }
  if (value < definition.min || value > definition.max) {
    showFieldError(input, `${definition.label} must be between ${definition.min} and ${integerFormat.format(definition.max)} ${definition.unit}.`);
    return false;
  }
  if (definition.integer && !Number.isInteger(value)) {
    showFieldError(input, `${definition.label} must be a whole number.`);
    return false;
  }
  if (definition.decimalPlaces) {
    const factor = 10 ** definition.decimalPlaces;
    if (Math.abs(value * factor - Math.round(value * factor)) > 1e-8) {
      showFieldError(input, `${definition.label} must have no more than ${definition.decimalPlaces} decimal places.`);
      return false;
    }
  }

  clearFieldError(input);
  values[definition.key] = value;
  return true;
}

function readSelect(id, allowedValues, label, values, key) {
  const input = document.querySelector(`#${id}`);
  if (!allowedValues.includes(input.value)) {
    showFieldError(input, `Choose a ${label}, or select Unknown if it is not known.`);
    return false;
  }
  clearFieldError(input);
  values[key] = input.value;
  return true;
}

function greatestCommonDivisor(a, b) {
  let left = a;
  let right = b;
  while (right !== 0) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }
  return left;
}

function calculateMetrics(values) {
  const diagonalPixels = Math.hypot(values.resolutionWidth, values.resolutionHeight);
  const diagonalCm = values.size * 2.54;
  const widthCm = diagonalCm * (values.resolutionWidth / diagonalPixels);
  const heightCm = diagonalCm * (values.resolutionHeight / diagonalPixels);
  const areaCm2 = widthCm * heightCm;
  const ppi = diagonalPixels / values.size;
  const totalPixels = values.resolutionWidth * values.resolutionHeight;
  const aspectDivisor = greatestCommonDivisor(values.resolutionWidth, values.resolutionHeight);
  const aspectRatio = `${values.resolutionWidth / aspectDivisor}:${values.resolutionHeight / aspectDivisor}`;
  const refreshInterval = 1000 / values.refreshRate;
  const metrics = { ...values, widthCm, heightCm, areaCm2, ppi, totalPixels, aspectRatio, refreshInterval };

  if (![widthCm, heightCm, areaCm2, ppi, totalPixels, refreshInterval].every(Number.isFinite)) {
    return null;
  }
  return metrics;
}

function readMonitor(side) {
  const values = {};
  let valid = true;

  for (const definition of numericFieldDefinitions) {
    if (!definition.id.startsWith(`${side}-`)) continue;
    if (!readNumericField(definition, values)) valid = false;
  }

  if (!readSelect(`${side}-panel`, panelSelectValues, "panel technology", values, "panel")) valid = false;
  if (!readSelect(`${side}-sync`, syncSelectValues, "adaptive sync option", values, "sync")) valid = false;

  const nameInput = document.querySelector(`#${side}-name`);
  values.name = nameInput.value.trim() || `Monitor ${side.toUpperCase()}`;
  values.hdr = document.querySelector(`#${side}-hdr`).value.trim();
  values.gamut = document.querySelector(`#${side}-gamut`).value.trim();

  if (!valid) return null;
  return calculateMetrics(values);
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

function formatOptionalNumber(value, unit) {
  return value === null ? "Not supplied" : `${formatNumber(value)} ${unit}`;
}

function formatResolution(monitor) {
  return `${integerFormat.format(monitor.resolutionWidth)} × ${integerFormat.format(monitor.resolutionHeight)} px`;
}

function formatPhysicalSize(monitor) {
  return `${formatNumber(monitor.widthCm)} × ${formatNumber(monitor.heightCm)} cm`;
}

function setOutput(id, value) {
  document.querySelector(`#${id}`).textContent = value;
}

function updateCalculatedMetrics(side, monitor) {
  const name = monitor ? monitor.name : `Monitor ${side.toUpperCase()}`;
  setOutput(`${side}-metrics-name`, name);
  const outputs = {
    ppi: "—",
    pixels: "—",
    aspect: "—",
    interval: "—",
    "physical-size": "—",
    area: "—",
  };
  if (monitor) {
    outputs.ppi = `${formatNumber(monitor.ppi)} PPI`;
    outputs.pixels = `${integerFormat.format(monitor.totalPixels)} pixels`;
    outputs.aspect = monitor.aspectRatio;
    outputs.interval = `${formatNumber(monitor.refreshInterval)} ms`;
    outputs["physical-size"] = formatPhysicalSize(monitor);
    outputs.area = `${formatNumber(monitor.areaCm2)} cm²`;
  }
  for (const [key, value] of Object.entries(outputs)) {
    setOutput(`${side}-metric-${key}`, value);
  }
}

function differenceIfPresent(a, b, format) {
  if (a === null || b === null) return "Both values are needed for a difference.";
  return format(a, b);
}

function comparisonRows(a, b) {
  const hasBoth = Boolean(a && b);
  return [
    { key: "name", value: (m) => m.name, difference: "—" },
    { key: "size", value: (m) => `${formatNumber(m.size)} in`, difference: hasBoth ? formatSigned(b.size - a.size, "in") : "—" },
    { key: "resolution", value: formatResolution, difference: hasBoth ? "See total pixel-count difference." : "—" },
    { key: "pixels", value: (m) => integerFormat.format(m.totalPixels), difference: hasBoth ? formatSigned(b.totalPixels - a.totalPixels, "pixels", (n) => integerFormat.format(n)) : "—" },
    { key: "aspect", value: (m) => m.aspectRatio, difference: "—" },
    { key: "ppi", value: (m) => `${formatNumber(m.ppi)} PPI`, difference: hasBoth ? formatSigned(b.ppi - a.ppi, "PPI") : "—" },
    { key: "refresh", value: (m) => `${formatNumber(m.refreshRate)} Hz`, difference: hasBoth ? formatSigned(b.refreshRate - a.refreshRate, "Hz") : "—" },
    { key: "interval", value: (m) => `${formatNumber(m.refreshInterval)} ms`, difference: hasBoth ? formatSigned(b.refreshInterval - a.refreshInterval, "ms") : "—" },
    { key: "panel", value: (m) => panelLabels[m.panel], difference: "—" },
    { key: "response", value: (m) => formatOptionalNumber(m.responseTime, "ms") + (m.responseTime === null ? "" : " (advertised)"), difference: hasBoth ? differenceIfPresent(a.responseTime, b.responseTime, (x, y) => formatSigned(y - x, "ms")) : "—" },
    { key: "sync", value: (m) => syncLabels[m.sync], difference: "—" },
    { key: "hdr", value: (m) => m.hdr || "Not supplied", difference: "—" },
    { key: "brightness", value: (m) => formatOptionalNumber(m.brightness, "nits"), difference: hasBoth ? differenceIfPresent(a.brightness, b.brightness, (x, y) => formatSigned(y - x, "nits")) : "—" },
    { key: "gamut", value: (m) => m.gamut || "Not supplied", difference: "—" },
    { key: "physical-size", value: formatPhysicalSize, difference: hasBoth ? `${formatSigned(b.widthCm - a.widthCm, "cm")} wide; ${formatSigned(b.heightCm - a.heightCm, "cm")} high` : "—" },
    { key: "area", value: (m) => `${formatNumber(m.areaCm2)} cm²`, difference: hasBoth ? `${formatSigned(b.areaCm2 - a.areaCm2, "cm²")} (${formatSigned(((b.areaCm2 - a.areaCm2) / a.areaCm2) * 100, "%")} vs A)` : "—" },
    { key: "price", value: (m) => m.price === null ? "Not supplied" : currencyFormat.format(m.price), difference: hasBoth ? differenceIfPresent(a.price, b.price, (x, y) => formatCurrencyDifference(y - x)) : "—" },
  ];
}

function updateComparisonTable(a, b) {
  setOutput("a-table-name", a ? a.name : "Monitor A");
  setOutput("b-table-name", b ? b.name : "Monitor B");
  for (const row of comparisonRows(a, b)) {
    setOutput(`a-value-${row.key}`, a ? row.value(a) : "—");
    setOutput(`b-value-${row.key}`, b ? row.value(b) : "—");
    setOutput(`diff-${row.key}`, row.difference);
  }
}

function updatePanelExplanations() {
  const panelA = document.querySelector("#a-panel").value;
  const panelB = document.querySelector("#b-panel").value;
  setOutput("a-panel-explanation", panelExplanations[panelA] || "Select a panel technology to see a general explanation.");
  setOutput("b-panel-explanation", panelExplanations[panelB] || "Select a panel technology to see a general explanation.");
}

function useCaseText(a, b) {
  const missingResponse = [a, b].filter((monitor) => monitor.responseTime === null).map((monitor) => monitor.name);
  const responseNote = missingResponse.length
    ? ` Advertised response-time data is not supplied for ${missingResponse.join(" and ")}. Supplied manufacturer claims may use different test methods.`
    : " Both response-time figures are advertised claims and may use different test methods.";
  const gamutA = a.gamut ? `${a.name}: ${a.gamut}` : `${a.name}: colour gamut not supplied`;
  const gamutB = b.gamut ? `${b.name}: ${b.gamut}` : `${b.name}: colour gamut not supplied`;
  return {
    competitive: `${a.name} lists ${formatNumber(a.refreshRate)} Hz and ${b.name} lists ${formatNumber(b.refreshRate)} Hz. Higher refresh rates can improve motion smoothness when the system delivers enough frames; these specifications do not measure input lag, actual response time, motion clarity, or game frame rate.${responseNote} Adaptive-sync entries are listed claims, not tested compatibility.`,
    generalGaming: `${a.name} lists ${integerFormat.format(a.totalPixels)} pixels at ${formatNumber(a.refreshRate)} Hz; ${b.name} lists ${integerFormat.format(b.totalPixels)} pixels at ${formatNumber(b.refreshRate)} Hz. More pixels can increase rendering workload, but no gaming FPS or performance ranking can be inferred from these monitor specifications.`,
    productivity: `${a.name} has an estimated ${formatNumber(a.widthCm)} × ${formatNumber(a.heightCm)} cm screen area; ${b.name} has ${formatNumber(b.widthCm)} × ${formatNumber(b.heightCm)} cm. Resolution and PPI describe pixel density, not usable workspace by themselves; operating-system scaling, applications, viewing distance, and ergonomics also matter.`,
    creative: `${gamutA}; ${gamutB}. Gamut text is user-entered and not verified. These values do not establish colour accuracy, calibration, uniformity, contrast, or HDR performance; check independent measurements and workflow requirements when those matter.`,
    everyday: `${a.name} is ${formatNumber(a.size)} inches at ${formatNumber(a.ppi)} PPI; ${b.name} is ${formatNumber(b.size)} inches at ${formatNumber(b.ppi)} PPI. Viewing distance, desk fit, scaling, and personal preference affect suitability; the entered specifications do not identify a universal winner.`,
  };
}

function updateUseCases(a, b) {
  const ids = ["competitive", "general-gaming", "productivity", "creative", "everyday"];
  if (!a || !b) {
    ids.forEach((id) => setOutput(`use-case-${id}`, "Enter valid required specifications for both monitors to see these notes."));
    return;
  }
  const text = useCaseText(a, b);
  setOutput("use-case-competitive", text.competitive);
  setOutput("use-case-general-gaming", text.generalGaming);
  setOutput("use-case-productivity", text.productivity);
  setOutput("use-case-creative", text.creative);
  setOutput("use-case-everyday", text.everyday);
}

function updateComparisonStatus(a, b) {
  const status = document.querySelector("#comparison-status");
  if (!a || !b) {
    status.textContent = "Correct the highlighted specifications to compare both monitors.";
    return;
  }
  const areaPercent = ((b.areaCm2 - a.areaCm2) / a.areaCm2) * 100;
  const areaText = Math.abs(areaPercent) < 0.005
    ? "Their estimated screen areas are approximately equal."
    : `Monitor B's estimated screen area is ${formatNumber(Math.abs(areaPercent))}% ${areaPercent > 0 ? "larger" : "smaller"} than Monitor A's.`;
  const priceText = a.price === null || b.price === null
    ? " Enter both prices to calculate their price difference."
    : ` Price difference (B − A): ${formatCurrencyDifference(b.price - a.price)}.`;
  status.textContent = `${areaText}${priceText} No overall winner is inferred.`;
}

function compareMonitors() {
  const a = readMonitor("a");
  const b = readMonitor("b");
  updateCalculatedMetrics("a", a);
  updateCalculatedMetrics("b", b);
  updateComparisonTable(a, b);
  updateUseCases(a, b);
  updateComparisonStatus(a, b);
  updatePanelExplanations();
}

comparisonForm.addEventListener("input", compareMonitors);
comparisonForm.addEventListener("change", compareMonitors);
comparisonForm.addEventListener("submit", (event) => {
  event.preventDefault();
  compareMonitors();
});
resetComparisonButton.addEventListener("click", () => {
  comparisonForm.reset();
  compareMonitors();
});

compareMonitors();
