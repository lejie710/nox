// Asks every cited source's address whether it still answers, and writes a dated record.
//
//   npm run check:links
//
// This is a publication check, not a build step: the build never goes online, so another site's bad day cannot
// fail it. Run it before publishing and commit the record it writes (docs/link-check.md).
//
// Each address is requested once (GET, following redirects), a few at a time and never two at once to the
// same site. Nothing is saved from the pages. The verdicts:
//   ok          the address answered 200
//   dead        404 or 410, or the site's name does not resolve; the citation must be fixed
//   unverified  anything else (a refusal of automated requests, a server error, a timeout): look by hand
// The exit code is 1 when any address is dead, otherwise 0; unverified addresses are listed, not failed.
//
// A site that refuses automated requests cannot be checked from here. A person opens those addresses in a
// browser and writes the date beside each in scripts/links-seen-by-hand.json ({ "<address>": "YYYY-MM-DD" });
// the record then shows them as seen by hand on that date, apart from the ones this run verified.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { SOURCE_LIST } from "../src/model/sources.ts";

const TIMEOUT_MS = 25_000;
const PAUSE_MS = 1000; // between two requests to the same site
const AGENT = "nox-link-check/1.0 (checks the public sources a personal explainer cites)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ask(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": AGENT, accept: "text/html,*/*" },
    });
    await res.body?.cancel();
    return { status: res.status, final: res.url };
  } catch (e) {
    const cause = e?.cause?.code ?? e?.name ?? "error";
    return { status: 0, error: String(cause) };
  }
}

function verdict(r) {
  if (r.status === 200) return "ok";
  if (r.status === 404 || r.status === 410 || r.error === "ENOTFOUND") return "dead";
  return "unverified";
}

async function checkSite(urls) {
  const out = [];
  for (const url of urls) {
    let r = await ask(url);
    // One more try for a failure that may be passing (a timeout, a reset, a server error).
    if (verdict(r) === "unverified") {
      await sleep(2000);
      r = await ask(url);
    }
    out.push({ url, ...r, verdict: verdict(r) });
    await sleep(PAUSE_MS);
  }
  return out;
}

// One address may back several citations: ask it once.
const byUrl = new Map();
for (const s of SOURCE_LIST) byUrl.set(s.url, [...(byUrl.get(s.url) ?? []), s.id]);
const bySite = new Map();
for (const url of byUrl.keys()) {
  const h = new URL(url).host;
  bySite.set(h, [...(bySite.get(h) ?? []), url]);
}

console.log(`Checking ${byUrl.size} addresses behind ${SOURCE_LIST.length} sources, on ${bySite.size} sites...`);
const results = (await Promise.all([...bySite.values()].map(checkSite))).flat();

const of = (v) => results.filter((r) => r.verdict === v);
const ok = of("ok"),
  dead = of("dead"),
  unverified = of("unverified");
const moved = ok.filter((r) => r.final && r.final !== r.url);
const line = (r) =>
  `- ${r.url}\n  - cited as: ${byUrl.get(r.url).join(", ")}\n  - answer: ${r.status || r.error}${r.final && r.final !== r.url ? `, now at ${r.final}` : ""}`;

const seen = JSON.parse(
  await readFile(new URL("./links-seen-by-hand.json", import.meta.url), "utf8").catch(() => "{}"),
);
const byHand = unverified.filter((r) => seen[r.url]);
const open = unverified.filter((r) => !seen[r.url]);
const date = new Date().toISOString().slice(0, 10);
const report = [
  "# Link check",
  "",
  `Run on ${date} with \`npm run check:links\` (Node ${process.version}).`,
  "",
  `- Sources cited: ${SOURCE_LIST.length}`,
  `- Addresses asked: ${byUrl.size} (${[...bySite].map(([h, u]) => `${h} ${u.length}`).join(", ")})`,
  `- Answered: ${ok.length}`,
  `- Dead: ${dead.length}`,
  `- Refused this run, seen in a browser by a person: ${byHand.length}`,
  `- Not verified: ${open.length}`,
  "",
  ...(dead.length ? ["## Dead", "", ...dead.map(line), ""] : []),
  ...(byHand.length
    ? [
        "## Seen in a browser by a person",
        "",
        "The site refuses automated requests, so this run could not ask. A person opened each address on the date given.",
        "",
        ...byHand.map(
          (r) => `${line(r)}
  - seen by hand: ${seen[r.url]}`,
        ),
        "",
      ]
    : []),
  ...(open.length
    ? [
        "## Not verified",
        "",
        "The site did not give a plain answer to an automated request, and nobody has recorded opening the address. Each needs a look in a browser.",
        "",
        ...open.map(line),
        "",
      ]
    : []),
  ...(moved.length
    ? [
        "## Answered from another address",
        "",
        "The address redirects. It works; the citation could point at the new address.",
        "",
        ...moved.map(line),
        "",
      ]
    : []),
].join("\n");

await mkdir(new URL("../docs/", import.meta.url), { recursive: true });
await writeFile(new URL("../docs/link-check.md", import.meta.url), report);
console.log(
  `${ok.length} answered, ${dead.length} dead, ${byHand.length} seen by hand, ${open.length} not verified. Record: docs/link-check.md`,
);
for (const r of [...dead, ...open]) console.log(`  ${r.verdict}: ${r.url} (${r.status || r.error})`);
process.exit(dead.length ? 1 : 0);
