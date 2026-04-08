import test from "node:test";
import assert from "node:assert/strict";
import { chunkText } from "../service";

test("chunkText splits long content", () => {
  const text = new Array(240).fill("token").join(" ");
  const chunks = chunkText(text, 80);
  assert.equal(chunks.length, 3);
});
