const { createHash } = require('node:crypto');
const { existsSync, readFileSync, readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');

// Fails when a served document carries an inline script whose digest is not in
// the CSP. Usage:
//   node scripts/verify-csp.cjs                  # check built documents
//   node scripts/verify-csp.cjs http://host/page # check a live response

const INLINE_SCRIPT = /<script(?![^>]*\bsrc\s*=)(?![^>]*\btype\s*=\s*["']application\/(?:ld\+)?json["'])[^>]*>([\s\S]*?)<\/script>/gi;
const DIGEST = /'sha256-([^']+)'/g;

const root = process.cwd();

function digest(content) {
  return createHash('sha256').update(content, 'utf8').digest('base64');
}

function inlineDigests(html) {
  return [...html.matchAll(INLINE_SCRIPT)].map((match) => digest(match[1]));
}

function policyDigests(csp) {
  return new Set([...csp.matchAll(DIGEST)].map((match) => match[1]));
}

let failures = 0;

function fail(message) {
  console.error(`verify-csp: ${message}`);
  failures += 1;
  process.exitCode = 1;
}

function checkDocument(name, html, csp) {
  if (/\bnonce-/.test(csp)) {
    fail(`${name}: policy still issues a per-request nonce`);
  }
  const allowed = policyDigests(csp);
  if (allowed.size === 0) {
    fail(`${name}: policy contains no script digests`);
  }
  for (const value of inlineDigests(html)) {
    if (!allowed.has(value)) {
      fail(`${name}: inline script sha256-${value} is not authorized by the policy`);
    }
  }
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

async function fromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    fail(`${url}: HTTP ${response.status}`);
    return;
  }
  const csp = response.headers.get('content-security-policy');
  if (!csp) {
    fail(`${url}: response has no content-security-policy header`);
    return;
  }
  checkDocument(url, await response.text(), csp);
  if (failures === 0) {
    console.log(`verify-csp: ${url} inline scripts match the served policy`);
  }
}

function fromBuild() {
  const policyFile = join(root, '.next', 'csp-hashes.json');
  const appDir = join(root, '.next', 'server', 'app');
  if (!existsSync(policyFile) || !existsSync(appDir)) {
    fail('build artifacts are missing; run next build first');
    return;
  }

  const hashes = new Set(JSON.parse(readFileSync(policyFile, 'utf8')));
  const csp = `script-src 'self' ${[...hashes].map((hash) => `'sha256-${hash}'`).join(' ')}`;
  let documents = 0;
  let matched = new Set();

  for (const file of walk(appDir)) {
    if (!file.endsWith('.html')) {
      continue;
    }
    documents += 1;
    const html = readFileSync(file, 'utf8');
    checkDocument(file, html, csp);
    for (const value of inlineDigests(html)) {
      matched.add(value);
    }
  }

  if (documents === 0) {
    fail('no prerendered documents found');
  }
  for (const hash of hashes) {
    if (!matched.has(hash)) {
      fail(`policy digest sha256-${hash} matches no emitted inline script`);
    }
  }

  if (failures === 0) {
    console.log(`verify-csp: ${documents} document(s) match ${hashes.size} digest(s)`);
  }
}

const url = process.argv[2];
if (url) {
  fromUrl(url).catch((error) => fail(error instanceof Error ? error.message : String(error)));
} else {
  fromBuild();
}
