const jsonInput = document.querySelector("#json-input");
const indentSelect = document.querySelector("#indent-select");
const jsonOutput = document.querySelector("#json-output");
const jsonError = document.querySelector("#json-error");
const formatButton = document.querySelector("#format-button");
const minifyButton = document.querySelector("#minify-button");
const copyOutputButton = document.querySelector("#copy-output-button");
const downloadButton = document.querySelector("#download-button");
const clearButton = document.querySelector("#clear-button");
const inputSizeDisplay = document.querySelector("#input-size");
const outputSizeDisplay = document.querySelector("#output-size");
const jsonTypeDisplay = document.querySelector("#json-type");

const MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10 MB
let lastValidJson = null;
let lastValidOutput = null;
let hasValidJson = false;

function getIndentString(indent) {
  if (indent === "tab") {
    return "\t";
  }
  return " ".repeat(parseInt(indent));
}

function getJsonType(json) {
  if (json === null) return "null";
  if (Array.isArray(json)) return "array";
  if (typeof json === "object") return "object";
  if (typeof json === "string") return "string";
  if (typeof json === "number") return "number";
  if (typeof json === "boolean") return "boolean";
  return "unknown";
}

function validateAndDisplay() {
  const input = jsonInput.value.trim();
  inputSizeDisplay.textContent = jsonInput.value.length;

  jsonError.hidden = true;
  jsonError.textContent = "";
  jsonOutput.textContent = "—";
  outputSizeDisplay.textContent = "—";
  jsonTypeDisplay.textContent = "—";
  lastValidJson = null;
  lastValidOutput = null;
  hasValidJson = false;

  formatButton.disabled = true;
  minifyButton.disabled = true;
  copyOutputButton.disabled = true;
  downloadButton.disabled = true;
  clearButton.disabled = jsonInput.value === "";

  if (input === "") {
    return;
  }

  if (input.length > MAX_INPUT_SIZE) {
    jsonError.textContent = `Input exceeds ${MAX_INPUT_SIZE / 1024 / 1024} MB limit.`;
    jsonError.hidden = false;
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    let errorMsg = error.message;

    // Try to extract line/column info if available
    if (error instanceof SyntaxError) {
      // SyntaxError message format varies by browser
      errorMsg = error.message;
    }

    jsonError.textContent = `Invalid JSON: ${errorMsg}`;
    jsonError.hidden = false;
    return;
  }

  lastValidJson = parsed;
  hasValidJson = true;
  jsonTypeDisplay.textContent = getJsonType(parsed);

  // Show formatted version by default
  formatDisplay();
}

function formatDisplay() {
  if (!hasValidJson) {
    return;
  }

  const indent = getIndentString(indentSelect.value);

  try {
    lastValidOutput = JSON.stringify(lastValidJson, null, indent);
    jsonOutput.textContent = lastValidOutput;
    outputSizeDisplay.textContent = lastValidOutput.length;
    formatButton.disabled = false;
    minifyButton.disabled = false;
    copyOutputButton.disabled = false;
    downloadButton.disabled = false;
    clearButton.disabled = false;
    jsonError.hidden = true;
  } catch (error) {
    jsonError.textContent = `Error formatting JSON: ${error.message}`;
    jsonError.hidden = false;
    jsonOutput.textContent = "—";
    outputSizeDisplay.textContent = "—";
  }
}

function minifyDisplay() {
  if (!hasValidJson) {
    return;
  }

  try {
    lastValidOutput = JSON.stringify(lastValidJson);
    jsonOutput.textContent = lastValidOutput;
    outputSizeDisplay.textContent = lastValidOutput.length;
    formatButton.disabled = false;
    minifyButton.disabled = false;
    copyOutputButton.disabled = false;
    downloadButton.disabled = false;
    clearButton.disabled = false;
    jsonError.hidden = true;
  } catch (error) {
    jsonError.textContent = `Error minifying JSON: ${error.message}`;
    jsonError.hidden = false;
    jsonOutput.textContent = "—";
    outputSizeDisplay.textContent = "—";
  }
}

function copyOutput() {
  if (lastValidOutput) {
    navigator.clipboard.writeText(lastValidOutput).then(() => {
      const originalText = copyOutputButton.textContent;
      copyOutputButton.textContent = "Copied!";
      setTimeout(() => {
        copyOutputButton.textContent = originalText;
      }, 2000);
    });
  }
}

function downloadJson() {
  if (!lastValidOutput) {
    return;
  }

  const blob = new Blob([lastValidOutput], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "data.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function clearAll() {
  jsonInput.value = "";
  jsonOutput.textContent = "—";
  inputSizeDisplay.textContent = "0";
  outputSizeDisplay.textContent = "—";
  jsonTypeDisplay.textContent = "—";
  jsonError.hidden = true;
  jsonError.textContent = "";
  lastValidJson = null;
  lastValidOutput = null;
  hasValidJson = false;
  formatButton.disabled = true;
  minifyButton.disabled = true;
  copyOutputButton.disabled = true;
  downloadButton.disabled = true;
  clearButton.disabled = true;
}

// Event listeners
jsonInput.addEventListener("input", validateAndDisplay);
indentSelect.addEventListener("change", () => {
  if (lastValidJson) {
    formatDisplay();
  }
});

formatButton.addEventListener("click", formatDisplay);
minifyButton.addEventListener("click", minifyDisplay);
copyOutputButton.addEventListener("click", copyOutput);
downloadButton.addEventListener("click", downloadJson);
clearButton.addEventListener("click", clearAll);
