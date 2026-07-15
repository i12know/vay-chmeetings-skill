#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const DEFAULT_BASELINE = path.join(
  REPO_ROOT,
  "validation",
  "member-portal-baseline.json",
);
const DEFAULT_CDP = "http://127.0.0.1:9222";
const DEFAULT_TIMEOUT_MS = 15_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

const STATUS_ORDER = { PASS: 0, SKIP: 0, WARN: 1, FAIL: 2 };

function usage() {
  return `Usage: node scripts/validate-member-portal.mjs [options]

Options:
  --baseline <path>  Baseline JSON (default: validation/member-portal-baseline.json)
  --cdp <url>        Chrome DevTools endpoint (default: http://127.0.0.1:9222)
  --skip-cdp         Skip the optional live Builder inspection
  --require-cdp      Fail when Chrome or the Builder tab is unavailable
  --format <value>   markdown or json (default: markdown)
  --report <path>    Also write the rendered report to this path
  --timeout <ms>     Per-request timeout (default: 15000)
  --help             Show this help

Exit codes:
  0  Baseline still matches; optional checks may be skipped
  1  Drift or a review warning was detected
  2  A required endpoint/check failed
`;
}

function parseArgs(argv) {
  const options = {
    baseline: DEFAULT_BASELINE,
    cdp: DEFAULT_CDP,
    skipCdp: false,
    requireCdp: false,
    format: "markdown",
    report: null,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const takeValue = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[index];
    };

    if (arg === "--baseline") options.baseline = path.resolve(takeValue());
    else if (arg === "--cdp") options.cdp = takeValue().replace(/\/$/, "");
    else if (arg === "--skip-cdp") options.skipCdp = true;
    else if (arg === "--require-cdp") options.requireCdp = true;
    else if (arg === "--format") options.format = takeValue().toLowerCase();
    else if (arg === "--report") options.report = path.resolve(takeValue());
    else if (arg === "--timeout") options.timeoutMs = Number(takeValue());
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  if (!new Set(["markdown", "json"]).has(options.format)) {
    throw new Error("--format must be markdown or json");
  }
  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs < 1_000) {
    throw new Error("--timeout must be a number of at least 1000 milliseconds");
  }
  if (options.skipCdp && options.requireCdp) {
    throw new Error("--skip-cdp and --require-cdp cannot be used together");
  }

  return options;
}

function decodeHtmlEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function htmlToText(value) {
  return decodeHtmlEntities(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function extractHeadings(html) {
  return [...html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map((match) => htmlToText(match[1]).replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function extractTitle(html) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? htmlToText(match[1]).replace(/\s+/g, " ").trim() : "";
}

function missingPhrases(text, phrases = []) {
  const normalized = normalizeText(text);
  return phrases.filter((phrase) => !normalized.includes(normalizeText(phrase)));
}

function compareHeadings(actual, expected) {
  const actualMap = new Map(actual.map((item) => [normalizeText(item), item]));
  const expectedMap = new Map(expected.map((item) => [normalizeText(item), item]));
  return {
    missing: expected.filter((item) => !actualMap.has(normalizeText(item))),
    added: actual.filter((item) => !expectedMap.has(normalizeText(item))),
  };
}

function result(status, check, finding, details = [], source = null) {
  return { status, check, finding, details, source };
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkArticle(article, baseline, options) {
  const apiUrl = `${baseline.helpCenterApiBase}/${article.id}.json`;
  try {
    const response = await fetchWithTimeout(
      apiUrl,
      { headers: { Accept: "application/json", "User-Agent": USER_AGENT } },
      options.timeoutMs,
    );
    if (!response.ok) {
      return result(
        "FAIL",
        `Help Center: ${article.key}`,
        `Article API returned HTTP ${response.status}`,
        [],
        apiUrl,
      );
    }

    const payload = await response.json();
    const current = payload.article;
    if (!current || typeof current.body !== "string") {
      return result(
        "FAIL",
        `Help Center: ${article.key}`,
        "Article API response did not contain an article body",
        [],
        apiUrl,
      );
    }

    const details = [];
    if (current.title !== article.title) {
      details.push(`Title changed: '${article.title}' -> '${current.title}'`);
    }
    if (current.updated_at !== article.updatedAt) {
      details.push(
        `Updated timestamp changed: ${article.updatedAt} -> ${current.updated_at}`,
      );
    }

    const missing = missingPhrases(htmlToText(current.body), article.requiredPhrases);
    if (missing.length > 0) {
      details.push(`Missing expected statements: ${missing.join(" | ")}`);
    }

    if (article.expectedHeadings) {
      const headingDiff = compareHeadings(
        extractHeadings(current.body),
        article.expectedHeadings,
      );
      if (headingDiff.missing.length > 0) {
        details.push(`Missing headings/cards: ${headingDiff.missing.join(", ")}`);
      }
      if (headingDiff.added.length > 0) {
        details.push(`New headings/cards: ${headingDiff.added.join(", ")}`);
      }
    }

    return result(
      details.length > 0 ? "WARN" : "PASS",
      `Help Center: ${article.key}`,
      details.length > 0
        ? "Official documentation drift requires review"
        : `Matches article updated ${current.updated_at}`,
      details,
      current.html_url ?? apiUrl,
    );
  } catch (error) {
    return result(
      "FAIL",
      `Help Center: ${article.key}`,
      `Could not read article API: ${error.message}`,
      [],
      apiUrl,
    );
  }
}

async function checkPublicRoute(route, options) {
  try {
    const response = await fetchWithTimeout(
      route.url,
      {
        redirect: "follow",
        headers: { Accept: "text/html", "User-Agent": USER_AGENT },
      },
      options.timeoutMs,
    );
    const html = await response.text();
    const details = [];

    if (response.status !== route.expectedStatus) {
      details.push(`HTTP status changed: ${route.expectedStatus} -> ${response.status}`);
    }
    if (route.expectedFinalUrl && response.url !== route.expectedFinalUrl) {
      details.push(`Final URL changed: ${route.expectedFinalUrl} -> ${response.url}`);
    }

    const title = extractTitle(html);
    if (route.expectedTitle && title !== route.expectedTitle) {
      details.push(`Page title changed: '${route.expectedTitle}' -> '${title}'`);
    }

    const missing = missingPhrases(htmlToText(html), route.requiredPhrases);
    if (missing.length > 0) {
      details.push(`Missing public-page markers: ${missing.join(" | ")}`);
    }

    const status = response.ok ? (details.length > 0 ? "WARN" : "PASS") : "FAIL";
    return result(
      status,
      `Public route: ${route.key}`,
      details.length > 0
        ? "Public route drift requires review"
        : `${response.status} ${response.url}`,
      details,
      route.url,
    );
  } catch (error) {
    return result(
      "FAIL",
      `Public route: ${route.key}`,
      `Could not fetch route: ${error.message}`,
      [],
      route.url,
    );
  }
}

async function evaluateCdp(webSocketDebuggerUrl, expression, timeoutMs) {
  return await new Promise((resolve, reject) => {
    const socket = new WebSocket(webSocketDebuggerUrl);
    const commandId = 1;
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error(`CDP evaluation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const finish = (callback) => {
      clearTimeout(timer);
      socket.close();
      callback();
    };

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          id: commandId,
          method: "Runtime.evaluate",
          params: {
            expression,
            returnByValue: true,
            awaitPromise: true,
          },
        }),
      );
    });
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== commandId) return;
      if (message.error) {
        finish(() => reject(new Error(message.error.message)));
        return;
      }
      if (message.result?.exceptionDetails) {
        finish(() => reject(new Error("Builder evaluation raised an exception")));
        return;
      }
      finish(() => resolve(message.result?.result?.value));
    });
    socket.addEventListener("error", () => {
      finish(() => reject(new Error("Could not connect to the Builder CDP target")));
    });
  });
}

async function checkBuilderCdp(builder, options) {
  if (options.skipCdp) {
    return [result("SKIP", "Chrome DevTools", "Skipped by --skip-cdp")];
  }

  const unavailableStatus = options.requireCdp ? "FAIL" : "SKIP";
  try {
    const versionResponse = await fetchWithTimeout(
      `${options.cdp}/json/version`,
      { headers: { Accept: "application/json" } },
      options.timeoutMs,
    );
    if (!versionResponse.ok) {
      return [
        result(
          unavailableStatus,
          "Chrome DevTools",
          `Endpoint returned HTTP ${versionResponse.status}`,
          [],
          options.cdp,
        ),
      ];
    }
    const version = await versionResponse.json();

    const listResponse = await fetchWithTimeout(
      `${options.cdp}/json/list`,
      { headers: { Accept: "application/json" } },
      options.timeoutMs,
    );
    if (!listResponse.ok) {
      return [
        result(
          unavailableStatus,
          "Chrome DevTools",
          `Target list returned HTTP ${listResponse.status}`,
          [],
          options.cdp,
        ),
      ];
    }

    const targets = await listResponse.json();
    const target = targets.find(
      (item) =>
        item.type === "page" &&
        item.url?.includes(builder.urlIncludes) &&
        item.webSocketDebuggerUrl,
    );
    const endpointResult = result(
      "PASS",
      "Chrome DevTools",
      `${version.Browser ?? "Chrome"}; protocol ${version["Protocol-Version"] ?? "unknown"}`,
      [],
      options.cdp,
    );

    if (!target) {
      return [
        endpointResult,
        result(
          unavailableStatus,
          "Live Builder tab",
          `No page target contains ${builder.urlIncludes}`,
          ["Open Member Portal > Builder in the debug Chrome and run again."],
          options.cdp,
        ),
      ];
    }

    const state = await evaluateCdp(
      target.webSocketDebuggerUrl,
      `(() => ({
        title: document.title,
        url: location.href,
        readyState: document.readyState,
        text: document.body ? document.body.innerText : ""
      }))()`,
      options.timeoutMs,
    );
    if (!state || typeof state.text !== "string") {
      return [
        endpointResult,
        result(
          "FAIL",
          "Live Builder tab",
          "CDP returned no readable document state",
          [],
          target.url,
        ),
      ];
    }

    const details = [];
    if (!state.title.includes(builder.titleIncludes)) {
      details.push(
        `Builder title no longer contains '${builder.titleIncludes}': '${state.title}'`,
      );
    }
    if (!state.url.includes(builder.urlIncludes)) {
      details.push(`Builder URL changed: ${state.url}`);
    }

    const missing = missingPhrases(state.text, builder.requiredPhrases);
    if (missing.length > 0) {
      details.push(`Missing Builder controls: ${missing.join(", ")}`);
    }

    const normalizedBody = normalizeText(state.text);
    const missingCards = builder.requiredCards
      .filter(
        (aliases) =>
          !aliases.some((alias) => normalizedBody.includes(normalizeText(alias))),
      )
      .map((aliases) => aliases.join(" / "));
    if (missingCards.length > 0) {
      details.push(`Missing Builder card labels: ${missingCards.join(", ")}`);
    }

    return [
      endpointResult,
      result(
        details.length > 0 ? "WARN" : "PASS",
        "Live Builder tab",
        details.length > 0
          ? "Live Builder drift requires review"
          : `Read-only inspection matched ${state.title}`,
        details,
        state.url,
      ),
    ];
  } catch (error) {
    return [
      result(
        unavailableStatus,
        "Chrome DevTools",
        `Unavailable at ${options.cdp}: ${error.message}`,
        [
          options.requireCdp
            ? "Open the debug Chrome and Builder tab before rerunning."
            : "Public checks still ran; use --require-cdp for a pre-customization gate.",
        ],
        options.cdp,
      ),
    ];
  }
}

function countStatuses(results) {
  return results.reduce(
    (counts, item) => {
      counts[item.status] += 1;
      return counts;
    },
    { PASS: 0, WARN: 0, FAIL: 0, SKIP: 0 },
  );
}

function reportExitCode(results) {
  return results.reduce(
    (code, item) => Math.max(code, STATUS_ORDER[item.status] ?? 2),
    0,
  );
}

function escapeTable(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function renderMarkdown(report) {
  const lines = [
    "# ChMeetings Member Portal Validation Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Baseline: ${report.baseline.name} (reviewed ${report.baseline.reviewedAt})`,
    "",
    `Summary: ${report.counts.PASS} PASS, ${report.counts.WARN} WARN, ${report.counts.FAIL} FAIL, ${report.counts.SKIP} SKIP`,
    "",
    "| Status | Check | Finding |",
    "|---|---|---|",
  ];

  for (const item of report.results) {
    lines.push(
      `| ${item.status} | ${escapeTable(item.check)} | ${escapeTable(item.finding)} |`,
    );
  }

  const withDetails = report.results.filter(
    (item) => item.details.length > 0 || item.source,
  );
  if (withDetails.length > 0) {
    lines.push("", "## Details");
    for (const item of withDetails) {
      lines.push("", `### ${item.status}: ${item.check}`, "", item.finding);
      for (const detail of item.details) lines.push(`- ${detail}`);
      if (item.source) lines.push(`- Source: ${item.source}`);
    }
  }

  lines.push("", "## Manual Checks Still Required", "");
  for (const item of report.manualChecks) lines.push(`- [ ] ${item}`);
  lines.push(
    "",
    "## Decision",
    "",
    report.exitCode === 0
      ? "Automated contracts match the baseline. Complete the manual checks before publishing Builder changes."
      : report.exitCode === 1
        ? "Drift was detected. Review the changed official documentation or live behavior before customizing the portal."
        : "A required check failed. Resolve connectivity or endpoint failures before using this report as a customization gate.",
    "",
  );
  return lines.join("\n");
}

async function runValidation(options) {
  const baseline = JSON.parse(await readFile(options.baseline, "utf8"));
  if (baseline.schemaVersion !== 1) {
    throw new Error(`Unsupported baseline schemaVersion: ${baseline.schemaVersion}`);
  }

  const articleResults = await Promise.all(
    baseline.articles.map((article) => checkArticle(article, baseline, options)),
  );
  const routeResults = await Promise.all(
    baseline.publicRoutes.map((route) => checkPublicRoute(route, options)),
  );
  const cdpResults = await checkBuilderCdp(baseline.builder, options);
  const results = [...articleResults, ...routeResults, ...cdpResults];
  const exitCode = reportExitCode(results);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    baseline: {
      path: path.relative(REPO_ROOT, options.baseline).replaceAll(path.sep, "/"),
      name: baseline.name,
      reviewedAt: baseline.reviewedAt,
    },
    counts: countStatuses(results),
    exitCode,
    results,
    manualChecks: baseline.manualChecks,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }

  const report = await runValidation(options);
  const output =
    options.format === "json"
      ? `${JSON.stringify(report, null, 2)}\n`
      : `${renderMarkdown(report)}\n`;
  process.stdout.write(output);

  if (options.report) {
    await mkdir(path.dirname(options.report), { recursive: true });
    await writeFile(options.report, output, "utf8");
    process.stderr.write(`Report written to ${options.report}\n`);
  }

  process.exitCode = report.exitCode;
}

if (path.basename(process.argv[1] ?? "") === path.basename(SCRIPT_PATH)) {
  main().catch((error) => {
    process.stderr.write(`Validation failed: ${error.message}\n`);
    process.exitCode = 2;
  });
}

export {
  compareHeadings,
  extractHeadings,
  extractTitle,
  htmlToText,
  missingPhrases,
  normalizeText,
  parseArgs,
  renderMarkdown,
  reportExitCode,
  runValidation,
};
