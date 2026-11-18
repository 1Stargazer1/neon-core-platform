const tools = [
  {
    name: "Mouse Sensitivity Converter",
    id: "mouse-sensitivity",
    category: "gaming",
    description: "Calculate eDPI, convert verified game scales, or find cm/360.",
    keywords: "mouse dpi cm 360 aim gaming",
    href: "tools/mouse-sensitivity-converter.html",
  },
  {
    name: "Aspect Ratio Calculator",
    id: "aspect-ratio-calculator",
    category: "gaming",
    description: "Find matching dimensions for screens, streams, and clips.",
    keywords: "resolution display video dimensions gaming",
    href: "tools/aspect-ratio-calculator.html",
  },
  {
    name: "Refresh Rate Calculator",
    id: "refresh-rate-calculator",
    category: "gaming",
    description: "Convert refresh rate or FPS into frame duration in milliseconds.",
    keywords: "fps hz ms monitor gaming",
    href: "tools/refresh-rate-calculator.html",
  },
  {
    name: "Storage Converter",
    id: "storage-converter",
    category: "technology",
    description: "Convert bytes, kilobytes, gigabytes, and more with ease.",
    keywords: "byte kb mb gb tb disk file",
    href: "tools/storage-converter.html",
  },
  {
    name: "Download Time Calculator",
    id: "download-time-calculator",
    category: "technology",
    description: "Estimate a download time from file size and connection speed.",
    keywords: "internet speed file transfer estimate",
    href: "tools/download-time-calculator.html",
  },
  {
    name: "Data Transfer Calculator",
    id: "data-transfer",
    category: "technology",
    description: "Calculate transferred data, transfer duration, or required speed.",
    keywords: "network bandwidth data speed upload",
    href: "tools/data-transfer-calculator.html",
  },
  {
    name: "Text Analyzer",
    id: "text-analyzer",
    category: "everyday",
    description: "Count characters, words, and paragraphs as you type.",
    keywords: "text writing words letters lines",
    href: "tools/text-analyzer.html",
  },
  {
    name: "QR Code Generator",
    id: "qr-code-generator",
    category: "everyday",
    description: "Turn a link or a short message into a scannable code.",
    keywords: "link url quick response scan",
    href: "tools/qr-code-generator.html",
  },
  {
    name: "PPI & Screen Size Calculator",
    id: "ppi-calculator",
    category: "gaming",
    description: "Calculate pixels per inch, pixel pitch, and screen dimensions.",
    keywords: "ppi pixels per inch pixel pitch screen display resolution",
    href: "tools/ppi-calculator.html",
  },
  {
    name: "eDPI Calculator",
    id: "edpi-calculator",
    category: "gaming",
    description: "Calculate effective DPI and compare gaming mouse sensitivity settings.",
    keywords: "edpi effective dpi mouse sensitivity gaming aim",
    href: "tools/edpi-calculator.html",
  },
  {
    name: "Hash Generator",
    id: "hash-generator",
    category: "development",
    description: "Generate SHA-256, SHA-384, and SHA-512 hashes for text and files. Verify checksums.",
    keywords: "hash sha256 sha384 sha512 checksum crypto cryptographic text file",
    href: "tools/hash-generator.html",
  },
  {
    name: "JSON Formatter & Validator",
    id: "json-formatter",
    category: "development",
    description: "Validate, format, minify, and analyze JSON. Download formatted results.",
    keywords: "json format validate minify parse stringify",
    href: "tools/json-formatter.html",
  },
  {
    name: "Colour Converter & Contrast Checker",
    id: "colour-converter",
    category: "technology",
    description: "Convert between HEX, RGB, and HSL colours. Check WCAG contrast accessibility.",
    keywords: "colour color hex rgb hsl contrast wcag accessibility a11y",
    href: "tools/colour-converter.html",
  },
  {
    name: "Date & Time Calculator",
    id: "date-time-calculator",
    category: "everyday",
    description: "Calculate date differences, add/subtract days, and count working days.",
    keywords: "date time calculator difference working days duration",
    href: "tools/date-time-calculator.html",
  },
  {
    name: "Base64 Encoder & Decoder",
    id: "base64-encoder",
    category: "development",
    description: "Encode and decode Base64 with UTF-8 support. Secure local processing.",
    keywords: "base64 encode decode utf-8 text conversion",
    href: "tools/base64-encoder.html",
  },
  {
    name: "Electricity Cost Calculator",
    id: "electricity-cost-calculator",
    category: "everyday",
    description: "Calculate electricity costs and compare device energy consumption.",
    keywords: "electricity cost watts kwh power consumption calculator",
    href: "tools/electricity-cost-calculator.html",
  },
  {
    name: "Dead Pixel & Screen Test",
    id: "dead-pixel-screen-test",
    category: "technology",
    description: "Show colour fields and patterns to help inspect a display for pixel issues.",
    keywords: "monitor display dead pixel stuck pixel screen test colour color",
    href: "tools/dead-pixel-screen-test.html",
  },
  {
    name: "Password Generator & Strength Meter",
    id: "password-generator",
    category: "everyday",
    description: "Generate passwords and review their estimated strength locally.",
    keywords: "password generator strength security passphrase random",
    href: "tools/password-generator.html",
  },
  {
    name: "File Checksum Verifier",
    id: "file-checksum-verifier",
    category: "development",
    description: "Calculate file hashes and compare them with a supplied checksum.",
    keywords: "file hash checksum verify sha256 integrity download",
    href: "tools/file-checksum-verifier.html",
  },
  {
    name: "Monitor Size Visualiser",
    id: "monitor-size-visualiser",
    category: "technology",
    description: "Visualise monitor dimensions using a screen size and aspect ratio.",
    keywords: "monitor screen size visualiser visualizer dimensions aspect ratio display",
    href: "tools/monitor-size-visualiser.html",
  },
  {
    name: "Monitor Comparison",
    id: "monitor-comparison",
    category: "technology",
    description: "Compare monitor specifications side by side using details you provide.",
    keywords: "monitor display comparison specs resolution refresh rate size",
    href: "tools/monitor-comparison.html",
  },
  {
    name: "CPU Comparison",
    id: "cpu-comparison",
    category: "gaming",
    description: "Compare CPU specifications side by side using supplied information.",
    keywords: "cpu processor comparison cores threads clock speed hardware",
    href: "tools/cpu-comparison.html",
  },
  {
    name: "GPU Comparison",
    id: "gpu-comparison",
    category: "gaming",
    description: "Compare GPU specifications side by side using supplied information.",
    keywords: "gpu graphics card comparison vram memory hardware",
    href: "tools/gpu-comparison.html",
  },
  {
    name: "Motherboard & RAM Compatibility",
    id: "motherboard-ram-compatibility",
    category: "technology",
    description: "Check supplied CPU, motherboard, and RAM details for possible conflicts.",
    keywords: "motherboard ram memory cpu socket ddr compatibility ecc",
    href: "tools/motherboard-ram-compatibility.html",
  },
  {
    name: "PSU Wattage Estimator",
    id: "psu-wattage-estimator",
    category: "technology",
    description: "Estimate system power from component inputs and set a planning target.",
    keywords: "psu power supply wattage estimate cpu gpu components safety margin",
    href: "tools/psu-wattage-estimator.html",
  },
  {
    name: "PC Bottleneck Explainer",
    id: "pc-bottleneck-explainer",
    category: "gaming",
    description: "Explore possible workload limits using system details and your own measurements.",
    keywords: "pc bottleneck cpu gpu ram vram performance utilisation utilization fps",
    href: "tools/pc-bottleneck-explainer.html",
  },
];

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
  category.textContent = tool.category;

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
    category.textContent = tool.category;

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

  const categoryLabel = activeCategory === "all" ? "" : ` in ${activeCategory}`;
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
