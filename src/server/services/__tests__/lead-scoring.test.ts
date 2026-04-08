import test from "node:test";
import assert from "node:assert/strict";
import { scoreLead, needsEscalation } from "../lead-scoring";

test("scoreLead increases for senior title and referral", () => {
  const result = scoreLead({
    title: "VP Marketing",
    source: "referral",
    company: "Veridian AI",
  });

  assert.ok(result.score >= 70);
  assert.ok(result.confidence > 0.6);
});

test("needsEscalation triggers for pricing or max turns", () => {
  assert.equal(needsEscalation("pricing", 1), true);
  assert.equal(needsEscalation("interested", 6), true);
  assert.equal(needsEscalation("interested", 1), false);
});
