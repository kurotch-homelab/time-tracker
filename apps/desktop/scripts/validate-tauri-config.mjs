import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectDirectory = resolve(import.meta.dirname, "..");
const configPath = resolve(projectDirectory, "src-tauri", "tauri.conf.json");
const config = JSON.parse(await readFile(configPath, "utf8"));

if (!config.productName || !config.identifier || !config.build?.frontendDist) {
  throw new Error("Tauri configuration must define productName, identifier, and build.frontendDist.");
}
if (!/^([a-z][a-z0-9-]*\.)+[a-z][a-z0-9-]*$/.test(config.identifier)) {
  throw new Error("Tauri identifier must be a reverse-DNS identifier.");
}
await access(resolve(projectDirectory, "src-tauri", "Cargo.toml"));
await access(resolve(projectDirectory, "src-tauri", "capabilities", "default.json"));
console.info("Tauri configuration is valid.");
