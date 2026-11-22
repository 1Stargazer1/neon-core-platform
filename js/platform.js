(() => {
const preferenceStorageKey = "neon-core.preferences.v1";
const validCategories = ["all", "gaming", "technology", "displays-performance", "development", "everyday", "favorites"];

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

function createBrand(className, label) {
  const brand = document.createElement("a");
  brand.className = className;
  brand.href = "/";
  brand.setAttribute("aria-label", label);

  const mark = document.createElement("span");
  mark.className = "brand-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.append(...Array.from({ length: 4 }, () => document.createElement("span")));

  const wordmark = document.createElement("span");
  wordmark.append(
    document.createTextNode("NEON"),
    Object.assign(document.createElement("span"), {
      className: "brand-divider",
      textContent: "//",
    }),
    document.createTextNode("CORE"),
  );
  brand.append(mark, wordmark);
  return brand;
}

function createNavigationLink(label, href, current) {
  const link = document.createElement("a");
  link.className = "nav-link";
  link.href = href;
  link.textContent = label;
  if (current) link.setAttribute("aria-current", current);
  return link;
}

function createFooterLink(label, href, current) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  if (current) link.setAttribute("aria-current", current);
  return link;
}

const currentPath = window.location.pathname.toLowerCase();
const currentHash = window.location.hash;
const isToolPage = Boolean(document.body.dataset.toolId);
const isHomePage = !isToolPage && (currentPath === "/" || currentPath.endsWith("/") || currentPath.endsWith("/index.html"));
const isSoftwarePage = /\/software(?:\.html)?\/?$/.test(currentPath);
const isPricingPage = /\/pricing(?:\.html)?\/?$/.test(currentPath);
const isContactPage = /\/contact(?:\.html)?\/?$/.test(currentPath);
const isPrivacyPage = /\/privacy(?:\.html)?\/?$/.test(currentPath);
const header = document.querySelector(".site-header");
if (header && !header.id) header.id = "top";

const headerInner = header?.querySelector(".header-inner");
let navigation = headerInner?.querySelector(".main-nav");
let headerAction = headerInner?.querySelector(".header-action");
let navigationToggle;

if (headerInner) {
  let brand = headerInner.querySelector(".brand");
  if (!brand) {
    const legacyTitle = headerInner.querySelector(".site-title");
    brand = createBrand("brand", "NEON//CORE home");
    if (legacyTitle) {
      legacyTitle.replaceWith(brand);
    } else {
      headerInner.prepend(brand);
    }
  }
  brand.href = "/";
  brand.setAttribute("aria-label", "NEON//CORE home");
  brand.toggleAttribute("aria-current", isHomePage);
  if (isHomePage) brand.setAttribute("aria-current", "page");

  if (!navigation) {
    navigation = document.createElement("nav");
    headerInner.append(navigation);
  }
  navigation.classList.add("main-nav");
  navigation.id = navigation.id || "main-nav";
  navigation.setAttribute("aria-label", "Primary navigation");

  const toolsLink = createNavigationLink(
    "Tools",
    "/#tools",
    isToolPage || (isHomePage && currentHash === "#tools") ? "location" : null,
  );
  const softwareLink = createNavigationLink("Software Directory", "/software", isSoftwarePage ? "page" : null);
  const aboutLink = createNavigationLink(
    "About",
    "/#about",
    isHomePage && currentHash === "#about" ? "location" : null,
  );
  navigation.replaceChildren(toolsLink, softwareLink, aboutLink);

  if (!headerAction) {
    headerAction = document.createElement("a");
    headerAction.className = "header-action";
    headerInner.append(headerAction);
  }
  headerAction.className = "header-action";
  headerAction.href = "/#tools";
  headerAction.setAttribute("aria-label", "Browse tools");
  const actionLabel = document.createElement("span");
  actionLabel.setAttribute("aria-hidden", "true");
  actionLabel.textContent = "↘";
  headerAction.replaceChildren(document.createTextNode("Browse tools "), actionLabel);

  let controls = headerInner.querySelector("[data-platform-controls]");
  if (!controls) {
    controls = document.createElement("div");
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
    menuToggle.setAttribute("aria-controls", navigation.id);

    controls.append(themeToggle, menuToggle);
    headerInner.append(controls);
  }

  headerInner.insertBefore(controls, navigation);
  navigationToggle = controls.querySelector("[data-nav-toggle]");
  navigationToggle?.setAttribute("aria-controls", navigation.id);
  applyTheme();
}

const footer = document.querySelector(".site-footer");
if (footer) {
  let footerInner = footer.querySelector(".footer-inner");
  if (!footerInner) {
    footerInner = document.createElement("div");
    footerInner.className = "footer-inner section-shell";
    const existingChildren = [...footer.childNodes];
    footer.replaceChildren(footerInner);
    footerInner.append(...existingChildren);
  }

  let footerBrand = footerInner.querySelector(".footer-brand");
  if (!footerBrand) {
    footerBrand = createBrand("brand footer-brand", "NEON//CORE home");
    footerInner.prepend(footerBrand);
  }
  footerBrand.href = "/";
  footerBrand.setAttribute("aria-label", "NEON//CORE home");
  if (isHomePage) footerBrand.setAttribute("aria-current", "page");

  let footerNavigation = footerInner.querySelector(".footer-nav");
  if (!footerNavigation) {
    footerNavigation = document.createElement("nav");
    footerNavigation.className = "footer-nav";
    const backToTop = footerInner.querySelector(".back-to-top");
    footerInner.insertBefore(footerNavigation, backToTop);
  }
  footerNavigation.setAttribute("aria-label", "Footer navigation");
  footerNavigation.replaceChildren(
    createFooterLink("Tools", "/#tools", isToolPage ? "location" : null),
    createFooterLink("Software Directory", "/software", isSoftwarePage ? "page" : null),
    createFooterLink("About", "/#about", isHomePage && currentHash === "#about" ? "location" : null),
    createFooterLink("Contact", "/contact.html", isContactPage ? "page" : null),
    createFooterLink("Privacy", "/privacy.html", isPrivacyPage ? "page" : null),
    createFooterLink("Pricing", "/pricing.html", isPricingPage ? "page" : null),
  );

  if (!footerInner.querySelector(".back-to-top")) {
    const backToTop = document.createElement("a");
    backToTop.className = "back-to-top";
    backToTop.href = "#top";
    backToTop.append(document.createTextNode("Back to top "));
    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↑";
    backToTop.append(arrow);
    footerInner.append(backToTop);
  }
}

function updateLocationNavigation() {
  const toolsIsCurrent = isToolPage || (isHomePage && window.location.hash === "#tools");
  const aboutIsCurrent = isHomePage && window.location.hash === "#about";

  document
    .querySelectorAll('.main-nav a[href="/#tools"], .footer-nav a[href="/#tools"]')
    .forEach((link) => {
      if (toolsIsCurrent) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  document
    .querySelectorAll('.main-nav a[href="/#about"], .footer-nav a[href="/#about"]')
    .forEach((link) => {
      if (aboutIsCurrent) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
}

updateLocationNavigation();
window.addEventListener("hashchange", updateLocationNavigation);

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
  if (event.key === "Escape" && navigationToggle?.getAttribute("aria-expanded") === "true") {
    setNavigationOpen(false);
    navigationToggle.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) setNavigationOpen(false);
});

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    savePreferences({ theme: preferences.theme === "dark" ? "light" : "dark" });
  });
});
})();