const pixelTests = [
  { name: "Black", type: "solid", color: "#000000" },
  { name: "White", type: "solid", color: "#FFFFFF" },
  { name: "Red", type: "solid", color: "#FF0000" },
  { name: "Green", type: "solid", color: "#00FF00" },
  { name: "Blue", type: "solid", color: "#0000FF" },
  { name: "Grey", type: "solid", color: "#808080" },
  { name: "Cyan", type: "solid", color: "#00FFFF" },
  { name: "Yellow", type: "solid", color: "#FFFF00" },
  { name: "Magenta", type: "solid", color: "#FF00FF" },
  { name: "Horizontal greyscale gradient", type: "pattern", pattern: "gradient-horizontal" },
  { name: "Vertical greyscale gradient", type: "pattern", pattern: "gradient-vertical" },
  { name: "Fine checkerboard", type: "pattern", pattern: "checkerboard-fine" },
  { name: "Larger checkerboard", type: "pattern", pattern: "checkerboard-large" },
];

const testStage = document.querySelector("#pixel-test-stage");
const testSelect = document.querySelector("#pixel-test-select");
const testName = document.querySelector("#pixel-test-name");
const testIndexLabel = document.querySelector("#pixel-test-index");
const feedback = document.querySelector("#pixel-test-feedback");
const previousButton = document.querySelector("#previous-test-button");
const nextButton = document.querySelector("#next-test-button");
const exitButton = document.querySelector("#exit-test-button");
const hideControlsButton = document.querySelector("#hide-controls-button");
const startFullscreenButton = document.querySelector("#start-fullscreen-button");
const fullscreenNote = document.querySelector("#fullscreen-note");
const stageControls = document.querySelector(".pixel-test-stage-controls");
const patternClasses = pixelTests
  .filter((test) => test.type === "pattern")
  .map((test) => `pixel-test-stage--${test.pattern}`);
const fullscreenControlsHiddenClass = "pixel-test-stage--controls-hidden";
const fullscreenControlsDelay = 3000;

let currentTestIndex = 0;
let testActive = false;
let fullscreenActive = false;
let fullscreenControlsTimer = null;

function setFeedback(message) {
  feedback.textContent = message;
}

function renderTest(index, options = {}) {
  if (!Number.isInteger(index) || index < 0 || index >= pixelTests.length) {
    return false;
  }

  const test = pixelTests[index];
  currentTestIndex = index;
  testStage.classList.remove(...patternClasses);
  testStage.style.backgroundColor = test.type === "solid" ? test.color : "";

  if (test.type === "pattern") {
    testStage.classList.add(`pixel-test-stage--${test.pattern}`);
  }

  testName.textContent = test.type === "solid" ? `${test.name} (${test.color})` : test.name;
  testIndexLabel.textContent = `TEST ${String(index + 1).padStart(2, "0")} / ${pixelTests.length}`;
  testStage.setAttribute("aria-label", `Display test surface: ${testName.textContent}`);
  testSelect.value = String(index);
  previousButton.disabled = index === 0;
  nextButton.disabled = index === pixelTests.length - 1;

  if (options.activate !== false) {
    testActive = true;
  }

  if (options.announce !== false) {
    setFeedback(`Showing ${testName.textContent}. Tests change only when you choose another one.`);
  }

  return true;
}

function clearTest() {
  testActive = false;
  testStage.classList.remove(...patternClasses);
  testStage.style.backgroundColor = "";
  testName.textContent = "Test ended";
  testIndexLabel.textContent = "TEST ENDED";
  testStage.setAttribute("aria-label", "Display test surface. No test is active.");
  setFeedback("Test ended. Choose a colour or pattern to continue.");
}

function hideFullscreenControls() {
  if (!fullscreenActive) {
    return;
  }

  if (stageControls.contains(document.activeElement)) {
    testStage.focus();
  }

  testStage.classList.add(fullscreenControlsHiddenClass);
  if (fullscreenControlsTimer !== null) {
    window.clearTimeout(fullscreenControlsTimer);
    fullscreenControlsTimer = null;
  }
}

function revealFullscreenControls() {
  if (!fullscreenActive) {
    return;
  }

  testStage.classList.remove(fullscreenControlsHiddenClass);
  if (fullscreenControlsTimer !== null) {
    window.clearTimeout(fullscreenControlsTimer);
  }

  fullscreenControlsTimer = window.setTimeout(() => {
    fullscreenControlsTimer = null;
    hideFullscreenControls();
  }, fullscreenControlsDelay);
}

function handleFullscreenPointerActivity() {
  revealFullscreenControls();
}

function startFullscreenControls() {
  hideControlsButton.hidden = false;
  testStage.addEventListener("mousemove", handleFullscreenPointerActivity);
  testStage.addEventListener("touchstart", handleFullscreenPointerActivity, { passive: true });
  revealFullscreenControls();
}

function cleanupFullscreenControls() {
  if (fullscreenControlsTimer !== null) {
    window.clearTimeout(fullscreenControlsTimer);
    fullscreenControlsTimer = null;
  }

  testStage.removeEventListener("mousemove", handleFullscreenPointerActivity);
  testStage.removeEventListener("touchstart", handleFullscreenPointerActivity);
  testStage.classList.remove(fullscreenControlsHiddenClass);
  hideControlsButton.hidden = true;
}

function exitFullscreen() {
  if (!document.fullscreenElement) {
    return;
  }

  if (typeof document.exitFullscreen !== "function") {
    setFeedback("Fullscreen could not be closed from this control. Press Escape or use the browser's fullscreen controls.");
    return;
  }

  document.exitFullscreen().catch(() => {
    if (document.fullscreenElement) {
      setFeedback("Fullscreen could not be closed. Press Escape or use the browser's fullscreen controls.");
    }
  });
}

function exitTest() {
  clearTest();
  exitFullscreen();
}

async function startFullscreenTest() {
  renderTest(currentTestIndex, { announce: false });

  if (typeof testStage.requestFullscreen !== "function" || document.fullscreenEnabled === false) {
    setFeedback("Fullscreen is unavailable in this browser or device. The test remains available in the page.");
    return;
  }

  if (document.fullscreenElement === testStage) {
    setFeedback("Fullscreen is already active. Press Escape or choose Exit Test to leave.");
    return;
  }

  setFeedback("Requesting fullscreen. If it is not allowed, the test will remain available in the page.");

  try {
    await testStage.requestFullscreen();
  } catch {
    setFeedback("Fullscreen was not granted. The display test remains available in the page.");
  }
}

function handleFullscreenChange() {
  const wasFullscreen = fullscreenActive;
  fullscreenActive = document.fullscreenElement === testStage;

  if (fullscreenActive) {
    testActive = true;
    if (!wasFullscreen) {
      startFullscreenControls();
    }
    testStage.focus();
    setFeedback("Fullscreen active. Press Escape or choose Exit Test to leave.");
    return;
  }

  if (wasFullscreen) {
    cleanupFullscreenControls();
    setFeedback(testActive
      ? "Fullscreen ended. Your selected test remains visible in the page."
      : "Test ended and the normal page layout is restored.");
  } else if (document.fullscreenElement) {
    setFeedback("Fullscreen changed to another page element. The display test remains available.");
  }
}

testSelect.addEventListener("change", () => {
  const selectedIndex = Number(testSelect.value);
  if (!renderTest(selectedIndex)) {
    setFeedback("Select a valid colour or pattern.");
  }
});

previousButton.addEventListener("click", () => {
  renderTest(currentTestIndex - 1);
});

nextButton.addEventListener("click", () => {
  renderTest(currentTestIndex + 1);
});

exitButton.addEventListener("click", exitTest);
hideControlsButton.addEventListener("click", hideFullscreenControls);
startFullscreenButton.addEventListener("click", startFullscreenTest);

document.addEventListener("keydown", (event) => {
  if (fullscreenActive && event.key === "Escape") {
    if (typeof document.exitFullscreen === "function") {
      event.preventDefault();
      exitFullscreen();
    }
    return;
  }

  if (fullscreenActive) {
    revealFullscreenControls();
  }

  if (!testActive || event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  if (event.target instanceof Element && event.target.closest("button, a, input, select, textarea, [contenteditable='true']")) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    renderTest(currentTestIndex - 1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    renderTest(currentTestIndex + 1);
  }
});

document.addEventListener("fullscreenchange", handleFullscreenChange);
testStage.addEventListener("fullscreenerror", () => {
  setFeedback("Fullscreen was not granted. The display test remains available in the page.");
});

const fullscreenSupported = typeof testStage.requestFullscreen === "function"
  && typeof document.exitFullscreen === "function"
  && document.fullscreenEnabled !== false;

if (!fullscreenSupported) {
  startFullscreenButton.disabled = true;
  fullscreenNote.textContent = "Fullscreen is not supported here. The static tests remain available in the page.";
}

renderTest(0, { activate: false, announce: false });
