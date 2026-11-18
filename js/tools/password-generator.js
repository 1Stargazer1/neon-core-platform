const passwordCategories = [
  { id: "include-uppercase", name: "uppercase letters", characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  { id: "include-lowercase", name: "lowercase letters", characters: "abcdefghijklmnopqrstuvwxyz" },
  { id: "include-numbers", name: "numbers", characters: "0123456789" },
  { id: "include-symbols", name: "symbols", characters: "!@#$%^&*()-_=+[]{};:,.<>?/~" },
];
const ambiguousCharacters = new Set("0O1lI");
const commonSequences = ["abcdefghijklmnopqrstuvwxyz", "0123456789", "qwertyuiop", "asdfghjkl", "zxcvbnm"];
const commonTerms = ["password", "passw0rd", "letmein", "welcome", "admin"];
const randomByte = new Uint8Array(1);

const passwordLengthInput = document.querySelector("#password-length");
const excludeAmbiguousInput = document.querySelector("#exclude-ambiguous");
const excludeCharactersInput = document.querySelector("#exclude-characters");
const passwordInput = document.querySelector("#password-input");
const generateButton = document.querySelector("#generate-password-button");
const resetButton = document.querySelector("#reset-password-button");
const showPasswordButton = document.querySelector("#toggle-password-visibility");
const copyPasswordButton = document.querySelector("#copy-password-button");
const configError = document.querySelector("#password-config-error");
const copyFeedback = document.querySelector("#copy-feedback");
const strengthMeter = document.querySelector("#password-strength-meter");
const strengthBar = document.querySelector("#password-strength-bar");
const strengthLabel = document.querySelector("#password-strength-label");
const strengthGuidance = document.querySelector("#password-strength-guidance");
const entropyNote = document.querySelector("#password-entropy-note");

let generatedEntropyBits = null;

function isSecureRandomAvailable() {
  return Boolean(window.crypto && typeof window.crypto.getRandomValues === "function");
}

function secureRandomIndex(maxExclusive) {
  if (!isSecureRandomAvailable()) {
    throw new Error("Secure random generation is unavailable in this browser.");
  }

  if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 256) {
    throw new Error("The available character set cannot be sampled securely.");
  }

  const acceptedLimit = Math.floor(256 / maxExclusive) * maxExclusive;
  while (true) {
    window.crypto.getRandomValues(randomByte);
    if (randomByte[0] < acceptedLimit) {
      return randomByte[0] % maxExclusive;
    }
  }
}

function readPasswordOptions() {
  const rawLength = passwordLengthInput.value.trim();
  const length = Number(rawLength);

  if (rawLength === "" || !Number.isInteger(length) || length < 8 || length > 128) {
    return { error: "Choose a whole-number length from 8 to 128 characters." };
  }

  const excludedCharacters = new Set(Array.from(excludeCharactersInput.value));
  const enabledGroups = passwordCategories
    .filter((category) => document.querySelector(`#${category.id}`).checked)
    .map((category) => {
      const characters = Array.from(category.characters).filter((character) => {
        return !excludedCharacters.has(character)
          && (!excludeAmbiguousInput.checked || !ambiguousCharacters.has(character));
      });

      return { name: category.name, characters };
    });

  if (enabledGroups.length === 0) {
    return { error: "Enable at least one character type to generate a password." };
  }

  const emptyGroup = enabledGroups.find((group) => group.characters.length === 0);
  if (emptyGroup) {
    return { error: `No ${emptyGroup.name} remain after exclusions. Change the exclusions or disable that category.` };
  }

  if (length < enabledGroups.length) {
    return { error: "The selected length is too short to include every enabled character type." };
  }

  const alphabet = Array.from(new Set(enabledGroups.flatMap((group) => group.characters)));
  if (alphabet.length === 0) {
    return { error: "No characters are available. Change the exclusions or enable a character type." };
  }

  return { length, groups: enabledGroups, alphabet };
}

function updateGeneratorControls() {
  const options = readPasswordOptions();
  let message = options.error || "";

  if (!message && !isSecureRandomAvailable()) {
    message = "Secure randomness is unavailable. Use a supported browser in a secure context; no insecure fallback is used.";
  }

  configError.textContent = message;
  configError.hidden = !message;
  generateButton.disabled = Boolean(message);
}

function secureShuffle(characters) {
  for (let index = characters.length - 1; index > 0; index--) {
    const swapIndex = secureRandomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }
}

function includesEveryEnabledCategory(password, groups) {
  return groups.every((group) => password.some((character) => group.characters.includes(character)));
}

function createPassword(options) {
  const maxAttempts = 10000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const characters = Array.from({ length: options.length }, () => {
      return options.alphabet[secureRandomIndex(options.alphabet.length)];
    });

    if (!includesEveryEnabledCategory(characters, options.groups)) {
      continue;
    }

    secureShuffle(characters);
    return characters.join("");
  }

  throw new Error("Unable to satisfy the selected categories with the current exclusions. Adjust the settings and try again.");
}

function log2BigInt(value) {
  const bitLength = value.toString(2).length;
  const shift = Math.max(0, bitLength - 53);
  return Math.log2(Number(value >> BigInt(shift))) + shift;
}

function calculateGeneratedEntropy(length, groups) {
  const alphabetSize = groups.reduce((total, group) => total + group.characters.length, 0);
  let validPasswordCount = 0n;

  for (let subset = 0; subset < 2 ** groups.length; subset++) {
    let excludedSize = 0;
    let subsetSize = 0;

    for (let index = 0; index < groups.length; index++) {
      if (subset & (1 << index)) {
        excludedSize += groups[index].characters.length;
        subsetSize++;
      }
    }

    const availableSize = BigInt(alphabetSize - excludedSize);
    const combinations = availableSize ** BigInt(length);
    validPasswordCount += subsetSize % 2 === 0 ? combinations : -combinations;
  }

  if (validPasswordCount <= 0n) {
    throw new Error("The selected settings do not have a valid password space.");
  }

  return log2BigInt(validPasswordCount);
}

function containsCommonSequence(value) {
  const normalized = value.toLowerCase();
  if (commonTerms.some((term) => normalized.includes(term))) {
    return true;
  }

  for (const sequence of commonSequences) {
    for (const candidate of [sequence, Array.from(sequence).reverse().join("")]) {
      for (let index = 0; index <= candidate.length - 4; index++) {
        if (normalized.includes(candidate.slice(index, index + 4))) {
          return true;
        }
      }
    }
  }

  return false;
}

function assessPassword(value) {
  const characters = Array.from(value);
  if (characters.length === 0) {
    return {
      score: 0,
      label: "Not assessed",
      guidance: "Enter or generate a password to see general guidance.",
      level: "none",
    };
  }

  const repeatedCharacters = /(.)\1{2,}/u.test(value);
  const commonSequence = containsCommonSequence(value);
  const uniqueRatio = new Set(characters).size / characters.length;
  const categoryCount = [
    /[A-Z]/.test(value),
    /[a-z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/u.test(value),
  ].filter(Boolean).length;

  let score = characters.length >= 8 ? 1 : 0;
  if (characters.length >= 12) score++;
  if (characters.length >= 16) score++;
  if (categoryCount >= 3) score++;
  if (uniqueRatio >= 0.7) score++;

  if (characters.length < 8 || repeatedCharacters || commonSequence) {
    score = Math.min(score, 1);
  }

  score = Math.min(score, 4);
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  let guidance = "Use a longer, unique password and avoid reusing it.";

  if (characters.length < 8) {
    guidance = "This is very short. Use at least 12 characters where the service allows.";
  } else if (repeatedCharacters) {
    guidance = "Avoid runs of the same character; they are easy to guess.";
  } else if (commonSequence) {
    guidance = "Avoid familiar sequences or common password-like words.";
  } else if (characters.length >= 12 && categoryCount >= 3 && uniqueRatio >= 0.7) {
    guidance = "Good signs, but prefer a longer unique password and do not reuse it.";
  }

  return {
    score,
    label: labels[score],
    guidance,
    level: ["very-weak", "weak", "fair", "strong", "very-strong"][score],
  };
}

function updateStrengthDisplay() {
  const assessment = assessPassword(passwordInput.value);
  strengthLabel.textContent = assessment.label;
  strengthGuidance.textContent = assessment.guidance;
  strengthMeter.dataset.level = assessment.level;
  strengthMeter.setAttribute("aria-valuenow", String(assessment.score));
  strengthMeter.setAttribute("aria-valuetext", assessment.label);
  strengthBar.style.width = `${assessment.score * 25}%`;

  if (generatedEntropyBits === null) {
    entropyNote.textContent = "No theoretical entropy estimate is shown for manually entered passwords because their creation process is unknown.";
  } else {
    entropyNote.textContent = `Theoretical entropy estimate for this generated password: about ${generatedEntropyBits.toFixed(1)} bits. This is based on the configured character pool, length, and required categories, not a cracking-time estimate.`;
  }
}

function resetPasswordVisibility() {
  passwordInput.type = "password";
  showPasswordButton.textContent = "Show";
  showPasswordButton.setAttribute("aria-pressed", "false");
}

function handleGeneratePassword() {
  const options = readPasswordOptions();
  if (options.error || !isSecureRandomAvailable()) {
    updateGeneratorControls();
    return;
  }

  try {
    const password = createPassword(options);
    const entropy = calculateGeneratedEntropy(options.length, options.groups);
    passwordInput.value = password;
    generatedEntropyBits = entropy;
    resetPasswordVisibility();
    showPasswordButton.disabled = false;
    copyPasswordButton.disabled = false;
    copyFeedback.textContent = "";
    updateStrengthDisplay();
  } catch {
    passwordInput.value = "";
    generatedEntropyBits = null;
    resetPasswordVisibility();
    showPasswordButton.disabled = true;
    copyPasswordButton.disabled = true;
    updateStrengthDisplay();
    copyFeedback.textContent = "Secure generation failed. No password was produced; check browser security support and try again.";
  }
}

async function copyPassword() {
  if (passwordInput.value === "") {
    copyFeedback.textContent = "Generate or enter a password before copying.";
    return;
  }

  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
    copyFeedback.textContent = "Clipboard access is unavailable. You can select and copy the value manually.";
    return;
  }

  try {
    await navigator.clipboard.writeText(passwordInput.value);
    copyFeedback.textContent = "Password copied. It was not saved by this tool.";
  } catch {
    copyFeedback.textContent = "Copy failed. Check clipboard permission or select and copy the value manually.";
  }
}

function resetGenerator() {
  passwordLengthInput.value = "20";
  passwordCategories.forEach((category) => {
    document.querySelector(`#${category.id}`).checked = true;
  });
  excludeAmbiguousInput.checked = false;
  excludeCharactersInput.value = "";
  passwordInput.value = "";
  generatedEntropyBits = null;
  resetPasswordVisibility();
  showPasswordButton.disabled = true;
  copyPasswordButton.disabled = true;
  copyFeedback.textContent = "";
  updateGeneratorControls();
  updateStrengthDisplay();
}

passwordLengthInput.addEventListener("input", updateGeneratorControls);
excludeAmbiguousInput.addEventListener("change", updateGeneratorControls);
excludeCharactersInput.addEventListener("input", updateGeneratorControls);
passwordCategories.forEach((category) => {
  document.querySelector(`#${category.id}`).addEventListener("change", updateGeneratorControls);
});

passwordInput.addEventListener("input", () => {
  generatedEntropyBits = null;
  showPasswordButton.disabled = passwordInput.value === "";
  copyPasswordButton.disabled = passwordInput.value === "";
  copyFeedback.textContent = "";
  updateStrengthDisplay();
});

showPasswordButton.addEventListener("click", () => {
  const isVisible = passwordInput.type === "text";
  passwordInput.type = isVisible ? "password" : "text";
  showPasswordButton.textContent = isVisible ? "Show" : "Hide";
  showPasswordButton.setAttribute("aria-pressed", String(!isVisible));
});

generateButton.addEventListener("click", handleGeneratePassword);
copyPasswordButton.addEventListener("click", copyPassword);
resetButton.addEventListener("click", resetGenerator);

updateGeneratorControls();
updateStrengthDisplay();
