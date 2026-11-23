import { copyFile, lstat, mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
export const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..");
export const MANIFEST_PATH = path.join(SCRIPT_DIRECTORY, "production-asset-manifest.json");
export const PRODUCTION_OUTPUT_DIRECTORY = path.join(REPOSITORY_ROOT, ".production");

const REQUIRED_MANIFEST_GROUP_COUNTS = {
  pages: 32,
  stylesheets: 5,
  scripts: 30,
  data: 1,
  sharedAssets: 6,
  siteMetadata: 2,
};

const PROTECTED_EXACT_PATHS = new Set([
  "games.html",
  "gpus.html",
  "cpus.html",
  "data/games.json",
  "data/gpus.json",
  "data/cpus.json",
  "data/sources.json",
  "data/source-policy.md",
  "js/catalogue-validation.js",
  "js/game-detail.js",
  "js/games-directory.js",
  "js/gpu-directory.js",
  "js/cpu-directory.js",
  "css/game-detail.css",
  "css/games-directory.css",
  "css/gpu-directory.css",
  "css/cpu-directory.css",
]);

const PROTECTED_PREFIXES = ["games/", "data/schemas/"];

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function normalizeManifestPath(assetPath) {
  if (
    typeof assetPath !== "string" ||
    assetPath.length === 0 ||
    assetPath.includes("\\") ||
    path.posix.isAbsolute(assetPath) ||
    path.posix.normalize(assetPath) !== assetPath ||
    assetPath === ".." ||
    assetPath.startsWith("../")
  ) {
    throw new Error(`Invalid production asset path: ${String(assetPath)}`);
  }
  return assetPath;
}

export function isProtectedPhase2Path(assetPath) {
  const normalizedPath = normalizeManifestPath(assetPath);
  return PROTECTED_EXACT_PATHS.has(normalizedPath) ||
    PROTECTED_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix));
}

export async function readApprovedAssets(manifestPath = MANIFEST_PATH) {
  let manifestContents;
  try {
    manifestContents = await readFile(manifestPath, "utf8");
  } catch (error) {
    throw new Error(`Unable to read production asset manifest: ${error.message}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestContents);
  } catch (error) {
    throw new Error(`Malformed production asset manifest JSON: ${error.message}`);
  }

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("Production asset manifest must be an object of asset groups.");
  }

  const expectedGroups = Object.keys(REQUIRED_MANIFEST_GROUP_COUNTS).sort();
  const actualGroups = Object.keys(manifest).sort();
  if (actualGroups.length !== expectedGroups.length ||
      actualGroups.some((group, index) => group !== expectedGroups[index])) {
    throw new Error(`Production asset manifest must contain exactly these groups: ${expectedGroups.join(", ")}.`);
  }

  for (const [group, expectedCount] of Object.entries(REQUIRED_MANIFEST_GROUP_COUNTS)) {
    if (!Array.isArray(manifest[group]) || manifest[group].length !== expectedCount) {
      throw new Error(`Production asset manifest group "${group}" must contain exactly ${expectedCount} paths.`);
    }
  }

  const assets = expectedGroups.flatMap((group) => manifest[group].map(normalizeManifestPath));
  if (manifest.pages.filter((assetPath) => assetPath.startsWith("tools/")).length !== 26) {
    throw new Error("Production asset manifest must contain all 26 Phase 1 tool pages.");
  }
  if (new Set(assets).size !== assets.length) {
    throw new Error("Production asset manifest contains duplicate paths.");
  }
  if (assets.some(isProtectedPhase2Path)) {
    throw new Error("Production asset manifest contains a protected Phase 2 path.");
  }
  return assets.sort();
}

async function listFiles(directory, relativeDirectory = "") {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = relativeDirectory
      ? `${relativeDirectory}/${entry.name}`
      : entry.name;
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listFiles(absolutePath, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      throw new Error(`Unexpected non-file asset in production output: ${relativePath}`);
    }
  }

  return files;
}

function localAssetPath(reference, ownerPath) {
  const value = reference.trim().split(/[?#]/, 1)[0];
  if (
    !value ||
    /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)
  ) {
    return null;
  }

  let decodedValue;
  try {
    decodedValue = decodeURIComponent(value);
  } catch (error) {
    throw new Error(`Invalid URL encoding in local asset reference "${value}": ${error.message}`);
  }

  const resolvedPath = decodedValue.startsWith("/")
    ? path.posix.normalize(decodedValue.slice(1))
    : path.posix.normalize(path.posix.join(path.posix.dirname(ownerPath), decodedValue));
  if (
    resolvedPath === ".." ||
    resolvedPath.startsWith("../") ||
    path.posix.isAbsolute(resolvedPath)
  ) {
    throw new Error(`Local asset reference escapes the production output: ${reference}`);
  }
  return resolvedPath || "index.html";
}

function getHtmlAssetReferences(contents, htmlPath) {
  const references = [];
  const tagPattern = /<(script|img|source|link)\b[^>]*>/gi;
  let tagMatch;

  while ((tagMatch = tagPattern.exec(contents)) !== null) {
    const tagName = tagMatch[1].toLowerCase();
    const attributes = new Map();
    const attributePattern = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let attributeMatch;

    while ((attributeMatch = attributePattern.exec(tagMatch[0])) !== null) {
      attributes.set(
        attributeMatch[1].toLowerCase(),
        attributeMatch[2] ?? attributeMatch[3] ?? "",
      );
    }

    if (tagName === "link") {
      const rel = (attributes.get("rel") || "").toLowerCase().split(/\s+/);
      if (!rel.some((value) => [
        "stylesheet",
        "icon",
        "apple-touch-icon",
        "manifest",
        "preload",
      ].includes(value))) {
        continue;
      }
      if (rel.includes("preload") && !["style", "script", "font", "image"].includes(attributes.get("as"))) {
        continue;
      }
      if (attributes.has("href")) references.push(attributes.get("href"));
    } else if (attributes.has("src")) {
      references.push(attributes.get("src"));
    }
  }

  return references
    .map((reference) => localAssetPath(reference, htmlPath))
    .filter((reference) => reference !== null);
}

export async function findMissingLocalAssetReferences(outputDirectory) {
  const htmlFiles = (await listFiles(outputDirectory)).filter((file) => file.endsWith(".html"));
  const missing = [];

  for (const htmlPath of htmlFiles) {
    const contents = await readFile(path.join(outputDirectory, ...htmlPath.split("/")), "utf8");
    for (const reference of getHtmlAssetReferences(contents, htmlPath)) {
      const target = path.join(outputDirectory, ...reference.split("/"));
      try {
        if (!(await lstat(target)).isFile()) {
          missing.push(`${htmlPath} -> ${reference}`);
        }
      } catch {
        missing.push(`${htmlPath} -> ${reference}`);
      }
    }
  }

  const cssFiles = (await listFiles(outputDirectory)).filter((file) => file.endsWith(".css"));
  for (const cssPath of cssFiles) {
    const contents = await readFile(path.join(outputDirectory, ...cssPath.split("/")), "utf8");
    const urlPattern = /url\(\s*(?:"([^"]+)"|'([^']+)'|([^)]*))\s*\)/gi;
    let match;

    while ((match = urlPattern.exec(contents)) !== null) {
      const reference = localAssetPath(match[1] ?? match[2] ?? match[3] ?? "", cssPath);
      if (reference === null) continue;

      const target = path.join(outputDirectory, ...reference.split("/"));
      try {
        if (!(await lstat(target)).isFile()) {
          missing.push(`${cssPath} -> ${reference}`);
        }
      } catch {
        missing.push(`${cssPath} -> ${reference}`);
      }
    }
  }

  for (const jsPath of (await listFiles(outputDirectory)).filter((file) => file.endsWith(".js"))) {
    const contents = await readFile(path.join(outputDirectory, ...jsPath.split("/")), "utf8");
    const fetchPattern = /\bfetch\s*\(\s*(["'])(.*?)\1/g;
    let match;

    while ((match = fetchPattern.exec(contents)) !== null) {
      if (!match[2].startsWith("/")) continue;
      const reference = localAssetPath(match[2], "");
      if (reference === null) continue;

      const target = path.join(outputDirectory, ...reference.split("/"));
      try {
        if (!(await lstat(target)).isFile()) {
          missing.push(`${jsPath} -> ${reference}`);
        }
      } catch {
        missing.push(`${jsPath} -> ${reference}`);
      }
    }
  }

  return missing.sort();
}

export async function validateProductionOutput(
  outputDirectory = PRODUCTION_OUTPUT_DIRECTORY,
  manifest,
) {
  const resolvedOutput = path.resolve(outputDirectory);
  const approvedAssets = manifest ?? await readApprovedAssets();
  const actualFiles = (await listFiles(resolvedOutput)).sort();
  const expectedFiles = [...approvedAssets].map(normalizeManifestPath).sort();
  const actualSet = new Set(actualFiles);
  const expectedSet = new Set(expectedFiles);
  const errors = [];

  for (const assetPath of actualFiles.filter(isProtectedPhase2Path)) {
    errors.push(`Protected Phase 2 path: ${assetPath}`);
  }
  for (const assetPath of expectedFiles.filter((assetPath) => !actualSet.has(assetPath))) {
    errors.push(`Missing required Phase 1 asset: ${assetPath}`);
  }
  for (const assetPath of actualFiles.filter((assetPath) => !expectedSet.has(assetPath))) {
    errors.push(`Unexpected production output file: ${assetPath}`);
  }

  const missingReferences = await findMissingLocalAssetReferences(resolvedOutput);
  for (const reference of missingReferences) {
    errors.push(`Unresolved local runtime asset reference: ${reference}`);
  }

  if (errors.length > 0) {
    throw new Error(`Production output validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }

  return actualFiles;
}

export async function buildProduction({
  sourceDirectory = REPOSITORY_ROOT,
  outputDirectory = PRODUCTION_OUTPUT_DIRECTORY,
  manifest,
} = {}) {
  const resolvedSource = path.resolve(sourceDirectory);
  const resolvedOutput = path.resolve(outputDirectory);
  const approvedAssets = manifest ?? await readApprovedAssets();

  if (resolvedOutput === resolvedSource || isWithin(resolvedOutput, resolvedSource)) {
    throw new Error("Production output must not replace or contain the source directory.");
  }

  await rm(resolvedOutput, { recursive: true, force: true });
  await mkdir(resolvedOutput, { recursive: true });

  try {
    for (const assetPath of approvedAssets.map(normalizeManifestPath)) {
      if (isProtectedPhase2Path(assetPath)) {
        throw new Error(`Protected Phase 2 path in production manifest: ${assetPath}`);
      }

      const sourcePath = path.resolve(resolvedSource, ...assetPath.split("/"));
      if (!isWithin(resolvedSource, sourcePath)) {
        throw new Error(`Production asset path escapes the source directory: ${assetPath}`);
      }

      let sourceStat;
      try {
        sourceStat = await lstat(sourcePath);
      } catch {
        throw new Error(`Missing required Phase 1 asset: ${assetPath}`);
      }
      if (!sourceStat.isFile()) {
        throw new Error(`Required Phase 1 asset is not a regular file: ${assetPath}`);
      }

      const outputPath = path.join(resolvedOutput, ...assetPath.split("/"));
      await mkdir(path.dirname(outputPath), { recursive: true });
      await copyFile(sourcePath, outputPath);
    }

    const files = await validateProductionOutput(resolvedOutput, approvedAssets);
    return { outputDirectory: resolvedOutput, fileCount: files.length };
  } catch (error) {
    await rm(resolvedOutput, { recursive: true, force: true });
    throw error;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const result = await buildProduction();
    console.log(`Production assets staged and validated: ${result.fileCount} files in ${result.outputDirectory}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
