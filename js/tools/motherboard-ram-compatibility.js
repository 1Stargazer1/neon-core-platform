const numericDefinitions = [
  { id: "cpu-max-capacity", key: "cpuMaxCapacity", label: "CPU maximum memory capacity", unit: "GB", min: 1, max: 4096 },
  { id: "board-slot-count", key: "slotCount", label: "number of motherboard memory slots", min: 1, max: 16, integer: true, required: true },
  { id: "board-max-capacity", key: "boardMaxCapacity", label: "motherboard maximum capacity", unit: "GB", min: 1, max: 4096, required: true },
  { id: "board-slot-capacity", key: "slotCapacity", label: "maximum capacity per slot", unit: "GB", min: 0.1, max: 1024 },
  { id: "ram-module-count", key: "moduleCount", label: "number of RAM modules", min: 1, max: 16, integer: true, required: true },
  { id: "ram-module-capacity", key: "moduleCapacity", label: "capacity per RAM module", unit: "GB", min: 0.1, max: 512, required: true },
  { id: "ram-speed", key: "ramSpeed", label: "advertised RAM speed", unit: "MT/s", min: 100, max: 20000, integer: true, required: true },
];

const manufacturers = {
  intel: "Intel",
  amd: "AMD",
  apple: "Apple",
  other: "Other",
};
const memoryGenerations = {
  ddr4: "DDR4",
  ddr5: "DDR5",
  lpddr4: "LPDDR4",
  lpddr5: "LPDDR5",
  other: "Other",
  unknown: "Unknown",
};
const slotTypes = {
  dimm: "DIMM",
  "so-dimm": "SO-DIMM",
  other: "Other",
  unknown: "Unknown",
};
const eccSupportOptions = {
  yes: "Yes",
  no: "No",
  unknown: "Unknown",
};
const ramEccTypes = {
  "non-ecc": "Non-ECC",
  "ecc-udimm": "ECC UDIMM",
  "ecc-rdimm": "ECC RDIMM",
  other: "Other",
  unknown: "Unknown",
};
const bufferTypes = {
  registered: "Registered / buffered",
  unbuffered: "Unbuffered",
  "not-applicable": "Not applicable",
  unknown: "Unknown",
};
const knownGenerations = new Set(["ddr4", "ddr5", "lpddr4", "lpddr5"]);
const form = document.querySelector("#memory-compatibility-form");
const resetButton = document.querySelector("#reset-memory-compatibility");
const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
let hasChecked = false;

const initialMessages = {
  socket: "Enter both socket labels to compare them.",
  generation: "Compare CPU, motherboard, and RAM generations.",
  "form-factor": "Compare the motherboard slot and RAM module types.",
  "slot-count": "Compare the number of modules with motherboard slots.",
  "board-capacity": "Calculate total kit capacity and compare with the board limit.",
  "slot-capacity": "Compare module capacity with the stated per-slot limit.",
  "cpu-capacity": "Compare kit capacity with the CPU's stated limit when supplied.",
  "cpu-speed": "Compare the advertised kit speed with CPU speed information.",
  "board-speed": "Compare the advertised kit speed with motherboard speed information.",
  ecc: "Review ECC capability and module buffering separately.",
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
    showError(input, `Enter a finite ${definition.label}.`);
    return false;
  }
  if (value < definition.min || value > definition.max) {
    showError(input, `${definition.label} must be between ${definition.min} and ${numberFormat.format(definition.max)}${definition.unit ? ` ${definition.unit}` : ""}.`);
    return false;
  }
  if (definition.integer && !Number.isInteger(value)) {
    showError(input, `${definition.label} must be a whole number.`);
    return false;
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

function readText(id, label, values, key, required = false) {
  const input = document.querySelector(`#${id}`);
  const value = input.value.trim();
  if (required && !value) {
    showError(input, `Enter a ${label}, or enter Unknown if it is not available.`);
    return false;
  }
  clearError(input);
  values[key] = value;
  return true;
}

function readSpeedList(id, label, values, key) {
  const input = document.querySelector(`#${id}`);
  const rawValue = input.value.trim();
  if (!rawValue) {
    clearError(input);
    values[key] = null;
    return true;
  }

  const tokens = rawValue.split(",");
  const speeds = [];
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!/^\d{3,5}$/.test(trimmed)) {
      showError(input, `Enter ${label} as comma-separated whole-number MT/s values, such as 4800, 5600.`);
      return false;
    }
    const speed = Number(trimmed);
    if (!Number.isFinite(speed) || speed < 100 || speed > 20000) {
      showError(input, `${label} values must be between 100 and 20,000 MT/s.`);
      return false;
    }
    speeds.push(speed);
  }

  clearError(input);
  values[key] = [...new Set(speeds)];
  return true;
}

function readSpecifications() {
  const values = {};
  let valid = true;

  for (const definition of numericDefinitions) {
    if (!readNumericField(definition, values)) valid = false;
  }

  if (!readSelect("cpu-manufacturer", manufacturers, "CPU manufacturer", values, "manufacturer")) valid = false;
  if (!readText("cpu-socket", "CPU socket or platform label", values, "cpuSocket", true)) valid = false;
  if (!readSelect("cpu-memory-generation", memoryGenerations, "CPU memory generation", values, "cpuGeneration")) valid = false;
  if (!readSelect("cpu-ecc", eccSupportOptions, "CPU ECC support option", values, "cpuEcc")) valid = false;
  if (!readSpeedList("cpu-speeds", "CPU supported memory speeds", values, "cpuSpeeds")) valid = false;

  if (!readText("board-socket", "motherboard socket label", values, "boardSocket", true)) valid = false;
  if (!readSelect("board-memory-generation", memoryGenerations, "motherboard memory generation", values, "boardGeneration")) valid = false;
  if (!readSelect("board-slot-type", slotTypes, "motherboard slot type", values, "boardSlotType")) valid = false;
  if (!readSelect("board-ecc", eccSupportOptions, "motherboard ECC support option", values, "boardEcc")) valid = false;
  if (!readSpeedList("board-speeds", "motherboard supported memory speeds", values, "boardSpeeds")) valid = false;

  if (!readSelect("ram-generation", memoryGenerations, "RAM memory generation", values, "ramGeneration")) valid = false;
  if (!readSelect("ram-module-type", slotTypes, "RAM module type", values, "ramModuleType")) valid = false;
  if (!readSelect("ram-ecc-type", ramEccTypes, "RAM ECC type", values, "ramEccType")) valid = false;
  if (!readSelect("ram-buffer-type", bufferTypes, "RAM registered or unbuffered type", values, "bufferType")) valid = false;

  for (const [id, key] of [
    ["cpu-model", "cpuModel"],
    ["board-model", "boardModel"],
    ["board-chipset", "chipset"],
    ["board-bios", "bios"],
    ["ram-kit", "ramKit"],
    ["ram-profile", "ramProfile"],
  ]) {
    if (!readText(id, id, values, key)) valid = false;
  }

  if (values.ramEccType === "ecc-udimm" && values.bufferType && !["unknown", "unbuffered"].includes(values.bufferType)) {
    showError(document.querySelector("#ram-buffer-type"), "ECC UDIMM is unbuffered; correct the registered / unbuffered entry.");
    valid = false;
  }
  if (values.ramEccType === "ecc-rdimm" && values.bufferType && !["unknown", "registered"].includes(values.bufferType)) {
    showError(document.querySelector("#ram-buffer-type"), "ECC RDIMM is registered; correct the registered / unbuffered entry.");
    valid = false;
  }

  return valid ? values : null;
}

function outcome(state, message) {
  return { state, message };
}

function normalizeSocket(label) {
  const trimmed = label.trim().toLowerCase();
  if (["", "unknown", "not known", "not sure", "n/a", "na", "?"].includes(trimmed)) return null;
  const normalized = trimmed.replace(/^socket\s+/, "").replace(/[\s-]+/g, "");
  return normalized || null;
}

function platformDescription(specs) {
  const cpu = `${manufacturers[specs.manufacturer]} ${specs.cpuModel || "CPU model not supplied"}`;
  const motherboard = specs.boardModel || "motherboard model not supplied";
  const chipset = specs.chipset ? `; chipset ${specs.chipset}` : "";
  const bios = specs.bios
    ? ` Entered BIOS version: ${specs.bios}; confirm it meets the required minimum.`
    : " BIOS version was not supplied; confirm the minimum required version.";
  return `CPU: ${cpu}; motherboard: ${motherboard}${chipset}.${bios}`;
}

function checkSocket(specs) {
  const cpu = normalizeSocket(specs.cpuSocket);
  const board = normalizeSocket(specs.boardSocket);
  if (!cpu || !board) {
    return outcome("incomplete", `One or both socket labels are unknown. Verify the exact CPU against the motherboard CPU support list, BIOS requirements, and chipset restrictions. ${platformDescription(specs)}`);
  }
  if (cpu !== board) {
    return outcome("mismatch", `Entered labels differ (${specs.cpuSocket} vs ${specs.boardSocket}). Treat this as a socket/platform mismatch; confirm the labels against manufacturer specifications. ${platformDescription(specs)}`);
  }
  return outcome("clear", `Labels match after case and spacing normalization (${specs.cpuSocket} / ${specs.boardSocket}). A match is necessary but does not confirm CPU support, BIOS compatibility, or chipset support. ${platformDescription(specs)}`);
}

function checkGeneration(specs) {
  const items = [
    ["CPU", specs.cpuGeneration],
    ["Motherboard", specs.boardGeneration],
    ["RAM", specs.ramGeneration],
  ];
  const knownItems = items.filter(([, generation]) => knownGenerations.has(generation));
  for (let first = 0; first < knownItems.length; first += 1) {
    for (let second = first + 1; second < knownItems.length; second += 1) {
      if (knownItems[first][1] !== knownItems[second][1]) {
        return outcome("mismatch", `${knownItems[first][0]} lists ${memoryGenerations[knownItems[first][1]]} while ${knownItems[second][0]} lists ${memoryGenerations[knownItems[second][1]]}. Memory generations are not interchangeable.`);
      }
    }
  }
  if (knownItems.length !== items.length) {
    const missing = items.filter(([, generation]) => !knownGenerations.has(generation)).map(([label]) => label);
    return outcome("incomplete", `${missing.join(", ")} memory generation is Unknown or unusual. Do not assume it is interchangeable with the listed generation.`);
  }
  return outcome("clear", `CPU, motherboard, and RAM all list ${memoryGenerations[specs.ramGeneration]}. This generation match does not establish support for the exact CPU or kit.`);
}

function checkFormFactor(specs) {
  const boardKnown = ["dimm", "so-dimm"].includes(specs.boardSlotType);
  const ramKnown = ["dimm", "so-dimm"].includes(specs.ramModuleType);
  if (!boardKnown || !ramKnown) {
    return outcome("incomplete", "One or both form factors are Unknown or unusual. Verify the physical module and slot type in the motherboard documentation.");
  }
  if (specs.boardSlotType !== specs.ramModuleType) {
    return outcome("mismatch", `Motherboard slots are ${slotTypes[specs.boardSlotType]} but the RAM modules are ${slotTypes[specs.ramModuleType]}; these physical form factors do not match.`);
  }
  return outcome("clear", `Both entries are ${slotTypes[specs.boardSlotType]}. Verify the exact module dimensions and board layout.`);
}

function checkSlotCount(specs) {
  if (specs.moduleCount > specs.slotCount) {
    return outcome("mismatch", `${numberFormat.format(specs.moduleCount)} modules exceed the ${numberFormat.format(specs.slotCount)} motherboard slots.`);
  }
  return outcome("clear", `${numberFormat.format(specs.moduleCount)} module(s) fit within the stated ${numberFormat.format(specs.slotCount)} slots. Supported population and slot placement still need verification.`);
}

function totalCapacity(specs) {
  return specs.moduleCount * specs.moduleCapacity;
}

function checkBoardCapacity(specs, capacity) {
  if (capacity > specs.boardMaxCapacity) {
    return outcome("mismatch", `The ${numberFormat.format(capacity)} GB kit total exceeds the motherboard limit of ${numberFormat.format(specs.boardMaxCapacity)} GB.`);
  }
  return outcome("clear", `The ${numberFormat.format(capacity)} GB kit total is not above the entered motherboard limit of ${numberFormat.format(specs.boardMaxCapacity)} GB. Confirm supported module populations.`);
}

function checkSlotCapacity(specs) {
  if (specs.slotCapacity === null) {
    return outcome("incomplete", "No per-slot capacity limit was supplied. Check the motherboard manual for the supported capacity of each module.");
  }
  if (specs.moduleCapacity > specs.slotCapacity) {
    return outcome("mismatch", `Each ${numberFormat.format(specs.moduleCapacity)} GB module exceeds the entered per-slot limit of ${numberFormat.format(specs.slotCapacity)} GB.`);
  }
  return outcome("clear", `Each ${numberFormat.format(specs.moduleCapacity)} GB module is not above the entered ${numberFormat.format(specs.slotCapacity)} GB per-slot limit. Verify module density and population support.`);
}

function checkCpuCapacity(specs, capacity) {
  if (specs.cpuMaxCapacity === null) {
    return outcome("incomplete", "No CPU memory capacity limit was supplied. Verify the maximum for the exact processor model.");
  }
  if (capacity > specs.cpuMaxCapacity) {
    return outcome("mismatch", `The ${numberFormat.format(capacity)} GB kit total exceeds the entered CPU limit of ${numberFormat.format(specs.cpuMaxCapacity)} GB.`);
  }
  return outcome("clear", `The ${numberFormat.format(capacity)} GB kit total is not above the entered CPU limit of ${numberFormat.format(specs.cpuMaxCapacity)} GB. Confirm the exact CPU specification and memory configuration.`);
}

function checkSpeed(speeds, ramSpeed, component, profile) {
  const profileNote = profile
    ? ` Entered XMP / EXPO information: ${profile}.`
    : " No XMP / EXPO profile information was entered.";
  if (!speeds || speeds.length === 0) {
    return outcome("incomplete", `No ${component} supported speed information was supplied. Compare the exact CPU or board specifications with the kit's advertised ${numberFormat.format(ramSpeed)} MT/s.${profileNote}`);
  }
  const highest = Math.max(...speeds);
  if (ramSpeed > highest) {
    return outcome("incomplete", `The kit's advertised ${numberFormat.format(ramSpeed)} MT/s is above the highest entered ${component} value (${numberFormat.format(highest)} MT/s). This alone does not prove incompatibility; XMP / EXPO or manual settings may be needed, and stability is not guaranteed.${profileNote}`);
  }
  return outcome("clear", `The advertised ${numberFormat.format(ramSpeed)} MT/s is not above the highest entered ${component} value (${numberFormat.format(highest)} MT/s). Actual support depends on CPU, board, BIOS, and module population; stability is not guaranteed.${profileNote}`);
}

function checkEcc(specs) {
  const eccMemory = ["ecc-udimm", "ecc-rdimm"].includes(specs.ramEccType);
  if (eccMemory && (specs.cpuEcc === "no" || specs.boardEcc === "no")) {
    const unsupported = [];
    if (specs.cpuEcc === "no") unsupported.push("CPU");
    if (specs.boardEcc === "no") unsupported.push("motherboard");
    return outcome("mismatch", `${ramEccTypes[specs.ramEccType]} is entered, but ${unsupported.join(" and ")} ECC support is listed as No.`);
  }
  if (specs.ramEccType === "unknown" || specs.ramEccType === "other") {
    return outcome("incomplete", `RAM ECC type is ${ramEccTypes[specs.ramEccType]}. Identify whether the kit is Non-ECC, ECC UDIMM, or ECC RDIMM before assessing ECC support.`);
  }
  if (specs.ramEccType === "ecc-rdimm") {
    return outcome("incomplete", `The kit is listed as ECC RDIMM (${bufferTypes[specs.bufferType]}). ECC support alone does not prove registered-memory support; verify CPU, motherboard, and exact kit support.`);
  }
  if (specs.ramEccType === "ecc-udimm") {
    if (specs.bufferType === "unknown" || specs.cpuEcc === "unknown" || specs.boardEcc === "unknown") {
      return outcome("incomplete", "ECC UDIMM is unbuffered, but CPU or motherboard ECC support / module type is unknown. Verify ECC operation for the exact configuration.");
    }
    return outcome("clear", "No conflict is shown by the entered ECC UDIMM and Yes support values. Physical acceptance does not prove ECC operation; verify the exact CPU, board, BIOS, and kit.");
  }
  if (specs.bufferType === "unknown") {
    return outcome("incomplete", "The RAM is listed as Non-ECC, but its registered / unbuffered type is Unknown. Verify the module type and platform support.");
  }
  if (specs.bufferType === "registered") {
    return outcome("incomplete", "The module is listed as registered / buffered, but motherboard registered-memory support is not specified. Verify the exact board and CPU support.");
  }
  if (specs.bufferType === "not-applicable" || specs.bufferType === "unbuffered") {
    return outcome("clear", "The kit is listed as Non-ECC; this check does not identify an ECC requirement. Other memory and platform support still require verification.");
  }
  return outcome("incomplete", "The entered ECC and buffering information is not sufficient to assess this memory type.");
}

const checkIds = [
  "socket",
  "generation",
  "form-factor",
  "slot-count",
  "board-capacity",
  "slot-capacity",
  "cpu-capacity",
  "cpu-speed",
  "board-speed",
  "ecc",
];

function setCheck(id, result) {
  const card = document.querySelector(`#check-${id}`);
  card.dataset.state = result.state;
  card.querySelector(".memory-check-state").textContent = stateLabel(result.state);
  card.querySelector(".memory-check-message").textContent = result.message;
}

function stateLabel(state) {
  if (state === "mismatch") return "Known mismatch";
  if (state === "clear") return "No mismatch detected from supplied specifications";
  if (state === "incomplete") return "Insufficient information / manufacturer verification required";
  return "Not evaluated";
}

function renderRecommendations(results, specs) {
  const platformDetails = specs ? ` for ${manufacturers[specs.manufacturer]} ${specs.cpuModel || "the entered CPU"} on ${specs.boardModel || "the entered motherboard"}${specs.chipset ? ` (${specs.chipset})` : ""}` : "";
  const biosDetails = specs && specs.bios ? ` The entered BIOS is ${specs.bios}; verify that it meets the minimum required version.` : "";
  const kitDetails = specs && specs.ramKit ? ` The entered kit is ${specs.ramKit}.` : "";
  const recommendations = [
    `Check the motherboard CPU support list${platformDetails}, minimum BIOS version, and chipset restrictions.${biosDetails}`,
    `Confirm the exact RAM part number and supported module population with the motherboard manufacturer.${kitDetails}`,
    "Check the CPU and motherboard memory capacity limits, per-slot limits, and supported slot population.",
  ];
  if (results.socket.state !== "clear") {
    recommendations.push("Resolve the socket/platform label and verify the CPU against the motherboard support list before installation.");
  }
  if (results.generation.state !== "clear" || results["form-factor"].state !== "clear") {
    recommendations.push("Verify the exact memory generation and physical DIMM / SO-DIMM form factor; different generations and form factors are not interchangeable.");
  }
  if (results["cpu-speed"].state !== "clear" || results["board-speed"].state !== "clear") {
    recommendations.push("Check official memory-speed information and configuration limits. Advertised XMP / EXPO speeds may require a profile or manual configuration; stability is not guaranteed.");
  }
  if (results.ecc.state !== "clear") {
    recommendations.push("Verify ECC UDIMM versus ECC RDIMM support separately; a board's ECC or physical-acceptance specification alone does not establish ECC operation.");
  }

  const list = document.querySelector("#memory-recommendations");
  while (list.firstChild) list.removeChild(list.firstChild);
  for (const recommendation of recommendations) {
    const item = document.createElement("li");
    item.textContent = recommendation;
    list.appendChild(item);
  }
}

function renderDefaultRecommendations() {
  const incomplete = outcome("incomplete", "");
  renderRecommendations({
    socket: incomplete,
    generation: incomplete,
    "form-factor": incomplete,
    "cpu-speed": incomplete,
    "board-speed": incomplete,
    ecc: incomplete,
  }, null);
}

function renderNotEvaluated(message, invalidInput = false) {
  const overall = document.querySelector("#memory-overall-result");
  const state = invalidInput ? "incomplete" : "not-evaluated";
  overall.dataset.state = state;
  document.querySelector("#memory-overall-state").textContent = stateLabel(state);
  document.querySelector("#memory-overall-message").textContent = message;
  document.querySelector("#memory-total-capacity").textContent = "—";
  for (const id of checkIds) {
    setCheck(id, outcome("not-evaluated", initialMessages[id]));
  }
  document.querySelector("#memory-compatibility-status").textContent = message;
  renderDefaultRecommendations();
}

function compareSpecifications() {
  const specs = readSpecifications();
  if (!specs) {
    renderNotEvaluated("Correct the highlighted entries. Invalid or incomplete input is not reported as a passing check.", true);
    return;
  }

  const capacity = totalCapacity(specs);
  document.querySelector("#memory-total-capacity").textContent = `${numberFormat.format(capacity)} GB (${numberFormat.format(specs.moduleCount)} × ${numberFormat.format(specs.moduleCapacity)} GB)`;

  const results = {
    socket: checkSocket(specs),
    generation: checkGeneration(specs),
    "form-factor": checkFormFactor(specs),
    "slot-count": checkSlotCount(specs),
    "board-capacity": checkBoardCapacity(specs, capacity),
    "slot-capacity": checkSlotCapacity(specs),
    "cpu-capacity": checkCpuCapacity(specs, capacity),
    "cpu-speed": checkSpeed(specs.cpuSpeeds, specs.ramSpeed, "CPU", specs.ramProfile),
    "board-speed": checkSpeed(specs.boardSpeeds, specs.ramSpeed, "motherboard", specs.ramProfile),
    ecc: checkEcc(specs),
  };

  for (const id of checkIds) setCheck(id, results[id]);

  const states = Object.values(results).map((result) => result.state);
  const overallState = states.includes("mismatch")
    ? "mismatch"
    : states.includes("incomplete") ? "incomplete" : "clear";
  const overall = document.querySelector("#memory-overall-result");
  overall.dataset.state = overallState;
  document.querySelector("#memory-overall-state").textContent = stateLabel(overallState);

  if (overallState === "mismatch") {
    const issues = Object.entries(results)
      .filter(([, result]) => result.state === "mismatch")
      .map(([, result]) => result.message);
    document.querySelector("#memory-overall-message").textContent = `${issues.join(" ")} Resolve stated conflicts, then verify every part against manufacturer documentation.`;
  } else if (overallState === "incomplete") {
    document.querySelector("#memory-overall-message").textContent = "No known mismatch was detected in the checks that could be evaluated, but one or more checks need additional specifications or manufacturer verification. Do not treat this as confirmed compatibility.";
  } else {
    document.querySelector("#memory-overall-message").textContent = "No mismatch detected from supplied specifications. This is not a compatibility guarantee: check the motherboard CPU support list, required BIOS version, chipset restrictions, and exact RAM configuration with manufacturers.";
  }

  document.querySelector("#memory-compatibility-status").textContent = "Checks updated from entered specifications. No product lookup or compatibility guarantee is provided.";
  renderRecommendations(results, specs);
}

function clearAllErrors() {
  form.querySelectorAll("input, select").forEach(clearError);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  hasChecked = true;
  compareSpecifications();
});
form.addEventListener("input", () => {
  if (hasChecked) compareSpecifications();
});
form.addEventListener("change", () => {
  if (hasChecked) compareSpecifications();
});
resetButton.addEventListener("click", () => {
  form.reset();
  hasChecked = false;
  clearAllErrors();
  renderNotEvaluated("Enter the specifications and run the checks. Unknown values will remain unverified.");
});
