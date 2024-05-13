import { SecureThis } from "./type";

const DEFAULT_SECURE_SECTION = "secure-local";
const BASE_DIRECTORY = "secure-base";

/**
 * The secure-local constructor takes the name of the section you want to be manipulating data for.
 * @constructor
 */
var SecureLocal = function (this: SecureThis, section?: string) {
  this.section = section || DEFAULT_SECURE_SECTION;
};

SecureLocal.prototype.__getBaseDirectory = async function () {
  const opfsRoot = await navigator.storage.getDirectory();
  const baseDirectory = await opfsRoot.getDirectoryHandle(BASE_DIRECTORY, {
    create: true,
  });
  return baseDirectory;
};

/**
 * Retrieve items from a secure-local section using their keys.
 * @param {string | string[] | null} keys - The key or keys of the data you want to access
 */
SecureLocal.prototype.get = async function (
  this: SecureThis,
  keys?: string | string[] | null
) {
  if (typeof keys !== "string" && !Array.isArray(keys) && keys !== null)
    return {};
  const root = await this.__getBaseDirectory();
  const rootFile = await root.getFileHandle(this.section, { create: true });
  const blob = await rootFile.getFile();
  const content = await blob.text();
  let res = {} as Record<string, unknown>;

  if (!content.trim()) return res;
  try {
    const json = JSON.parse(content) as Record<string, any>;
    if (keys === null) res = json;
    else {
      const _keys = typeof keys === "string" ? [keys] : keys;
      for (const key of _keys) if (json[key]) res[key] = json[key];
    }
  } catch (e) {
    // keep quiet
  }
  return res;
};

SecureLocal.prototype.set = async function (
  this: SecureThis,
  items: { [key: string]: any }
) {
  const root = await this.__getBaseDirectory();
  const rootFile = await root.getFileHandle(this.section, { create: true });
  const writer = await rootFile.createWritable();
  const content = await this.get(null);
  for (const [key, value] of Object.entries(items)) content[key] = value;
  const data = JSON.stringify(content);
  writer.write(data);
  writer.close();
};

SecureLocal.prototype.remove = async function (
  this: SecureThis,
  keys: string | string[]
) {
  if (typeof keys !== "string" && !Array.isArray(keys)) return;
  const root = await this.__getBaseDirectory();
  const rootFile = await root.getFileHandle(this.section, { create: true });
  const writer = await rootFile.createWritable();
  const content = await this.get(null);
  const _keys = typeof keys === "string" ? [keys] : keys;
  for (const key of _keys) delete content[key];
  const data = JSON.stringify(content);
  writer.write(data);
  writer.close();
};

SecureLocal.prototype.clear = async function (this: SecureThis) {
  const opfsRoot = await navigator.storage.getDirectory();
  await opfsRoot.removeEntry(BASE_DIRECTORY, { recursive: true });
};

SecureLocal.prototype.onChange = async function (
  this: SecureThis,
  section: string,
  keys: string | string[] | null,
  changeHandler: (newValues: Promise<Record<string, any>>) => void
) {};

// CommonJS export
if (typeof exports === "object" && typeof module === "object") {
  module.exports = SecureLocal;
}

// Browser global export
if (typeof window !== "undefined") {
  window.SecureLocal = SecureLocal;
}
