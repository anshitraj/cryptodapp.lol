import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../lib/listing-icon.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { faviconFallbackUrl } = await import(`data:text/javascript,${encodeURIComponent(compiled)}`);

assert.equal(
  faviconFallbackUrl("https://www.binance.com/"),
  "https://www.google.com/s2/favicons?domain=www.binance.com&sz=64",
  "a broken site favicon falls back to a valid favicon endpoint"
);
assert.equal(faviconFallbackUrl("not a URL"), null, "invalid links have no fallback URL");

console.log("Listing-icon regression checks passed");
