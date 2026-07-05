#!/usr/bin/env node
/**
 * Scans MODULES_DIR for installed modules and enables them in the world's
 * core.moduleConfiguration setting (LevelDB).
 *
 * Usage: node enable-modules.mjs <world-settings-db-path> <modules-dir>
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { Level } from "level";

const dbPath = process.argv[2];
const modulesDir = process.argv[3];

if (!dbPath || !modulesDir) {
  console.error("Usage: node enable-modules.mjs <db-path> <modules-dir>");
  process.exit(1);
}

// Discover module IDs from module.json files in each subdirectory
const moduleIds = readdirSync(modulesDir)
  .filter((entry) => {
    try {
      return statSync(resolve(modulesDir, entry)).isDirectory();
    } catch {
      return false;
    }
  })
  .map((dir) => {
    const manifestPath = resolve(modulesDir, dir, "module.json");
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      return manifest.id || null;
    } catch {
      return null;
    }
  })
  .filter(Boolean);

if (moduleIds.length === 0) {
  console.log("enable-modules | No modules found, nothing to do.");
  process.exit(0);
}

console.log(`enable-modules | Enabling modules: ${moduleIds.join(", ")}`);

const db = new Level(dbPath, { valueEncoding: "utf8" });
await db.open();

let found = false;

for await (const [key, value] of db.iterator()) {
  const doc = JSON.parse(value);
  if (doc.key === "core.moduleConfiguration") {
    const config =
      typeof doc.value === "string" ? JSON.parse(doc.value) : doc.value;

    for (const id of moduleIds) {
      config[id] = true;
    }

    doc.value = JSON.stringify(config);
    await db.put(key, JSON.stringify(doc));
    found = true;
    console.log("enable-modules | Updated existing moduleConfiguration.");
    break;
  }
}

if (!found) {
  // No moduleConfiguration entry exists yet — create one
  const config = {};
  for (const id of moduleIds) {
    config[id] = true;
  }
  const doc = {
    key: "core.moduleConfiguration",
    value: JSON.stringify(config),
    _id: "core.moduleConfiguration",
    _stats: { createdTime: null, modifiedTime: null, lastModifiedBy: null },
  };
  // Use the Foundry-style key format
  await db.put(`!settings!core.moduleConfiguration`, JSON.stringify(doc));
  console.log("enable-modules | Created new moduleConfiguration entry.");
}

await db.close();
console.log("enable-modules | Done.");
