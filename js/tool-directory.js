const tools = [
  {
    name: "Mouse Sensitivity Converter",
    id: "mouse-sensitivity",
    category: "gaming",
    description: "Convert supported FPS sensitivity scales, calculate eDPI, or estimate cm/360.",
    keywords: "mouse dpi cm/360 sensitivity aim gaming input fps settings",
    href: "tools/mouse-sensitivity-converter.html",
  },
  {
    name: "Aspect Ratio Calculator",
    id: "aspect-ratio-calculator",
    category: "displays-performance",
    description: "Find a missing width or height from an aspect ratio, or simplify the ratio.",
    keywords: "resolution widescreen 16:9 16:10 21:9 display gaming stream video clips steam deck",
    href: "tools/aspect-ratio-calculator.html",
  },
  {
    name: "Refresh Rate Calculator",
    id: "refresh-rate-calculator",
    category: "displays-performance",
    description: "Translate a refresh rate or FPS value into milliseconds per frame.",
    keywords: "fps hz frame time milliseconds gaming monitor stutter",
    href: "tools/refresh-rate-calculator.html",
  },
  {
    name: "Storage Converter",
    id: "storage-converter",
    category: "everyday",
    description: "Convert storage values between decimal and binary units, from bytes to terabytes.",
    keywords: "bytes kb mb gb tb disk storage space game install size",
    href: "tools/storage-converter.html",
  },
  {
    name: "Download Time Calculator",
    id: "download-time-calculator",
    category: "everyday",
    description: "Estimate download duration from a file size and connection speed you provide.",
    keywords: "slow game downloads updates Mbps MB/s file size internet estimate windows linux macos",
    href: "tools/download-time-calculator.html",
  },
  {
    name: "Data Transfer Calculator",
    id: "data-transfer",
    category: "everyday",
    description: "Calculate data volume, transfer time, or required speed from entered values.",
    keywords: "bandwidth upload download data rate game files network speed",
    href: "tools/data-transfer-calculator.html",
  },
  {
    name: "Text Analyzer",
    id: "text-analyzer",
    category: "development",
    description: "Count characters, words, and paragraphs while you edit text.",
    keywords: "text writing words letters lines",
    href: "tools/text-analyzer.html",
  },
  {
    name: "QR Code Generator",
    id: "qr-code-generator",
    category: "development",
    description: "Create and download QR codes from links, text, contact details, Wi-Fi, or messages.",
    keywords: "link url quick response scan wifi email phone sms",
    href: "tools/qr-code-generator.html",
  },
  {
    name: "PPI & Screen Size Calculator",
    id: "ppi-calculator",
    category: "displays-performance",
    description: "Calculate display pixels per inch, pixel pitch, and dimensions from screen inputs.",
    keywords: "ppi pixels per inch pixel pitch display density resolution monitor laptop handheld steam deck screen",
    href: "tools/ppi-calculator.html",
  },
  {
    name: "eDPI Calculator",
    id: "edpi-calculator",
    category: "gaming",
    description: "Calculate effective DPI from your mouse DPI and in-game sensitivity.",
    keywords: "edpi effective dpi mouse sensitivity gaming aim input settings",
    href: "tools/edpi-calculator.html",
  },
  {
    name: "Hash Generator",
    id: "hash-generator",
    category: "development",
    description: "Generate SHA-256, SHA-384, or SHA-512 hashes from text or files.",
    keywords: "hash sha256 sha384 sha512 checksum cryptographic text file developer",
    href: "tools/hash-generator.html",
  },
  {
    name: "JSON Formatter & Validator",
    id: "json-formatter",
    category: "development",
    description: "Validate and format JSON, or minify it for compact output.",
    keywords: "json format pretty print validate minify parse stringify config developer error",
    href: "tools/json-formatter.html",
  },
  {
    name: "Colour Converter & Contrast Checker",
    id: "colour-converter",
    category: "development",
    description: "Convert HEX, RGB, and HSL values and check colour contrast against WCAG.",
    keywords: "colour color hex rgb hsl contrast wcag accessibility a11y design",
    href: "tools/colour-converter.html",
  },
  {
    name: "Date & Time Calculator",
    id: "date-time-calculator",
    category: "development",
    description: "Find the difference between dates, shift dates, or count weekdays.",
    keywords: "date time calculator difference add subtract days working weekdays duration",
    href: "tools/date-time-calculator.html",
  },
  {
    name: "Base64 Encoder & Decoder",
    id: "base64-encoder",
    category: "development",
    description: "Encode text as Base64 or decode Base64 to UTF-8 locally.",
    keywords: "base64 encode decode utf-8 text conversion developer",
    href: "tools/base64-encoder.html",
  },
  {
    name: "Electricity Cost Calculator",
    id: "electricity-cost-calculator",
    category: "development",
    description: "Estimate electricity cost from device wattage, usage time, and your energy rate.",
    keywords: "electricity cost watts kwh power consumption pc gaming idle energy",
    href: "tools/electricity-cost-calculator.html",
  },
  {
    name: "Dead Pixel & Screen Test",
    id: "dead-pixel-screen-test",
    category: "displays-performance",
    description: "Use full-screen colours and patterns to help inspect pixels and screen artifacts.",
    keywords: "monitor display dead pixel stuck pixel bad pixels screen test colour color issue",
    href: "tools/dead-pixel-screen-test.html",
  },
  {
    name: "Password Generator & Strength Meter",
    id: "password-generator",
    category: "development",
    description: "Generate passwords locally and check their estimated strength without saving the value.",
    keywords: "password generator strength security passphrase random account",
    href: "tools/password-generator.html",
  },
  {
    name: "File Checksum Verifier",
    id: "file-checksum-verifier",
    category: "everyday",
    description: "Calculate a file's SHA-256 or SHA-512 checksum and compare it with a value you provide.",
    keywords: "file hash checksum verify sha256 sha512 integrity download game installer",
    href: "tools/file-checksum-verifier.html",
  },
  {
    name: "Monitor Size Visualiser",
    id: "monitor-size-visualiser",
    category: "displays-performance",
    description: "Compare the physical dimensions and pixel density of two displays.",
    keywords: "monitor screen size visualiser visualizer dimensions aspect ratio display desk setup",
    href: "tools/monitor-size-visualiser.html",
  },
  {
    name: "Monitor Comparison",
    id: "monitor-comparison",
    category: "displays-performance",
    description: "Compare monitor specifications and calculated display metrics using details you provide.",
    keywords: "monitor display comparison specs resolution refresh rate size gaming high refresh",
    href: "tools/monitor-comparison.html",
  },
  {
    name: "CPU Comparison",
    id: "cpu-comparison",
    category: "technology",
    description: "Compare CPU specifications you enter; this is not a live benchmark database.",
    keywords: "cpu processor comparison cores threads clock speed cache hardware gaming windows linux",
    href: "tools/cpu-comparison.html",
  },
  {
    name: "GPU Comparison",
    id: "gpu-comparison",
    category: "technology",
    description: "Compare entered GPU specifications and theoretical memory bandwidth, not live benchmark scores.",
    keywords: "gpu graphics card comparison vram memory bandwidth hardware gaming windows linux macos",
    href: "tools/gpu-comparison.html",
  },
  {
    name: "Motherboard & RAM Compatibility",
    id: "motherboard-ram-compatibility",
    category: "technology",
    description: "Check entered CPU, motherboard, and RAM details for possible conflicts; verify fit with manufacturers.",
    keywords: "motherboard ram memory cpu socket ddr compatibility ecc pc build upgrade",
    href: "tools/motherboard-ram-compatibility.html",
  },
  {
    name: "PSU Wattage Estimator",
    id: "psu-wattage-estimator",
    category: "technology",
    description: "Estimate planning wattage from component inputs and a configurable margin.",
    keywords: "psu power supply wattage estimate cpu gpu components gaming pc build upgrade",
    href: "tools/psu-wattage-estimator.html",
  },
  {
    name: "PC Bottleneck Explainer",
    id: "pc-bottleneck-explainer",
    category: "displays-performance",
    description: "Explore possible workload limits using your system details and observed measurements; no exact FPS predictions.",
    keywords: "pc bottleneck cpu gpu ram vram performance utilisation utilization fps stutter frame time troubleshooting windows linux",
    href: "tools/pc-bottleneck-explainer.html",
  },
];

const categoryLabels = {
  gaming: "Gaming & Input",
  technology: "PC Hardware & Compatibility",
  "displays-performance": "Displays & Performance",
  everyday: "Downloads & Storage",
  development: "General & Development",
};

const categoryOrder = new Map([
  "gaming",
  "technology",
  "displays-performance",
  "everyday",
  "development",
].map((category, index) => [category, index]));

const toolOrder = new Map([
  "mouse-sensitivity",
  "edpi-calculator",
  "cpu-comparison",
  "gpu-comparison",
  "motherboard-ram-compatibility",
  "psu-wattage-estimator",
  "pc-bottleneck-explainer",
  "refresh-rate-calculator",
  "monitor-comparison",
  "monitor-size-visualiser",
  "ppi-calculator",
  "aspect-ratio-calculator",
  "dead-pixel-screen-test",
  "download-time-calculator",
  "data-transfer",
  "storage-converter",
  "file-checksum-verifier",
  "electricity-cost-calculator",
  "password-generator",
  "text-analyzer",
  "qr-code-generator",
  "date-time-calculator",
  "hash-generator",
  "json-formatter",
  "base64-encoder",
  "colour-converter",
].map((toolId, index) => [toolId, index]));

tools.sort((first, second) =>
  categoryOrder.get(first.category) - categoryOrder.get(second.category)
  || toolOrder.get(first.id) - toolOrder.get(second.id));

const toolGrid = document.querySelector("#tool-grid");
const searchInput = document.querySelector("#tool-search");
const filterButtons = document.querySelectorAll("[data-filter]");
const resultsStatus = document.querySelector("#results-status");
const emptyState = document.querySelector("#empty-state");
const currentYear = document.querySelector("#current-year");
const favoriteCount = document.querySelector("#favorite-count");
const recentToolsSection = document.querySelector("#recent-tools");
const recentToolList = document.querySelector("#recent-tool-list");
const clearRecentButton = document.querySelector("#clear-recent-tools");
const emptyTitle = document.querySelector("#empty-title");
const emptyDescription = document.querySelector("#empty-description");
const resetDirectoryButton = document.querySelector("#reset-directory");

let activeCategory = window.NeonCore.getPreferences().category;

function updateFilterCounts() {
  filterButtons.forEach((button) => {
    const count = button.querySelector("span");
    if (!count || button.dataset.filter === "favorites") {
      return;
    }

    const matchingTools = button.dataset.filter === "all"
      ? tools
      : tools.filter((tool) => tool.category === button.dataset.filter);
    count.textContent = String(matchingTools.length).padStart(2, "0");
  });
}

function createToolCard(tool, index, favoriteIds) {
  const card = document.createElement("article");
  card.className = "surface-card tool-card";
  card.dataset.category = tool.category;
  card.dataset.toolId = tool.id;

  const favoriteButton = document.createElement("button");
  favoriteButton.className = "tool-favorite";
  favoriteButton.type = "button";
  const isFavorite = favoriteIds.has(tool.id);
  favoriteButton.setAttribute("aria-label", `${isFavorite ? "Remove" : "Add"} ${tool.name} ${isFavorite ? "from" : "to"} favorites`);
  favoriteButton.setAttribute("aria-pressed", String(isFavorite));
  favoriteButton.title = isFavorite ? "Remove from favorites" : "Add to favorites";
  favoriteButton.textContent = isFavorite ? "★" : "☆";
  favoriteButton.addEventListener("click", () => window.NeonCore.toggleFavorite(tool.id));

  const cardTop = document.createElement("div");
  cardTop.className = "tool-card-top";

  const number = document.createElement("span");
  number.className = "tool-number";
  number.textContent = `NC / ${String(index + 1).padStart(2, "0")}`;

  const category = document.createElement("span");
  category.className = "tool-category";
  category.textContent = categoryLabels[tool.category];

  cardTop.append(number, category);

  const title = document.createElement("h3");
  title.textContent = tool.name;

  const description = document.createElement("p");
  description.textContent = tool.description;

  const cardBottom = document.createElement("div");
  cardBottom.className = "tool-card-bottom";

  const status = document.createElement("span");
  status.className = "development-status";
  status.textContent = tool.href ? "Ready to use" : "In development";

  const arrow = document.createElement("span");
  arrow.className = "tool-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  cardBottom.append(status, arrow);

  const cardContent = document.createElement(tool.href ? "a" : "div");
  cardContent.className = tool.href ? "tool-card-link" : "tool-card-content";
  if (tool.href) {
    cardContent.href = tool.href;
    cardContent.setAttribute("aria-label", `Open ${tool.name}`);
  }

  cardContent.append(cardTop, title, description, cardBottom);
  card.append(cardContent, favoriteButton);
  return card;
}

function renderRecentTools() {
  const recentToolEntries = window.NeonCore.getPreferences().recent
    .map((toolId) => tools.find((tool) => tool.id === toolId && tool.href))
    .filter(Boolean);

  recentToolsSection.hidden = recentToolEntries.length === 0;
  const recentLinks = recentToolEntries.map((tool) => {
    const link = document.createElement("a");
    link.className = "recent-tool-link";
    link.href = tool.href;

    const name = document.createElement("span");
    name.className = "recent-tool-name";
    name.textContent = tool.name;

    const category = document.createElement("span");
    category.className = "recent-tool-category";
    category.textContent = categoryLabels[tool.category];

    link.append(name, category);
    return link;
  });
  recentToolList.replaceChildren(...recentLinks);
}

function renderTools() {
  const activeFavoriteCard = document.activeElement?.classList.contains("tool-favorite")
    ? document.activeElement.closest(".tool-card")
    : null;
  const activeFavoriteToolId = activeFavoriteCard?.dataset.toolId;
  const searchTerm = searchInput.value.trim().toLowerCase();
  const favoriteIds = new Set(window.NeonCore.getPreferences().favorites);
  const matchingTools = tools.filter((tool) => {
    const matchesCategory = activeCategory === "all"
      || (activeCategory === "favorites" ? favoriteIds.has(tool.id) : tool.category === activeCategory);
    const searchableText = `${tool.name} ${tool.description} ${tool.keywords}`.toLowerCase();
    return matchesCategory && searchableText.includes(searchTerm);
  });

  toolGrid.replaceChildren(...matchingTools.map((tool) => createToolCard(tool, tools.indexOf(tool), favoriteIds)));
  if (activeFavoriteToolId) {
    const replacementCard = Array.from(toolGrid.children)
      .find((card) => card.dataset.toolId === activeFavoriteToolId);
    const replacementButton = replacementCard?.querySelector(".tool-favorite");
    if (replacementButton) {
      replacementButton.focus();
    } else {
      Array.from(filterButtons).find((button) => button.dataset.filter === activeCategory)?.focus();
    }
  }
  toolGrid.hidden = matchingTools.length === 0;
  emptyState.hidden = matchingTools.length !== 0;
  favoriteCount.textContent = String(favoriteIds.size).padStart(2, "0");

  if (matchingTools.length === 0) {
    const noFavorites = activeCategory === "favorites" && favoriteIds.size === 0 && searchTerm === "";
    emptyTitle.textContent = noFavorites ? "NO FAVORITES YET" : "NO MATCHES FOUND";
    emptyDescription.textContent = noFavorites
      ? "Star any tool to keep it close. Your favorites stay saved on this device."
      : "Try changing your search or category, or reset the directory filters.";
    resetDirectoryButton.hidden = activeCategory === "all" && searchTerm === "";
  }

  const categoryLabel = activeCategory === "all" ? "" : ` in ${categoryLabels[activeCategory] ?? "Favorites"}`;
  const searchLabel = searchTerm ? ` for “${searchInput.value.trim()}”` : "";
  resultsStatus.textContent = `Showing ${matchingTools.length} ${matchingTools.length === 1 ? "tool" : "tools"}${categoryLabel}${searchLabel}`;
}

function updateActiveFilter() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeCategory;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.filter;
    updateActiveFilter();
    window.NeonCore.savePreferences({ category: activeCategory });
  });
});

searchInput.addEventListener("input", renderTools);
clearRecentButton.addEventListener("click", () => window.NeonCore.savePreferences({ recent: [] }));
resetDirectoryButton.addEventListener("click", () => {
  searchInput.value = "";
  activeCategory = "all";
  updateActiveFilter();
  window.NeonCore.savePreferences({ category: activeCategory });
});

document.addEventListener("neoncore:preferenceschange", (event) => {
  activeCategory = event.detail.category;
  updateActiveFilter();
  renderRecentTools();
  renderTools();
});

currentYear.textContent = new Date().getFullYear();
updateActiveFilter();
updateFilterCounts();
renderRecentTools();
renderTools();
