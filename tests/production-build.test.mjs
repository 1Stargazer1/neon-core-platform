import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildProduction,
  findMissingLocalAssetReferences,
  isProtectedPhase2Path,
  MANIFEST_PATH,
  REPOSITORY_ROOT,
  readApprovedAssets,
  validateProductionOutput,
} from "../scripts/build-production.mjs";
import { deployProduction } from "../scripts/deploy-production.mjs";

async function makeTemporaryDirectory(t, prefix) {
  const directory = await mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

function assertOperationExitsNonzero(operation, argumentsList, expectedError) {
  const moduleUrl = new URL("../scripts/build-production.mjs", import.meta.url).href;
  const source = [
    `import { ${operation} } from ${JSON.stringify(moduleUrl)};`,
    `try { await ${operation}(...${JSON.stringify(argumentsList)}); }`,
    "catch (error) { console.error(error.message); process.exitCode = 1; }",
  ].join("\n");
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", source], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  });

  assert.ifError(result.error);
  assert.equal(result.status, 1, `Expected a nonzero exit; stdout: ${result.stdout}; stderr: ${result.stderr}`);
  assert.match(result.stderr, expectedError);
}

test("manifest contains all Phase 1 pages, tools and runtime data", async () => {
  const assets = await readApprovedAssets();
  const htmlPages = assets.filter((assetPath) => assetPath.endsWith(".html"));
  const toolPages = htmlPages.filter((assetPath) => assetPath.startsWith("tools/"));

  assert.equal(htmlPages.length, 32);
  assert.equal(toolPages.length, 26);
  assert.ok(assets.includes("software.html"));
  assert.ok(assets.includes("js/software-directory.js"));
  assert.ok(assets.includes("data/software.json"));
  assert.ok(assets.includes("robots.txt"));
  assert.ok(assets.includes("sitemap.xml"));
  assert.ok(!assets.some(isProtectedPhase2Path));
});

test("build copies only approved files and resolves local runtime references", async (t) => {
  const temporaryDirectory = await makeTemporaryDirectory(t, "neon-production-build-");
  const outputDirectory = path.join(temporaryDirectory, "output");
  const manifest = await readApprovedAssets();

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, "stale.txt"), "stale output");
  const result = await buildProduction({ outputDirectory, manifest });
  const files = await validateProductionOutput(outputDirectory, manifest);

  assert.equal(result.fileCount, 76);
  assert.deepEqual(files, manifest);
  assert.deepEqual(await findMissingLocalAssetReferences(outputDirectory), []);

  for (const assetPath of manifest) {
    assert.deepEqual(
      await readFile(path.join(outputDirectory, ...assetPath.split("/"))),
      await readFile(path.join(REPOSITORY_ROOT, ...assetPath.split("/"))),
    );
  }
});

test("validation rejects protected Phase 2 asset injection", async (t) => {
  const temporaryDirectory = await makeTemporaryDirectory(t, "neon-production-injection-");
  const outputDirectory = path.join(temporaryDirectory, "output");
  await buildProduction({ outputDirectory });

  const injectedPaths = [
    "games.html",
    "games/pilot/index.html",
    "data/games.json",
    "data/schemas/games.schema.json",
    "data/source-policy.md",
    "js/games-directory.js",
    "css/gpu-directory.css",
  ];

  for (const injectedPath of injectedPaths) {
    const target = path.join(outputDirectory, ...injectedPath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, "injected test asset");
    await assert.rejects(
      validateProductionOutput(outputDirectory),
      new RegExp(`Protected Phase 2 path: ${injectedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
    );
    await rm(target, { force: true });
  }
});

test("validation rejects unexpected output and missing required source assets", async (t) => {
  const temporaryDirectory = await makeTemporaryDirectory(t, "neon-production-invalid-");
  const outputDirectory = path.join(temporaryDirectory, "output");
  await buildProduction({ outputDirectory });
  await writeFile(path.join(outputDirectory, "README.md"), "unexpected");
  assertOperationExitsNonzero(
    "validateProductionOutput",
    [outputDirectory],
    /Unexpected production output file: README\.md/,
  );
  await rm(path.join(outputDirectory, "README.md"));

  await writeFile(path.join(outputDirectory, "index.html"), '<script src="../games.html"></script>');
  await assert.rejects(
    validateProductionOutput(outputDirectory),
    /Local asset reference escapes the production output/,
  );

  const sourceDirectory = path.join(temporaryDirectory, "incomplete-source");
  const incompleteOutput = path.join(temporaryDirectory, "incomplete-output");
  await mkdir(sourceDirectory, { recursive: true });
  await writeFile(path.join(sourceDirectory, "index.html"), "<main>test</main>");
  assertOperationExitsNonzero(
    "buildProduction",
    [{ sourceDirectory, outputDirectory: incompleteOutput, manifest: ["index.html", "contact.html"] }],
    /Missing required Phase 1 asset: contact\.html/,
  );
});

test("manifest reader rejects malformed, incomplete, duplicate, traversal and Phase 2 manifests", async (t) => {
  const temporaryDirectory = await makeTemporaryDirectory(t, "neon-production-manifests-");
  const fixturePath = path.join(temporaryDirectory, "manifest.json");
  const original = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));

  await writeFile(fixturePath, "{ malformed json");
  assertOperationExitsNonzero("readApprovedAssets", [fixturePath], /Malformed production asset manifest JSON/);

  await writeFile(fixturePath, "{}");
  assertOperationExitsNonzero("readApprovedAssets", [fixturePath], /must contain exactly these groups/);

  const duplicate = structuredClone(original);
  duplicate.pages[0] = duplicate.pages[1];
  await writeFile(fixturePath, JSON.stringify(duplicate));
  assertOperationExitsNonzero("readApprovedAssets", [fixturePath], /duplicate paths/);

  const traversal = structuredClone(original);
  traversal.pages[0] = "../outside.html";
  await writeFile(fixturePath, JSON.stringify(traversal));
  assertOperationExitsNonzero("readApprovedAssets", [fixturePath], /Invalid production asset path/);

  const phaseTwo = structuredClone(original);
  phaseTwo.pages[0] = "games.html";
  await writeFile(fixturePath, JSON.stringify(phaseTwo));
  assertOperationExitsNonzero("readApprovedAssets", [fixturePath], /protected Phase 2 path/);
});

test("validation rejects protected Phase 2 asset with a nonzero process exit", async (t) => {
  const temporaryDirectory = await makeTemporaryDirectory(t, "neon-production-protected-");
  const outputDirectory = path.join(temporaryDirectory, "output");
  await buildProduction({ outputDirectory });
  const protectedPath = "data/games.json";
  const protectedFile = path.join(outputDirectory, ...protectedPath.split("/"));
  await mkdir(path.dirname(protectedFile), { recursive: true });
  await writeFile(protectedFile, "{}");

  assertOperationExitsNonzero(
    "validateProductionOutput",
    [outputDirectory],
    /Protected Phase 2 path: data\/games\.json/,
  );
});

test("deployment wrapper runs deploy only after a successful build", async () => {
  const calls = [];
  await deployProduction({
    build: async () => { calls.push("build"); },
    deploy: async () => { calls.push("deploy"); return 0; },
  });
  assert.deepEqual(calls, ["build", "deploy"]);

  calls.length = 0;
  await assert.rejects(
    deployProduction({
      build: async () => { calls.push("build"); throw new Error("validation failed"); },
      deploy: async () => { calls.push("deploy"); },
    }),
    /validation failed/,
  );
  assert.deepEqual(calls, ["build"]);
});
