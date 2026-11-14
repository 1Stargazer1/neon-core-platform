const rateTypeInputs = document.querySelectorAll('input[name="rate-type"]');
const rateLabel = document.querySelector("#rate-label");
const rateInput = document.querySelector("#rate-input");
const resultOutput = document.querySelector("#refresh-result");
const equationOutput = document.querySelector("#refresh-equation");
const captionOutput = document.querySelector("#refresh-caption");
const errorMessage = document.querySelector("#refresh-error");

function formatRate(value) {
  if (value >= 1e12 || value < 1e-6) {
    return value.toExponential(3);
  }

  return new Intl.NumberFormat(undefined, {
    maximumSignificantDigits: 8,
  }).format(value);
}

function showRefreshError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  rateInput.setAttribute("aria-invalid", "true");
  rateInput.setAttribute("aria-describedby", "refresh-error");
  resultOutput.textContent = "—";
  equationOutput.textContent = "A valid positive rate is required";
  captionOutput.textContent = "Correct the highlighted value to calculate frame duration.";
}

function updateFrameDuration() {
  const rateType = document.querySelector('input[name="rate-type"]:checked').value;
  const rateName = rateType === "hz" ? "Refresh rate" : "Frame rate";
  const rateUnit = rateType === "hz" ? "Hz" : "FPS";
  const rawRate = rateInput.value.trim();
  const rate = Number(rawRate);

  rateLabel.textContent = rateType === "hz" ? "Refresh rate in hertz (Hz)" : "Frame rate in frames per second (FPS)";

  if (rawRate === "" || !Number.isFinite(rate) || rate <= 0) {
    showRefreshError("Enter a rate greater than zero.");
    return;
  }

  const frameDuration = 1000 / rate;
  if (!Number.isFinite(frameDuration)) {
    showRefreshError("That rate is too small to calculate. Enter a larger value.");
    return;
  }

  const formattedDuration = frameDuration < 0.001
    ? `${frameDuration.toExponential(3)}`
    : new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(frameDuration);
  const formattedRate = formatRate(rate);

  errorMessage.hidden = true;
  rateInput.removeAttribute("aria-invalid");
  rateInput.removeAttribute("aria-describedby");
  equationOutput.textContent = `1,000 ms ÷ ${formattedRate} ${rateUnit}`;
  resultOutput.textContent = `${formattedDuration} ms`;
  const durationSubject = rateType === "hz" ? "display refresh" : "frame";
  captionOutput.textContent = `At ${formattedRate} ${rateUnit}, one ${durationSubject} takes about ${formattedDuration} milliseconds.`;
}

rateInput.addEventListener("input", updateFrameDuration);
rateTypeInputs.forEach((radio) => radio.addEventListener("change", updateFrameDuration));

updateFrameDuration();