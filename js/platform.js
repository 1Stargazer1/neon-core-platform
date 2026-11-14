const preferenceStorageKey = "neon-core.preferences.v1";
const validCategories = ["all", "gaming", "technology", "everyday", "favorites"];

function normalizePreferences(value = {}) {
  return {
    theme: value.theme === "light" ? "light" : "dark",
    favorites: Array.isArray(value.favorites) ? [...new Set(value.favorites.filter((id) => typeof id === "string"))] : [],
    recent: Array.isArray(value.recent) ? [...new Set(value.recent.filter((id) => typeof id === "string"))].slice(0, 5) : [],
    category: validCategories.includes(value.category) ? value.category : "all",
  };
}

function readStoredPreferences() {
  try {
    const storedValue = localStorage.getItem(preferenceStorageKey);
    return storedValue ? normalizePreferences(JSON.parse(storedValue)) : null;
  } catch {
    return null;
  }
}

function loadPreferences() {
  return readStoredPreferences() ?? normalizePreferences();
}

let preferences = loadPreferences();

function applyTheme() {
  document.documentElement.dataset.theme = preferences.theme;
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const nextTheme = preferences.theme === "dark" ? "light" : "dark";
    const themeLabel = nextTheme === "light" ? "Light theme" : "Dark theme";
    button.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
    button.setAttribute("title", `Switch to ${nextTheme} theme`);
    button.setAttribute("aria-pressed", String(preferences.theme === "light"));
    const label = button.querySelector("[data-theme-label]");
    if (label) label.textContent = themeLabel;
  });

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = preferences.theme === "dark" ? "#080b12" : "#edf5f7";
}

function savePreferences(changes) {
  preferences = normalizePreferences({ ...(readStoredPreferences() ?? preferences), ...changes });
  try {
    localStorage.setItem(preferenceStorageKey, JSON.stringify(preferences));
  } catch {
    // Keep this tab usable when browser storage is disabled or full.
  }
  applyTheme();
  document.dispatchEvent(new CustomEvent("neoncore:preferenceschange", { detail: preferences }));
  return { ...preferences, favorites: [...preferences.favorites], recent: [...preferences.recent] };
}

function toggleFavorite(toolId) {
  const favorites = new Set(preferences.favorites);
  if (favorites.has(toolId)) {
    favorites.delete(toolId);
  } else {
    favorites.add(toolId);
  }
  return savePreferences({ favorites: [...favorites] });
}

function recordToolUse(toolId) {
  if (!toolId) return;
  const recent = [toolId, ...preferences.recent.filter((recentId) => recentId !== toolId)].slice(0, 5);
  savePreferences({ recent });
}

window.NeonCore = {
  getPreferences: () => ({ ...preferences, favorites: [...preferences.favorites], recent: [...preferences.recent] }),
  savePreferences,
  toggleFavorite,
};

window.addEventListener("storage", (event) => {
  if (event.key !== preferenceStorageKey && event.key !== null) return;

  try {
    preferences = event.newValue ? normalizePreferences(JSON.parse(event.newValue)) : normalizePreferences();
  } catch {
    preferences = normalizePreferences();
  }

  applyTheme();
  document.dispatchEvent(new CustomEvent("neoncore:preferenceschange", { detail: preferences }));
});

applyTheme();
recordToolUse(document.body.dataset.toolId);

const headerInner = document.querySelector(".header-inner");
const navigation = headerInner?.querySelector(".main-nav");
if (navigation && !navigation.id) navigation.id = "main-nav";

if (navigation && !navigation.querySelector('a[href$="pricing.html"]')) {
  const pricingLink = document.createElement("a");
  pricingLink.className = "nav-link";
  pricingLink.href = document.body.dataset.toolId ? "../pricing.html" : "pricing.html";
  pricingLink.textContent = "Pricing";
  const aboutLink = navigation.querySelector('a[href*="#about"]');
  if (aboutLink) {
    navigation.insertBefore(pricingLink, aboutLink);
  } else {
    navigation.append(pricingLink);
  }
}

if (headerInner && !headerInner.querySelector("[data-platform-controls]")) {
  const controls = document.createElement("div");
  controls.className = "header-controls";
  controls.dataset.platformControls = "";

  const themeToggle = document.createElement("button");
  themeToggle.className = "theme-toggle";
  themeToggle.type = "button";
  themeToggle.dataset.themeToggle = "";
  themeToggle.setAttribute("aria-label", "Switch theme");
  themeToggle.title = "Switch theme";
  const themeGlyph = document.createElement("span");
  themeGlyph.className = "theme-glyph";
  themeGlyph.setAttribute("aria-hidden", "true");
  themeGlyph.textContent = "◐";
  const themeLabel = document.createElement("span");
  themeLabel.dataset.themeLabel = "";
  themeToggle.append(themeGlyph, themeLabel);

  const menuToggle = document.createElement("button");
  menuToggle.className = "mobile-nav-toggle";
  menuToggle.type = "button";
  menuToggle.dataset.navToggle = "";
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  const menuGlyph = document.createElement("span");
  menuGlyph.className = "menu-glyph";
  menuGlyph.setAttribute("aria-hidden", "true");
  menuGlyph.append(document.createElement("i"), document.createElement("i"));
  const menuLabel = document.createElement("span");
  menuLabel.dataset.menuLabel = "";
  menuLabel.textContent = "Menu";
  menuToggle.append(menuGlyph, menuLabel);
  menuToggle.setAttribute("aria-controls", navigation?.id ?? "main-nav");

  controls.append(themeToggle, menuToggle);
  const headerAction = headerInner.querySelector(".header-action");
  if (headerAction) {
    headerAction.insertAdjacentElement("afterend", controls);
  } else {
    headerInner.append(controls);
  }
  applyTheme();
}

const navigationToggle = document.querySelector("[data-nav-toggle]");

function setNavigationOpen(isOpen) {
  if (!navigation || !navigationToggle) return;
  navigation.classList.toggle("is-open", isOpen);
  navigationToggle.setAttribute("aria-expanded", String(isOpen));
  navigationToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  const label = navigationToggle.querySelector("[data-menu-label]");
  if (label) label.textContent = isOpen ? "Close" : "Menu";
}

navigationToggle?.addEventListener("click", () => {
  setNavigationOpen(navigationToggle.getAttribute("aria-expanded") !== "true");
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setNavigationOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setNavigationOpen(false);
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) setNavigationOpen(false);
});

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    savePreferences({ theme: preferences.theme === "dark" ? "light" : "dark" });
  });
});