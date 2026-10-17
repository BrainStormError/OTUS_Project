const { createHash } = require('node:crypto');
const { existsSync, readFileSync, readdirSync, statSync, writeFileSync } = require('node:fs');
const { join, relative } = require('node:path');

// Records the digest of every inline script the build actually emitted, so the
// production CSP can authorize exactly those scripts without a per-request
// nonce. Run after `next build`; the policy is fixed for the build.

const root = process.cwd();
const appDir = join(root, '.next', 'server', 'app');
const output = join(root, '.next', 'csp-hashes.json');

const INLINE_SCRIPT = /<script(?![^>]*\bsrc\s*=)(?![^>]*\btype\s*=\s*["']application\/(?:ld\+)?json["'])[^>]*>([\s\S]*?)<\/script>/gi;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function digest(content) {
  return createHash('sha256').update(content, 'utf8').digest('base64');
}

function main() {
  if (!existsSync(appDir)) {
    console.error('csp-hashes: .next/server/app is missing; run next build first');
    process.exit(1);
  }

  const hashes = new Set();
  let documents = 0;

  for (const file of walk(appDir)) {
    if (!file.endsWith('.html')) {
      continue;
    }
    documents += 1;
    const html = readFileSync(file, 'utf8');
    for (const match of html.matchAll(INLINE_SCRIPT)) {
      hashes.add(digest(match[1]));
    }
  }

  if (documents === 0) {
    console.warn('csp-hashes: no prerendered documents found; policy will allow no inline script');
  }

  const list = [...hashes].sort();
  writeFileSync(output, `${JSON.stringify(list, null, 2)}\n`);
  console.log(
    `csp-hashes: ${list.length} inline script digest(s) from ${documents} document(s) -> ${relative(root, output)}`,
  );
}

main();
