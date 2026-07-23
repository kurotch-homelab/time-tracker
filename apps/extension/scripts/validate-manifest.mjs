import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const extensionRoot = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(await readFile(resolve(extensionRoot, "manifest.json"), "utf8"));

if (manifest.manifest_version !== 3 || !manifest.action?.default_popup) {
  throw new Error("The extension must use Manifest V3 with a popup action.");
}
if (manifest.permissions.some((permission) => permission !== "activeTab")) {
  throw new Error("The extension must keep its minimal activeTab-only permission set.");
}
if (!manifest.host_permissions.every((host) => host.startsWith("https://"))) {
  throw new Error("The extension may only request HTTPS host permissions.");
}
console.info("Chrome extension manifest is valid.");
