const textInput = document.querySelector("#text-input");
const clearButton = document.querySelector("#clear-text");
const charactersWithSpacesOutput = document.querySelector("#characters-with-spaces");
const charactersWithoutSpacesOutput = document.querySelector("#characters-without-spaces");
const wordCountOutput = document.querySelector("#word-count");
const paragraphCountOutput = document.querySelector("#paragraph-count");
const countAnnouncement = document.querySelector("#text-count-announcement");
let announcementTimeoutId;

const graphemeSegmenter = typeof Intl.Segmenter === "function"
  ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
  : null;
const unicodeMarkPattern = (() => {
  try {
    return new RegExp("\\p{Mark}", "u");
  } catch {
    return null;
  }
})();

function isCombiningMark(character) {
  const codePoint = character.codePointAt(0);
  if (unicodeMarkPattern) {
    return unicodeMarkPattern.test(character);
  }

  return (codePoint >= 0x0300 && codePoint <= 0x036f)
    || (codePoint >= 0x1ab0 && codePoint <= 0x1aff)
    || (codePoint >= 0x1dc0 && codePoint <= 0x1dff)
    || (codePoint >= 0x20d0 && codePoint <= 0x20ff)
    || (codePoint >= 0xfe20 && codePoint <= 0xfe2f);
}

function isGraphemeExtension(character) {
  const codePoint = character.codePointAt(0);
  return isCombiningMark(character)
    || (codePoint >= 0xfe00 && codePoint <= 0xfe0f)
    || (codePoint >= 0xe0100 && codePoint <= 0xe01ef)
    || (codePoint >= 0x1f3fb && codePoint <= 0x1f3ff)
    || (codePoint >= 0xe0020 && codePoint <= 0xe007f);
}

function countFallbackGraphemes(value) {
  const codePoints = Array.from(value);
  let graphemeCount = 0;
  let index = 0;

  while (index < codePoints.length) {
    const firstCodePoint = codePoints[index].codePointAt(0);
    index += 1;

    if (firstCodePoint === 0x0d && codePoints[index]?.codePointAt(0) === 0x0a) {
      index += 1;
    } else if (firstCodePoint >= 0x1f1e6 && firstCodePoint <= 0x1f1ff) {
      const nextCodePoint = codePoints[index]?.codePointAt(0);
      if (nextCodePoint >= 0x1f1e6 && nextCodePoint <= 0x1f1ff) {
        index += 1;
      }
    }

    while (index < codePoints.length) {
      if (isGraphemeExtension(codePoints[index])) {
        index += 1;
        continue;
      }

      if (codePoints[index].codePointAt(0) === 0x200d && index + 1 < codePoints.length) {
        index += 2;
        while (index < codePoints.length && isGraphemeExtension(codePoints[index])) {
          index += 1;
        }
        continue;
      }

      break;
    }

    graphemeCount += 1;
  }

  return graphemeCount;
}

function countCharacters(value) {
  if (graphemeSegmenter) {
    return Array.from(graphemeSegmenter.segment(value)).length;
  }

  return countFallbackGraphemes(value);
}

function updateTextCounts(shouldAnnounce = true) {
  const text = textInput.value;
  const normalizedText = text.replace(/\r\n?/gu, "\n");
  const textWithoutWhitespace = text.replace(/\s/gu, "");
  const words = text.match(/\S+/gu) ?? [];
  const paragraphs = normalizedText.trim() === ""
    ? []
    : normalizedText.trim().split(/\n\s*\n+/gu).filter((paragraph) => paragraph.trim() !== "");

  const characterCount = countCharacters(text);
  const compactCharacterCount = countCharacters(textWithoutWhitespace);
  charactersWithSpacesOutput.value = new Intl.NumberFormat().format(characterCount);
  charactersWithoutSpacesOutput.value = new Intl.NumberFormat().format(compactCharacterCount);
  wordCountOutput.value = new Intl.NumberFormat().format(words.length);
  paragraphCountOutput.value = new Intl.NumberFormat().format(paragraphs.length);

  clearTimeout(announcementTimeoutId);
  if (!shouldAnnounce) {
    countAnnouncement.textContent = "";
    return;
  }

  const characterLabel = characterCount === 1 ? "character" : "characters";
  const wordLabel = words.length === 1 ? "word" : "words";
  const paragraphLabel = paragraphs.length === 1 ? "paragraph" : "paragraphs";
  announcementTimeoutId = setTimeout(() => {
    countAnnouncement.textContent = `${characterCount} ${characterLabel} including whitespace, ${compactCharacterCount} excluding whitespace, ${words.length} ${wordLabel}, and ${paragraphs.length} ${paragraphLabel}.`;
  }, 400);
}

textInput.addEventListener("input", () => updateTextCounts());
clearButton.addEventListener("click", () => {
  textInput.value = "";
  updateTextCounts();
  textInput.focus();
});

updateTextCounts(false);