import assert from "node:assert/strict";
import test from "node:test";

import {
  compareHeadings,
  extractHeadings,
  extractTitle,
  htmlToText,
  missingPhrases,
  normalizeText,
  parseArgs,
  renderMarkdown,
  reportExitCode,
} from "./validate-member-portal.mjs";

test("normalizes rich text and HTML entities", () => {
  const text = htmlToText("<p>Members&nbsp;&amp;&nbsp;Guests</p>");
  assert.equal(normalizeText(text), "members & guests");
  assert.deepEqual(missingPhrases(text, ["Members & Guests"]), []);
});

test("extracts article headings and reports catalog drift", () => {
  const headings = extractHeadings(
    "<h2>Link</h2><p>Body</p><h2>Text/HTML</h2><h3>New Card</h3>",
  );
  assert.deepEqual(headings, ["Link", "Text/HTML", "New Card"]);
  assert.deepEqual(compareHeadings(headings, ["Link", "Form", "Text/HTML"]), {
    missing: ["Form"],
    added: ["New Card"],
  });
});

test("extracts an HTML page title", () => {
  assert.equal(extractTitle("<title>VAY &amp; RPC</title>"), "VAY & RPC");
});

test("uses warning and failure exit codes", () => {
  assert.equal(reportExitCode([{ status: "PASS" }, { status: "SKIP" }]), 0);
  assert.equal(reportExitCode([{ status: "PASS" }, { status: "WARN" }]), 1);
  assert.equal(reportExitCode([{ status: "WARN" }, { status: "FAIL" }]), 2);
});

test("rejects incompatible CDP options", () => {
  assert.throws(
    () => parseArgs(["--skip-cdp", "--require-cdp"]),
    /cannot be used together/,
  );
});

test("renders a readable Markdown decision", () => {
  const markdown = renderMarkdown({
    generatedAt: "2026-07-15T00:00:00.000Z",
    baseline: { name: "Test", reviewedAt: "2026-07-15" },
    counts: { PASS: 1, WARN: 0, FAIL: 0, SKIP: 0 },
    exitCode: 0,
    results: [
      {
        status: "PASS",
        check: "Builder",
        finding: "Matched",
        details: [],
        source: null,
      },
    ],
    manualChecks: ["Test a real member account."],
  });

  assert.match(markdown, /1 PASS, 0 WARN, 0 FAIL, 0 SKIP/);
  assert.match(markdown, /\- \[ \] Test a real member account\./);
  assert.match(markdown, /Automated contracts match the baseline/);
});
