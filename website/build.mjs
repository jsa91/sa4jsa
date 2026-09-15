import { readFile, writeFile, mkdir, cp, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import { katex } from '@mdit/plugin-katex';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceDir = path.join(root, 'utbildningen/html');
const output = path.join(root, 'dist');
const source = await readFile(path.join(sourceDir, 'index.md'), 'utf8');
const md = new MarkdownIt({ html: true }).use(katex, { throwOnError: true });
const escape = (text) => md.utils.escapeHtml(text);
const chapterPattern = /<details>\s*<summary><h2 id="([^"]+)">([^<]+)<\/h2><\/summary>([\s\S]*?)<\/details>/g;
const chapters = [...source.matchAll(chapterPattern)];
if (chapters.length !== 5) throw new Error('Expected five chapter sections in index.md');
const pages = [
  { file: 'index.html', title: 'Vad är en signal?', label: 'Introduktion', body: source.slice(0, chapters[0].index).replace(/^# .+\n/, '') },
  ...chapters.map((match) => ({
    file: `${match[1]}.html`, id: match[1], title: match[2],
    label: match[2].replace(/^Kapitel /, ''), body: match[3],
  })),
];
const footer = source.slice(chapters.at(-1).index + chapters.at(-1)[0].length).replace(/^\s*---\s*/, '');
const links = new Map(pages.filter((page) => page.id).map((page) => [page.id, `${page.file}#${page.id}`]));
const defaultLink = md.renderer.rules.link_open ?? ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet('href');
  if (href?.startsWith('#') && links.has(href.slice(1))) tokens[idx].attrSet('href', links.get(href.slice(1)));
  return defaultLink(tokens, idx, options, env, self);
};
md.renderer.rules.table_open = () => '<div class="table-scroll" tabindex="0" role="region" aria-label="Tabell"><table>\n';
md.renderer.rules.table_close = () => '</table></div>\n';

function demo(kind) {
  const title = kind === 'sine' ? 'Utforska sinusvågen' : 'Utforska tid och frekvens';
  return `<section class="demo" data-demo="${kind}" aria-labelledby="demo-title">
    <div class="eyebrow">Interaktiv demonstration</div><h2 id="demo-title">${title}</h2>
    <p>Ändra värdena och se hur signalen påverkas. Återställ för att börja om.</p>
    <div class="demo-app"><p>Aktivera JavaScript för att använda reglagen. Kapiteltexten och originalbilderna går att läsa ändå.</p></div>
  </section>`;
}

await mkdir(path.join(output, 'assets'), { recursive: true });
for (const [index, page] of pages.entries()) {
  // Remove spacer-only breaks, retaining meaningful inline breaks in the prose.
  const body = page.body.replace(/^\s*<br>\s*$/gm, '').replace(/\s*---\s*$/, '');
  let html = md.render(body);
  if (html.includes('katex-error')) throw new Error(`Invalid formula in ${page.title}`);
  if (index === 1 || index === 2) {
    const image = index === 1 ? 'sine_wave.png' : 'time_freq_domain.jpg';
    // Match only the image's containing block, avoiding earlier centered sections.
    const position = html.indexOf(`<img src="./${image}"`);
    const close = html.indexOf('</div>', position);
    if (position < 0 || close < 0) throw new Error(`Missing demo insertion point: ${image}`);
    html = html.slice(0, close + 6) + demo(index === 1 ? 'sine' : 'domains') + html.slice(close + 6);
  }
  const nav = pages.map((item, i) => `<a href="${item.file}"${i === index ? ' aria-current="page"' : ''}>${escape(item.label)}</a>`).join('');
  const prev = pages[index - 1];
  const next = pages[index + 1];
  const pager = `<nav class="pager" aria-label="Föregående och nästa sida">${prev ? `<a href="${prev.file}"><span>← Föregående</span>${escape(prev.label)}</a>` : '<span></span>'}${next ? `<a href="${next.file}"><span>Nästa →</span>${escape(next.label)}</a>` : '<a href="index.html"><span>Tillbaka till</span>Översikten</a>'}</nav>`;
  await writeFile(path.join(output, page.file), `<!doctype html>
<html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0d141e">
<title>${escape(page.title)} · SA4JSA</title><meta name="description" content="En introduktion till signaler, radio och kommunikation.">
<link rel="stylesheet" href="assets/katex/katex.min.css"><link rel="stylesheet" href="assets/site.css">
${index === 1 || index === 2 ? '<script type="module" src="assets/demos.mjs"></script>' : ''}</head>
<body><a class="skip-link" href="#innehall">Hoppa till innehållet</a>
<header class="site-header"><a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">∿</span> SA4JSA</a><span>Grunder i fysik &amp; radioteknik</span></header>
<div class="layout"><aside><nav class="chapters" aria-label="Utbildningens kapitel"><p class="eyebrow">Utbildningen</p>${nav}</nav></aside>
<main id="innehall"><div class="eyebrow">${index ? `Kapitel ${index} av 5` : 'Introduktion · 4 timmar'}</div>
<h1${page.id ? ` id="${page.id}"` : ''}>${escape(page.title.replace(/^Kapitel \d+: /, ''))}</h1>
<article>${html}</article>${pager}<footer>${md.render(footer)}</footer></main></div></body></html>`);
}
for (const name of await readdir(sourceDir)) {
  if (/\.(png|jpe?g|gif|svg|webp)$/i.test(name)) await cp(path.join(sourceDir, name), path.join(output, name));
}
for (const name of ['site.css', 'demos.mjs', 'signals.mjs']) await cp(path.join(root, 'website', name), path.join(output, 'assets', name));
const katexDir = path.dirname(fileURLToPath(import.meta.resolve('katex/package.json')));
await mkdir(path.join(output, 'assets/katex'), { recursive: true });
await cp(path.join(katexDir, 'dist/katex.min.css'), path.join(output, 'assets/katex/katex.min.css'), { recursive: true });
await cp(path.join(katexDir, 'dist/fonts'), path.join(output, 'assets/katex/fonts'), { recursive: true });
await cp(path.join(katexDir, 'LICENSE'), path.join(output, 'assets/katex/LICENSE'));
console.log(`Built ${pages.length} pages in ${output}`);
