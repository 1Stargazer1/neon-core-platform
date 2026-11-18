const monitorInputDefinitions = [
  { id: "monitor-a-diagonal", min: 1, max: 200, integer: false, errorId: "monitor-a-diagonal-error", hintId: "monitor-a-diagonal-hint", label: "diagonal size", unit: "inches" },
  { id: "monitor-a-aspect-width", min: 1, max: 100, integer: true, errorId: "monitor-a-aspect-width-error", hintId: "monitor-a-aspect-width-hint", label: "aspect ratio width" },
  { id: "monitor-a-aspect-height", min: 1, max: 100, integer: true, errorId: "monitor-a-aspect-height-error", hintId: "monitor-a-aspect-height-hint", label: "aspect ratio height" },
  { id: "monitor-a-resolution-width", min: 1, max: 100000, integer: true, errorId: "monitor-a-resolution-width-error", hintId: "monitor-a-resolution-width-hint", label: "resolution width" },
  { id: "monitor-a-resolution-height", min: 1, max: 100000, integer: true, errorId: "monitor-a-resolution-height-error", hintId: "monitor-a-resolution-height-hint", label: "resolution height" },
  { id: "monitor-b-diagonal", min: 1, max: 200, integer: false, errorId: "monitor-b-diagonal-error", hintId: "monitor-b-diagonal-hint", label: "diagonal size", unit: "inches" },
  { id: "monitor-b-aspect-width", min: 1, max: 100, integer: true, errorId: "monitor-b-aspect-width-error", hintId: "monitor-b-aspect-width-hint", label: "aspect ratio width" },
  { id: "monitor-b-aspect-height", min: 1, max: 100, integer: true, errorId: "monitor-b-aspect-height-error", hintId: "monitor-b-aspect-height-hint", label: "aspect ratio height" },
  { id: "monitor-b-resolution-width", min: 1, max: 100000, integer: true, errorId: "monitor-b-resolution-width-error", hintId: "monitor-b-resolution-width-hint", label: "resolution width" },
  { id: "monitor-b-resolution-height", min: 1, max: 100000, integer: true, errorId: "monitor-b-resolution-height-error", hintId: "monitor-b-resolution-height-hint", label: "resolution height" },
];

const monitorForm = document.querySelector("#monitor-form");
const resetButton = document.querySelector("#reset-monitors");
const monitorNameInputs = {
  a: document.querySelector("#monitor-a-name"),
  b: document.querySelector("#monitor-b-name"),
};
const monitorVisualDescription = document.querySelector("#monitor-visual-description");
const monitorDisplays = {
  a: document.querySelector("#monitor-a-display"),
  b: document.querySelector("#monitor-b-display"),
};
const comparisonOutputs = {
  width: document.querySelector("#width-difference-output"),
  height: document.querySelector("#height-difference-output"),
  area: document.querySelector("#area-difference-output"),
  areaPercent: document.querySelector("#area-percent-output"),
  ppi: document.querySelector("#ppi-difference-output"),
  relativeArea: document.querySelector("#relative-area-output"),
};
const propertyOutputs = {
  a: {
    width: document.querySelector("#monitor-a-width-output"),
    height: document.querySelector("#monitor-a-height-output"),
    area: document.querySelector("#monitor-a-area-output"),
    ppi: document.querySelector("#monitor-a-ppi-output"),
  },
  b: {
    width: document.querySelector("#monitor-b-width-output"),
    height: document.querySelector("#monitor-b-height-output"),
    area: document.querySelector("#monitor-b-area-output"),
    ppi: document.querySelector("#monitor-b-ppi-output"),
  },
};

const numberFormat = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function setInputError(input, definition, message) {
  const error = document.querySelector(`#${definition.errorId}`);
  error.textContent = message;
  error.hidden = false;
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", `${definition.hintId} ${definition.errorId}`);
}

function clearInputError(input, definition) {
  const error = document.querySelector(`#${definition.errorId}`);
  error.textContent = "";
  error.hidden = true;
  input.removeAttribute("aria-invalid");
  input.setAttribute("aria-describedby", definition.hintId);
}

function readInput(definition) {
  const input = document.querySelector(`#${definition.id}`);
  const rawValue = input.value.trim();
  const value = Number(rawValue);

  if (rawValue === "" || !Number.isFinite(value)) {
    setInputError(input, definition, `Enter a numeric ${definition.label}.`);
    return null;
  }
  if (value < definition.min) {
    setInputError(input, definition, `${definition.label} must be at least ${definition.min}${definition.unit ? ` ${definition.unit}` : ""}.`);
    return null;
  }
  if (value > definition.max) {
    setInputError(input, definition, `${definition.label} must not exceed ${numberFormat.format(definition.max)}${definition.unit ? ` ${definition.unit}` : ""}.`);
    return null;
  }
  if (definition.integer && !Number.isInteger(value)) {
    setInputError(input, definition, `${definition.label} must be a whole number.`);
    return null;
  }

  clearInputError(input, definition);
  return value;
}

function calculateMonitor(prefix, values) {
  const diagonalCm = values.diagonal * 2.54;
  const aspectLength = Math.hypot(values.aspectWidth, values.aspectHeight);
  const widthCm = diagonalCm * (values.aspectWidth / aspectLength);
  const heightCm = diagonalCm * (values.aspectHeight / aspectLength);
  const areaCm2 = widthCm * heightCm;
  const ppi = Math.hypot(values.resolutionWidth, values.resolutionHeight) / values.diagonal;
  const metrics = { prefix, values, widthCm, heightCm, areaCm2, ppi };

  if (![widthCm, heightCm, areaCm2, ppi].every(Number.isFinite)) {
    return null;
  }

  return metrics;
}

function formatValue(value, unit) {
  return `${numberFormat.format(value)} ${unit}`;
}

function formatDifference(value, unit) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${numberFormat.format(value)} ${unit}`;
}

function setText(element, value) {
  element.textContent = value;
}

function updatePropertyOutputs(key, monitor) {
  const outputs = propertyOutputs[key];
  if (!monitor) {
    Object.values(outputs).forEach((output) => setText(output, "—"));
    return;
  }

  setText(outputs.width, formatValue(monitor.widthCm, "cm"));
  setText(outputs.height, formatValue(monitor.heightCm, "cm"));
  setText(outputs.area, formatValue(monitor.areaCm2, "cm²"));
  setText(outputs.ppi, formatValue(monitor.ppi, "PPI"));
}

function updateVisualLabels() {
  const labels = {
    a: monitorNameInputs.a.value.trim() || "Monitor A",
    b: monitorNameInputs.b.value.trim() || "Monitor B",
  };
  setText(document.querySelector("#monitor-a-visual-label"), labels.a);
  setText(document.querySelector("#monitor-b-visual-label"), labels.b);
  return labels;
}

function setDisplayRect(rect, width, height, centerX, centerY) {
  rect.setAttribute("x", String(centerX - width / 2));
  rect.setAttribute("y", String(centerY - height / 2));
  rect.setAttribute("width", String(width));
  rect.setAttribute("height", String(height));
}

function updateVisualisation(a, b, labels) {
  if (!a || !b) {
    Object.values(monitorDisplays).forEach((rect) => {
      rect.setAttribute("width", "0");
      rect.setAttribute("height", "0");
    });
    monitorVisualDescription.textContent = "The visual comparison will appear when both monitor configurations are valid.";
    return;
  }

  const scale = Math.min(
    260 / a.widthCm,
    260 / b.widthCm,
    240 / a.heightCm,
    240 / b.heightCm,
  );
  const mode = monitorForm.querySelector('input[name="comparison-mode"]:checked').value;
  const centerY = 150;

  if (mode === "overlay") {
    setDisplayRect(monitorDisplays.a, a.widthCm * scale, a.heightCm * scale, 300, centerY);
    setDisplayRect(monitorDisplays.b, b.widthCm * scale, b.heightCm * scale, 300, centerY);
    monitorVisualDescription.textContent = `${labels.a} and ${labels.b} are overlaid at the same physical scale.`;
  } else {
    setDisplayRect(monitorDisplays.a, a.widthCm * scale, a.heightCm * scale, 150, centerY);
    setDisplayRect(monitorDisplays.b, b.widthCm * scale, b.heightCm * scale, 450, centerY);
    monitorVisualDescription.textContent = `${labels.a} and ${labels.b} are shown side by side at the same physical scale.`;
  }
}

function updateComparison(a, b) {
  const summary = document.querySelector("#monitor-area-summary");
  if (!a || !b) {
    Object.values(comparisonOutputs).forEach((output) => setText(output, "—"));
    setText(summary, "Enter valid values for both displays to compare their physical areas.");
    return;
  }

  const widthDifference = b.widthCm - a.widthCm;
  const heightDifference = b.heightCm - a.heightCm;
  const areaDifference = b.areaCm2 - a.areaCm2;
  const areaPercent = (areaDifference / a.areaCm2) * 100;
  const ppiDifference = b.ppi - a.ppi;

  setText(comparisonOutputs.width, formatDifference(widthDifference, "cm"));
  setText(comparisonOutputs.height, formatDifference(heightDifference, "cm"));
  setText(comparisonOutputs.area, formatDifference(areaDifference, "cm²"));
  setText(comparisonOutputs.areaPercent, formatDifference(areaPercent, "%"));
  setText(comparisonOutputs.ppi, formatDifference(ppiDifference, "PPI"));
  setText(comparisonOutputs.relativeArea, `${numberFormat.format(b.areaCm2 / a.areaCm2)}×`);

  if (Math.abs(areaPercent) < 0.005) {
    setText(summary, "Both displays have approximately the same physical screen area.");
  } else {
    const direction = areaPercent > 0 ? "larger" : "smaller";
    setText(summary, `Monitor B has ${numberFormat.format(Math.abs(areaPercent))}% ${direction} physical screen area than Monitor A.`);
  }
}

function updateVisualiser() {
  const values = {};
  let inputsValid = true;

  for (const definition of monitorInputDefinitions) {
    const value = readInput(definition);
    if (value === null) {
      inputsValid = false;
    } else {
      values[definition.id] = value;
    }
  }

  const a = inputsValid ? calculateMonitor("a", {
    diagonal: values["monitor-a-diagonal"],
    aspectWidth: values["monitor-a-aspect-width"],
    aspectHeight: values["monitor-a-aspect-height"],
    resolutionWidth: values["monitor-a-resolution-width"],
    resolutionHeight: values["monitor-a-resolution-height"],
  }) : null;
  const b = inputsValid ? calculateMonitor("b", {
    diagonal: values["monitor-b-diagonal"],
    aspectWidth: values["monitor-b-aspect-width"],
    aspectHeight: values["monitor-b-aspect-height"],
    resolutionWidth: values["monitor-b-resolution-width"],
    resolutionHeight: values["monitor-b-resolution-height"],
  }) : null;
  const labels = updateVisualLabels();

  updatePropertyOutputs("a", a);
  updatePropertyOutputs("b", b);
  updateComparison(a, b);
  updateVisualisation(a, b, labels);
}

monitorForm.addEventListener("input", updateVisualiser);
monitorForm.addEventListener("change", updateVisualiser);
resetButton.addEventListener("click", () => {
  monitorForm.reset();
  updateVisualiser();
});

updateVisualiser();
