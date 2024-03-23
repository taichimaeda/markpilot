import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version;

let manifest = JSON.parse(readFileSync("manifest.json"));
let versions = JSON.parse(readFileSync("versions.json"));

manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest));

versions[targetVersion] = manifest.minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions));
