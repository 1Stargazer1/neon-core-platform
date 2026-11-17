(() => {
  "use strict";

  const categories = {
    "hardware-drivers": "Hardware & Drivers",
    "monitoring-diagnostics": "Monitoring & Diagnostics",
    "creative-productivity": "Creative & Productivity",
    "development-utilities": "Development & Utilities",
  };
  const operatingSystems = {
    windows: "Windows",
    macos: "macOS",
    linux: "Linux",
  };
  const pricingModels = {
    free: "Free",
    freemium: "Freemium",
    paid: "Paid",
  };
  const sourceLicenseTypes = {
    "open-source": "Open source",
    proprietary: "Proprietary",
    "source-available": "Source available",
    "public-domain": "Public domain",
    other: "Other",
    unknown: "Unknown",
  };
  const allowedListingKeys = new Set([
    "id",
    "name",
    "publisher",
    "category",
    "operatingSystems",
    "pricingModel",
    "sourceLicense",
    "summary",
    "tags",
    "officialUrl",
    "downloadUrl",
    "verifiedAt",
  ]);
  const allowedLicenseKeys = new Set(["type", "identifier", "url"]);
  const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

  const directory = document.querySelector(".software-directory");
  const form = document.querySelector("#software-filters");
  const searchInput = document.querySelector("#software-search");
  const categorySelect = document.querySelector("#software-category");
  const operatingSystemInputs = [...document.querySelectorAll('input[name="operatingSystems"]')];
  const pricingInputs = [...document.querySelectorAll('input[name="pricingModels"]')];
  const resetButton = document.querySelector("#software-reset");
  const resultsStatus = document.querySelector("#software-results-status");
  const loadMessage = document.querySelector("#software-load-message");
  const retryButton = document.querySelector("#software-retry");
  const resultsGrid = document.querySelector("#software-results-grid");
  const emptyState = document.querySelector("#software-empty-state");

  if (
    !directory ||
    !form ||
    !searchInput ||
    !categorySelect ||
    !resetButton ||
    !resultsStatus ||
    !loadMessage ||
    !retryButton ||
    !resultsGrid ||
    !emptyState
  ) {
    console.error("Software directory markup is incomplete.");
    return;
  }

  let listings = [];

  function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function addUnexpectedKeyErrors(value, allowedKeys, errors, label) {
    for (const key of Object.keys(value)) {
      if (!allowedKeys.has(key)) errors.push(`Unexpected ${label} field "${key}".`);
    }
  }

  function parseHttpsUrl(value) {
    if (typeof value !== "string" || value.trim() !== value || !/^https:\/\//i.test(value)) return null;

    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function isRealCalendarDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;

    const date = new Date(0);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month - 1, day);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  function validateListing(record, duplicateIds) {
    const errors = [];
    if (!isRecord(record)) return { listing: null, errors: ["Record must be an object."] };
    addUnexpectedKeyErrors(record, allowedListingKeys, errors, "listing");

    if (typeof record.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id)) {
      errors.push("ID must be a lowercase hyphenated slug.");
    } else if (duplicateIds.has(record.id)) {
      errors.push("ID is duplicated in the catalogue.");
    }

    for (const field of ["name", "publisher", "summary"]) {
      if (typeof record[field] !== "string" || !record[field].trim()) {
        errors.push(`${field} must be a non-empty string.`);
      }
    }

    if (!owns(categories, record.category)) errors.push("Category is not supported.");
    if (
      !Array.isArray(record.operatingSystems) ||
      record.operatingSystems.length === 0 ||
      record.operatingSystems.some((system) => !owns(operatingSystems, system)) ||
      new Set(record.operatingSystems).size !== record.operatingSystems.length
    ) {
      errors.push("Operating systems must be a non-empty list of unique supported values.");
    }
    if (!owns(pricingModels, record.pricingModel)) errors.push("Pricing model is not supported.");

    let licenseUrl = null;
    if (!isRecord(record.sourceLicense)) {
      errors.push("Source licence must be an object.");
    } else {
      addUnexpectedKeyErrors(record.sourceLicense, allowedLicenseKeys, errors, "source licence");
      if (!owns(sourceLicenseTypes, record.sourceLicense.type)) {
        errors.push("Source licence type is not supported.");
      }
      if (
        owns(record.sourceLicense, "identifier") &&
        (typeof record.sourceLicense.identifier !== "string" || !record.sourceLicense.identifier.trim())
      ) {
        errors.push("Source licence identifier must be a non-empty string when provided.");
      }
      if (owns(record.sourceLicense, "url")) {
        licenseUrl = parseHttpsUrl(record.sourceLicense.url);
        if (!licenseUrl) errors.push("Source licence URL must be a valid HTTPS URL.");
      }
    }

    const officialUrl = parseHttpsUrl(record.officialUrl);
    if (!officialUrl) errors.push("Official URL must be a valid HTTPS URL.");
    const hasDownloadUrl = owns(record, "downloadUrl");
    const downloadUrl = hasDownloadUrl ? parseHttpsUrl(record.downloadUrl) : null;
    if (hasDownloadUrl && !downloadUrl) {
      errors.push("Download URL must be a valid HTTPS URL when provided.");
    }
    if (!isRealCalendarDate(record.verifiedAt)) errors.push("Verification date must be a real YYYY-MM-DD date.");

    let tags = [];
    if (
      owns(record, "tags") &&
      (!Array.isArray(record.tags) ||
        record.tags.some((tag) => typeof tag !== "string" || !tag.trim()) ||
        new Set(record.tags.map((tag) => typeof tag === "string" ? tag.trim() : tag)).size !== record.tags.length)
    ) {
      errors.push("Tags must be a list of unique non-empty strings when provided.");
    } else if (Array.isArray(record.tags)) {
      tags = record.tags.map((tag) => tag.trim());
    }

    if (errors.length) return { listing: null, errors };

    const sourceLicense = { type: record.sourceLicense.type };
    if (record.sourceLicense.identifier) sourceLicense.identifier = record.sourceLicense.identifier.trim();
    if (licenseUrl) sourceLicense.url = licenseUrl.href;

    return {
      listing: {
        ...record,
        name: record.name.trim(),
        publisher: record.publisher.trim(),
        summary: record.summary.trim(),
        categoryLabel: categories[record.category],
        operatingSystemLabels: record.operatingSystems.map((system) => operatingSystems[system]),
        pricingLabel: pricingModels[record.pricingModel],
        sourceLicenseLabel: sourceLicenseTypes[record.sourceLicense.type],
        sourceLicense,
        officialUrl: officialUrl.href,
        downloadUrl: downloadUrl ? downloadUrl.href : null,
        licenseUrl: licenseUrl ? licenseUrl.href : null,
        tags,
      },
      errors: [],
    };
  }

  function validateCatalogue(catalogue) {
    if (!isRecord(catalogue)) return { error: "The software catalogue must be a JSON object." };
    if (Object.keys(catalogue).some((key) => !["schemaVersion", "listings"].includes(key))) {
      return { error: "The software catalogue contains unsupported fields." };
    }
    if (catalogue.schemaVersion !== 1 || !Array.isArray(catalogue.listings)) {
      return { error: "The software catalogue has an unsupported version or invalid listings list." };
    }
    if (catalogue.listings.length === 0) return { error: "The software catalogue contains no listings." };

    const idCounts = new Map();
    for (const record of catalogue.listings) {
      if (isRecord(record) && typeof record.id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id)) {
        idCounts.set(record.id, (idCounts.get(record.id) ?? 0) + 1);
      }
    }
    const duplicateIds = new Set([...idCounts].filter(([, count]) => count > 1).map(([id]) => id));
    const validListings = [];
    const invalidRecords = [];

    catalogue.listings.forEach((record, index) => {
      const validation = validateListing(record, duplicateIds);
      if (validation.listing) validListings.push(validation.listing);
      else invalidRecords.push({ index: index + 1, id: isRecord(record) ? record.id : undefined, errors: validation.errors });
    });

    if (invalidRecords.length) {
      console.warn("Software catalogue records were skipped:", invalidRecords);
    }
    if (validListings.length === 0) {
      return { error: "No valid software listings were found in the catalogue.", invalidRecords };
    }

    return { listings: validListings, invalidRecords };
  }

  function setControlsDisabled(disabled) {
    searchInput.disabled = disabled;
    form.querySelectorAll("fieldset").forEach((fieldset) => { fieldset.disabled = disabled; });
    resetButton.disabled = disabled;
  }

  function setLoadMessage(message, state, role = "status", live = "polite") {
    loadMessage.textContent = message;
    loadMessage.dataset.state = state;
    loadMessage.setAttribute("role", role);
    loadMessage.setAttribute("aria-live", live);
    loadMessage.hidden = !message;
  }

  function clearResults() {
    resultsGrid.replaceChildren();
    emptyState.hidden = true;
  }

  function showLoading() {
    directory.setAttribute("aria-busy", "true");
    setControlsDisabled(true);
    clearResults();
    setLoadMessage("", "");
    retryButton.hidden = true;
    resultsStatus.textContent = "Loading software directory.";
  }

  function showError(message) {
    directory.setAttribute("aria-busy", "false");
    resultsStatus.textContent = "Software directory unavailable.";
    setLoadMessage(message, "error", "alert", "assertive");
    retryButton.disabled = false;
    retryButton.textContent = "Retry loading directory";
    retryButton.hidden = false;
  }

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function createLink(url, label, className) {
    const link = document.createElement("a");
    link.className = className;
    link.href = url;
    link.textContent = label;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  function appendDetail(list, label, value, isOperatingSystems = false) {
    const row = document.createElement("div");
    row.append(createTextElement("dt", "", label));
    const definition = document.createElement("dd");
    if (isOperatingSystems) {
      value.forEach((system) => definition.append(createTextElement("span", "", system)));
    } else {
      definition.textContent = value;
    }
    row.append(definition);
    list.append(row);
  }

  function isPlaceholderUrl(url) {
    return new URL(url).hostname.endsWith(".invalid");
  }

  function createListingCard(listing) {
    const card = document.createElement("article");
    card.className = "surface-card software-card";
    card.dataset.softwareId = listing.id;

    const topline = document.createElement("div");
    topline.className = "software-card-topline";
    topline.append(
      createTextElement("span", "software-category-label", listing.categoryLabel),
    );
    card.append(topline);
    card.append(createTextElement("h3", "", listing.name));
    card.append(createTextElement("p", "software-publisher", listing.publisher));
    card.append(createTextElement("p", "software-summary", listing.summary));

    const details = document.createElement("dl");
    details.className = "software-card-details";
    appendDetail(details, "Operating systems", listing.operatingSystemLabels, true);
    appendDetail(details, "Pricing", listing.pricingLabel);
    appendDetail(
      details,
      "Source licence",
      listing.sourceLicense.identifier
        ? `${listing.sourceLicenseLabel} - ${listing.sourceLicense.identifier}`
        : listing.sourceLicenseLabel,
    );
    card.append(details);

    const actions = document.createElement("div");
    actions.className = "software-card-actions";
    if (!isPlaceholderUrl(listing.officialUrl)) {
      actions.append(createLink(listing.officialUrl, `Official site - ${listing.name}`, "software-card-link"));
    }
    if (listing.downloadUrl && !isPlaceholderUrl(listing.downloadUrl)) {
      actions.append(createLink(listing.downloadUrl, `Official download - ${listing.name}`, "software-card-link"));
    }
    if (listing.licenseUrl && !isPlaceholderUrl(listing.licenseUrl)) {
      actions.append(createLink(listing.licenseUrl, `Licence details - ${listing.name}`, "software-card-link"));
    }

    if (actions.childElementCount) {
      card.append(actions);
    } else {
      card.append(createTextElement(
        "p",
        "software-card-disclaimer",
        "No official links are available for this listing.",
      ));
    }

    const tags = document.createElement("ul");
    tags.className = "software-card-tags";
    tags.setAttribute("aria-label", `Search tags for ${listing.name}`);
    listing.tags.forEach((tag) => tags.append(createTextElement("li", "", tag)));
    if (listing.tags.length) card.append(tags);

    return card;
  }

  function getSelectedValues(inputs) {
    return new Set(inputs.filter((input) => input.checked).map((input) => input.value));
  }

  function matchesFilters(listing, query, selectedCategory, selectedOperatingSystems, selectedPricingModels) {
    const searchableText = [listing.name, listing.publisher, listing.summary, ...listing.tags]
      .join(" ")
      .toLowerCase();
    if (query && !searchableText.includes(query)) return false;
    if (selectedCategory && listing.category !== selectedCategory) return false;
    if (
      selectedOperatingSystems.size &&
      !listing.operatingSystems.some((system) => selectedOperatingSystems.has(system))
    ) {
      return false;
    }
    if (selectedPricingModels.size && !selectedPricingModels.has(listing.pricingModel)) return false;
    return true;
  }

  function renderResults() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedCategory = categorySelect.value;
    const selectedOperatingSystems = getSelectedValues(operatingSystemInputs);
    const selectedPricingModels = getSelectedValues(pricingInputs);
    const visibleListings = listings.filter((listing) =>
      matchesFilters(listing, query, selectedCategory, selectedOperatingSystems, selectedPricingModels),
    );
    const fragment = document.createDocumentFragment();
    visibleListings.forEach((listing) => fragment.append(createListingCard(listing)));
    resultsGrid.replaceChildren(fragment);
    emptyState.hidden = visibleListings.length !== 0;
    directory.setAttribute("aria-busy", "false");
    resultsStatus.textContent = visibleListings.length
      ? `Showing ${visibleListings.length} of ${listings.length} directory entries.`
      : "No matching directory entries.";
  }

  async function loadCatalogue() {
    const retryHadFocus = document.activeElement === retryButton;
    showLoading();
    if (retryHadFocus) {
      retryButton.hidden = false;
      retryButton.disabled = true;
      retryButton.textContent = "Retrying...";
      retryButton.focus();
    }

    let response;
    try {
      response = await fetch("/data/software.json", {
        headers: { Accept: "application/json" },
      });
    } catch (error) {
      console.error("Software catalogue request failed.", error);
      showError("The software directory could not be reached. Check your connection and try again.");
      return;
    }

    if (!response.ok) {
      console.error(`Software catalogue request returned HTTP ${response.status}.`);
      showError("The software directory could not be loaded. Try again in a moment.");
      return;
    }

    let catalogue;
    try {
      catalogue = await response.json();
    } catch (error) {
      console.error("Software catalogue response was not valid JSON.", error);
      showError("The software catalogue data could not be read. Try again in a moment.");
      return;
    }

    const validation = validateCatalogue(catalogue);
    if (validation.error) {
      console.error("Software catalogue validation failed:", validation.error);
      showError("The software catalogue is invalid. The directory cannot be displayed until it is corrected.");
      return;
    }

    listings = validation.listings;
    setControlsDisabled(false);
    retryButton.disabled = false;
    retryButton.textContent = "Retry loading directory";
    retryButton.hidden = true;
    if (validation.invalidRecords.length) {
      const count = validation.invalidRecords.length;
      setLoadMessage(
        `${count} invalid catalogue ${count === 1 ? "entry was" : "entries were"} skipped. The remaining entries are available.`,
        "partial",
      );
    } else {
      setLoadMessage("", "");
    }
    renderResults();
    if (retryHadFocus) searchInput.focus();
  }

  searchInput.addEventListener("input", renderResults);
  form.addEventListener("change", renderResults);
  form.addEventListener("reset", (event) => {
    event.preventDefault();
    searchInput.value = "";
    categorySelect.value = "";
    operatingSystemInputs.forEach((input) => { input.checked = false; });
    pricingInputs.forEach((input) => { input.checked = false; });
    renderResults();
  });
  retryButton.addEventListener("click", loadCatalogue);

  loadCatalogue();
})();
