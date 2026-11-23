import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildProduction, REPOSITORY_ROOT } from "./build-production.mjs";

const WRANGLER_VERSION = "4.166.0";
const WRANGLER_CONFIG = "wrangler.production.jsonc";

function runWranglerDeploy() {
  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(
    executable,
    [
      "--yes",
      `wrangler@${WRANGLER_VERSION}`,
      "deploy",
      "--config",
      WRANGLER_CONFIG,
      "--no-autoconfig",
    ],
    {
      cwd: REPOSITORY_ROOT,
      stdio: "inherit",
      shell: process.platform === "win32",
      windowsHide: true,
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Wrangler deployment failed with exit code ${result.status ?? "unknown"}.`);
  }
  return result.status;
}

export async function deployProduction({
  build = buildProduction,
  deploy = runWranglerDeploy,
} = {}) {
  await build();
  return deploy();
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    await deployProduction();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
