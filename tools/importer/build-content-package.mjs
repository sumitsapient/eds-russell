#!/usr/bin/env node
/* eslint-disable no-console, no-restricted-syntax, max-len, import/no-extraneous-dependencies -- Node CLI tool, not browser code */
/*
 * Builds an AEM content package (Package Manager .zip) from the migrated
 * content/**\/*.plain.html pages, using the same html2md + md2jcr conversion
 * that AEM uses for Universal Editor (xwalk) projects.
 *
 * Usage:
 *   npm run build:json
 *   node tools/importer/build-content-package.mjs \
 *     [--site-root /content/eds-russell] [--dam-root /content/dam/eds-russell] [--version 1.0.0]
 *     [--skip home.plain.html]
 *
 * Output (dist/):
 *   eds-russell-content-<version>.zip  install via AEM Package Manager
 *   dam-upload/                        local images to upload to <dam-root> in AEM Assets
 */
import fs from 'node:fs';
import path from 'node:path';
import { html2md } from '@adobe/helix-html2md';
import { md2jcr } from '@adobe/helix-md2jcr';
import JSZip from 'jszip';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]]);
  return acc;
}, []));

const SITE_ROOT = (args['site-root'] || '/content/eds-russell').replace(/\/$/, '');
const DAM_ROOT = (args['dam-root'] || '/content/dam/eds-russell').replace(/\/$/, '');
const VERSION = args.version || '1.0.0';
const CONTENT_DIR = 'content';
const OUT_DIR = 'dist';
// Files to leave out of the package, e.g. --skip home.plain.html,draft.plain.html
const SKIP = new Set((args.skip || '').split(',').filter(Boolean));
const SILENT = {
  info() {}, debug() {}, trace() {}, warn() {}, error() {},
};

const models = JSON.parse(fs.readFileSync('component-models.json', 'utf8'));
const definition = JSON.parse(fs.readFileSync('component-definition.json', 'utf8'));
const filters = JSON.parse(fs.readFileSync('component-filters.json', 'utf8'));

function findPages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'images' ? [] : findPages(full);
    return entry.name.endsWith('.plain.html') && !SKIP.has(entry.name) ? [full] : [];
  });
}

const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function folderPage(title) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent" jcr:title="${escapeXml(title)}"/>
</jcr:root>
`;
}

const zip = new JSZip();
const damUploads = [];
const pagePaths = new Set();

for (const file of findPages(CONTENT_DIR)) {
  const rel = path.relative(CONTENT_DIR, file).replace(/\.plain\.html$/, '');
  const pageDir = path.dirname(file);
  let html = fs.readFileSync(file, 'utf8');

  // A paragraph holding only a linked image (e.g. the nav logo) becomes a Button component
  // in AEM, which drops the image. Split it into an image paragraph and a text link instead.
  html = html.replace(/<p>\s*<a ([^>]*)>\s*(<img [^>]*>)\s*<\/a>\s*<\/p>/g, (m, linkAttrs, img) => {
    const alt = (img.match(/alt="([^"]*)"/) || [])[1] || '';
    return `<p>${img}</p>\n<p><a ${linkAttrs}>${alt}</a></p>`;
  });

  // Point local images/... and ./images/... references at the DAM folder authors will upload them to
  html = html.replace(/src="(?:\.\/)?images\/([^"]+)"/g, (m, imgRel) => {
    damUploads.push({ from: path.join(pageDir, 'images', imgRel), to: imgRel });
    return `src="${DAM_ROOT}/${imgRel}"`;
  });

  // eslint-disable-next-line no-await-in-loop
  const md = await html2md(`<body><main>${html}</main></body>`, { log: SILENT });
  // eslint-disable-next-line no-await-in-loop
  const xml = await md2jcr(md, {
    models, definition, filters, log: SILENT,
  });
  zip.file(`jcr_root${SITE_ROOT}/${rel}/.content.xml`, xml.toString());
  pagePaths.add(rel);
  console.log(`page   ${SITE_ROOT}/${rel}`);
}

// Intermediate path segments (e.g. /us, /us/en) become simple pages so the Sites tree stays navigable
for (const rel of [...pagePaths]) {
  const segments = rel.split('/');
  for (let i = 1; i < segments.length; i += 1) {
    const parent = segments.slice(0, i).join('/');
    if (!pagePaths.has(parent)) {
      zip.file(`jcr_root${SITE_ROOT}/${parent}/.content.xml`, folderPage(segments[i - 1]));
      pagePaths.add(parent);
      console.log(`folder ${SITE_ROOT}/${parent}`);
    }
  }
}

// Images go into the same package as dam:Asset nodes, so one install adds pages and images
const MIME_TYPES = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};
const assets = new Map(damUploads.map((u) => [u.to, u]));
const assetFolders = new Set();
for (const { from, to } of assets.values()) {
  const assetDir = `jcr_root${DAM_ROOT}/${to}`;
  const mimeType = MIME_TYPES[path.extname(to).toLowerCase()] || 'application/octet-stream';
  zip.file(`${assetDir}/.content.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:dam="http://www.day.com/dam/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" jcr:primaryType="dam:Asset">
  <jcr:content jcr:primaryType="dam:AssetContent">
    <metadata jcr:primaryType="nt:unstructured" dc:format="${mimeType}"/>
    <renditions jcr:primaryType="nt:folder">
      <original/>
    </renditions>
  </jcr:content>
</jcr:root>
`);
  zip.file(`${assetDir}/_jcr_content/renditions/original`, fs.readFileSync(from));
  zip.file(`${assetDir}/_jcr_content/renditions/original.dir/.content.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" jcr:primaryType="nt:file">
  <jcr:content jcr:primaryType="nt:resource" jcr:mimeType="${mimeType}"/>
</jcr:root>
`);
  const segments = to.split('/').slice(0, -1);
  segments.forEach((s, i) => assetFolders.add(segments.slice(0, i + 1).join('/')));
}
// Subfolders (e.g. blog-article) are created as DAM folders; the DAM root itself is left as-is
for (const folder of assetFolders) {
  zip.file(`jcr_root${DAM_ROOT}/${folder}/.content.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="sling:Folder"/>
`);
}

// "update" mode adds/updates the migrated pages and images without deleting anything else
const roots = [...new Set([...pagePaths].map((p) => p.split('/')[0]))];
const damRoots = [...new Set([...assets.keys()].map((p) => p.split('/')[0]))];
zip.file('META-INF/vault/filter.xml', `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
${roots.map((r) => `  <filter root="${SITE_ROOT}/${r}" mode="update"/>`).join('\n')}
${damRoots.map((r) => `  <filter root="${DAM_ROOT}/${r}" mode="update"/>`).join('\n')}
</workspaceFilter>
`);
zip.file('META-INF/vault/properties.xml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
  <entry key="group">eds-russell</entry>
  <entry key="name">eds-russell-content</entry>
  <entry key="version">${VERSION}</entry>
  <entry key="description">Russell Investments POC pages migrated to Edge Delivery Services (Universal Editor)</entry>
</properties>
`);

fs.mkdirSync(path.join(OUT_DIR, 'dam-upload'), { recursive: true });
const zipPath = path.join(OUT_DIR, `eds-russell-content-${VERSION}.zip`);
fs.writeFileSync(zipPath, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
damUploads.forEach(({ from, to }) => {
  const dest = path.join(OUT_DIR, 'dam-upload', to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(from, dest);
});

// The same images as one zip, for anyone who prefers to upload them in AEM Assets by hand
const imagesZip = new JSZip();
assets.forEach(({ from, to }) => imagesZip.file(to, fs.readFileSync(from)));
const imagesZipPath = path.join(OUT_DIR, `eds-russell-images-${VERSION}.zip`);
fs.writeFileSync(imagesZipPath, await imagesZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));

console.log(`\npackage ${zipPath} (${pagePaths.size} pages, ${assets.size} images in ${DAM_ROOT})`);
console.log(`images  ${OUT_DIR}/dam-upload/ and ${imagesZipPath} (${assets.size} files) -> ${DAM_ROOT}`);
