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

function createToolCard(tool, index) {
  const card = document.createElement("article");
  card.className = "surface-card tool-card";
  card.dataset.category = tool.category;
  card.dataset.toolId = tool.id;

  const cardTop = document.createElement("div");
  cardTop.className = "tool-card-top";

  const number = document.createElement("span");
  number.className = "tool-number";
  number.textContent = `NC / ${String(index + 1).padStart(2, "0")}`;

  const category = document.createElement("span");
  category.className = "tool-category";
  category.textContent = tool.category;

  const isFavorite = window.NeonCore.getPreferences().favorites.includes(tool.id);
  const favoriteButton = document.createElement("button");
  favoriteButton.className = "tool-favorite";
  favoriteButton.type = "button";
  favoriteButton.setAttribute("aria-label", `${isFavorite ? "Remove" : "Add"} ${tool.name} ${isFavorite ? "from" : "to"} favorites`);
  favoriteButton.setAttribute("aria-pressed", String(isFavorite));
  favoriteButton.title = isFavorite ? "Remove from favorites" : "Add to favorites";
  favoriteButton.textContent = isFavorite ? "★" : "☆";
  favoriteButton.addEventListener("click", () => window.NeonCore.toggleFavorite(tool.id));
  cardTop.append(number, category, favoriteButton);

  const title = document.createElement("h3");
  title.textContent = tool.name;

  const description = document.createElement("p");
  description.textContent = tool.description;

  const cardBottom = document.createElement("div");
  cardBottom.className = "tool-card-bottom";

  const status = document.createElement("span");
  status.className = "development-status";
  status.textContent = tool.href ? "Ready to use" : "In development";

  if (tool.href) {
    const openLink = document.createElement("a");
    openLink.className = "tool-arrow";
    openLink.href = tool.href;
    openLink.setAttribute("aria-label", `Open ${tool.name}`);
    openLink.textContent = "↗";
    cardBottom.append(status, openLink);
  } else {
    const arrow = document.createElement("span");
    arrow.className = "tool-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    cardBottom.append(status, arrow);
  }

  card.append(cardTop, title, description, cardBottom);
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

  toolGrid.replaceChildren(...matchingTools.map((tool) => createToolCard(tool, tools.indexOf(tool))));
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
renderRecentTools();
renderTools();