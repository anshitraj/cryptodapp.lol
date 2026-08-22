import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../lib/bidding.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { nextTopBidUsd } = await import(`data:text/javascript,${encodeURIComponent(compiled)}`);

assert.equal(nextTopBidUsd(null), 1, "the first listing starts at $1");
assert.equal(nextTopBidUsd(1), 2, "a $1 leader requires $2 to take #1");
assert.equal(nextTopBidUsd(1.99), 2, "the next whole-dollar bid must beat fractional bids");
assert.equal(nextTopBidUsd(2), 3, "a $2 leader requires $3 to take #1");

console.log("Bid-floor regression checks passed");
