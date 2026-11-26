#!/usr/bin/env node
// Generates index.html from jokes.json. No dependencies: `node build.mjs`.

import { readFileSync, writeFileSync } from 'node:fs';

const SCALE = [
  { n: 0, name: 'Nope', blurb: 'No reaction. Keep going.', color: '#ff6a3d' },
  { n: 1, name: 'Smirk', blurb: 'A tiny twitch of amusement.', color: '#ffa53d' },
  { n: 2, name: 'Chuckle', blurb: 'That was pretty good.', color: '#ffd93d' },
  { n: 3, name: 'Hehe', blurb: 'You got me there.', color: '#b8e02f' },
  { n: 4, name: 'Giggle', blurb: "I wasn't expecting that!", color: '#4fd94f' },
  { n: 5, name: 'Laugh', blurb: "Now we're talking!", color: '#2ee6a8' },
  { n: 6, name: 'Belly Laugh', blurb: "Deep laughs. Can't stop.", color: '#22d3ee' },
  { n: 7, name: 'Busted a Gut', blurb: 'My stomach hurts!', color: '#4d8cff' },
  { n: 8, name: 'Crying Laughing', blurb: 'Tears. Snot. Zero control.', color: '#9a6bff' },
  { n: 9, name: 'Wheeze', blurb: "Can't breathe. Help.", color: '#c86bff' },
  { n: 10, name: 'Dead', blurb: "I can't... I'm gone.", color: '#ff5fa8' },
  { n: 11, name: 'Ran Out Of Oxygen', blurb: 'No air left. Legendary.', color: '#ff3df0' },
];

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Additive bonuses first, then multipliers — (base + adds) x mults.
// 11 is conferred, not computed: without Legendary the instrument tops out at 10.
function score(joke) {
  const bonuses = joke.bonuses ?? [];
  const adds = bonuses.filter((b) => b.value.startsWith('+'));
  const mults = bonuses.filter((b) => !b.value.startsWith('+'));
  const summed = adds.reduce((t, b) => t + Number(b.value.slice(1)), joke.base);
  const factors = mults.map((b) => Number(b.value.replace(/[^\d.]/g, '')));
  const raw = factors.reduce((t, f) => t * f, summed);
  const ceiling = bonuses.some((b) => b.label === 'Legendary') ? 11 : 10;
  const final = Math.min(raw, ceiling);
  const formula = `${adds.length ? `(${joke.base} + ${summed - joke.base})` : joke.base}${factors.map((f) => ` × ${f}`).join('')}`;
  return { raw, final, rung: SCALE[Math.floor(final)], capped: raw > final, ceiling, formula };
}

// "thumb": true shows a cropped thumbnail; the link opens the full image (in the lightbox when JS runs).
const exhibit = (img) => {
  if (!img) return '';
  const tag = `<img src="${esc(img.src)}" alt="${esc(img.alt)}" width="${esc(img.width)}" height="${esc(img.height)}" loading="lazy">`;
  return `<figure class="exhibit${img.thumb ? ' exhibit-thumb' : ''}">
          ${img.thumb ? `<a href="${esc(img.src)}" data-lightbox aria-label="Enlarge: ${esc(img.caption)}">${tag}</a>` : tag}
          <figcaption>${esc(img.caption)}${img.thumb ? ' <span class="dim">Click to enlarge.</span>' : ''}</figcaption>
        </figure>`;
};

const jokeCard = (joke) => {
  const { raw, final, rung, capped, ceiling, formula } = score(joke);
  const adds = (joke.bonuses ?? [])
    .map(
      (b) => `<li><span class="bonus-tag">${esc(b.label)} <b>${esc(b.value)}</b></span>
            <span class="bonus-why">${esc(b.why)}</span></li>`
    )
    .join('\n          ');

  const designation = joke.withdrawn ? 'Withdrawn' : joke.designation;
  return `<article class="specimen${joke.withdrawn ? ' withdrawn' : ''}" style="--rung:${rung.color}">
        <header class="specimen-head">
          <div class="specimen-id">Specimen ${esc(joke.id)}${designation ? ` <span class="designation">${esc(designation)}</span>` : ''}</div>
          <h3>${esc(joke.title)}</h3>
        </header>
        <blockquote${joke.lang ? ` lang="${esc(joke.lang)}"` : ''}>${esc(joke.text)}</blockquote>
        ${joke.translation ? `<p class="translation"><span class="dim">Translation.</span> ${esc(joke.translation)}</p>` : ''}
        ${exhibit(joke.image)}
        <div class="attrib">Submitted by ${esc(joke.submittedBy)}</div>
        <div class="verdict">
          <div class="badge">
            <span class="badge-num">${esc(final)}</span>
            <span class="badge-name">${esc(rung.name)}</span>
          </div>
          <div class="breakdown">
            <div class="math">Base <b>${esc(joke.base)}</b> <span class="dim">(${esc(joke.baseLabel)})</span></div>
            ${adds ? `<ul class="bonuses">\n          ${adds}\n          </ul>` : '<div class="dim">No bonuses awarded.</div>'}
            ${capped ? `<div class="ceiling">Raw reading ${esc(formula)} = <b>${esc(raw)}</b>. The needle stops at ${ceiling}${ceiling < 11 ? '; position 11 requires Legendary status' : ''}.</div>` : ''}
            ${joke.withdrawn ? '<div class="ceiling">Original reading, self-assessed by the machine that wrote the joke. Not certified.</div>' : ''}
          </div>
        </div>
        <footer class="note"><b>Inspector's note.</b> ${esc(joke.note)}</footer>
        ${joke.submission ? `<aside class="submission">
          <div class="submission-head"><b>Subject's own submission.</b> Filed by ${esc(joke.submission.author)}.</div>
          <dl class="readings">${joke.submission.readings.map((r) => `<div><dt>${esc(r.label)}</dt><dd><span>${esc(r.value)}</span> ${esc(r.note)}</dd></div>`).join('')}</dl>
          ${joke.submission.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
          ${(joke.submission.images ?? []).map(exhibit).join('')}
        </aside>` : ''}
        ${(joke.replications ?? []).map((r) => `<aside class="submission replication">
          <div class="submission-head"><b>${esc(r.label ?? 'Replication')}.</b> ${esc(r.title)}, ${esc(r.date)}.</div>
          <blockquote>${esc(r.text)}</blockquote>
          ${exhibit(r.image)}
          <dl class="readings">${r.readings.map((x) => `<div><dt>${esc(x.label)}</dt><dd><span>${esc(x.value)}</span> ${esc(x.note)}</dd></div>`).join('')}</dl>
          ${r.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
        </aside>`).join('')}
        ${[].concat(joke.response ?? []).map((r) => `<aside class="reply"><b>Right of reply.</b> ${esc(r.author)}${r.where ? `, ${esc(r.where)}` : ''}: &ldquo;${esc(r.quote)}&rdquo; <a href="${esc(r.url)}" rel="noopener">${esc(r.linkText ?? 'Read his full response')}</a>.</aside>`).join('\n        ')}
        ${joke.disclaimer ? `<aside class="card-disclaimer">${esc(joke.disclaimer)}</aside>` : ''}
      </article>`;
};

const jokes = JSON.parse(readFileSync(new URL('./jokes.json', import.meta.url), 'utf8'));
const rank = (list) => [...list].sort((a, b) => score(b).final - score(a).final || score(b).raw - score(a).raw);
const ranked = rank(jokes.filter((j) => !j.withdrawn));
const synthetic = rank(jokes.filter((j) => j.withdrawn));
const best = score(ranked[0]).final;
const holder = ranked.find((j) => score(j).final === 11);

const page = ({ title, description, body }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:title" content="LaughterScale">
<meta property="og:description" content="Jokes, measured 0 to 11. Officially absurd.">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='26' font-size='26'>%F0%9F%A6%A9</text></svg>">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="glow"></div>
<main>
${body}
  <footer class="disclaimer">
    <p><b>Disclaimer.</b> The Joke Regulation Authority, the Inspectorate of Satire, and Prof. F. L. Amingo, Ph.D. are fictitious entities created for satirical purposes. Any resemblance to real organisations is either coincidental, intentional, or hilariously inevitable.</p>
    <p class="creed">Laugh freely. Question everything. Scale responsibly.</p>
  </footer>

</main>
<dialog class="lightbox" aria-label="Exhibit">
  <form method="dialog"><button class="lightbox-close" aria-label="Close">&times;</button></form>
  <img alt="">
</dialog>
<script>
  const box = document.querySelector('.lightbox');
  const full = box.querySelector('img');
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-lightbox]');
    if (!link || !box.showModal) return;
    e.preventDefault();
    const thumb = link.querySelector('img');
    full.src = link.href;
    full.alt = thumb.alt;
    box.showModal();
  });
  box.addEventListener('click', (e) => { if (e.target === box || e.target === full) box.close(); });
</script>
</body>
</html>
`;

const home = page({
  title: 'LaughterScale — Measure the impact. Feel the effect.',
  description: 'An independent laboratory for comedic performance. Jokes measured 0 to 11, certified by the Joke Regulation Authority, Inspectorate of Satire.',
  body: `
  <header class="masthead">
    <p class="eyebrow">Independent Laboratory for Comedic Performance</p>
    <h1>The Laughter Scale</h1>
    <p class="tagline">Measure the impact. Feel the effect.</p>
    <p class="stamp">${ranked.length} specimens certified &middot; highest reading ${best} LOL units${best < 11 ? ' &middot; position 11 remains vacant' : ''}</p>
  </header>

  <section class="scale" aria-label="The scale, 0 to 11">
    ${SCALE.map(
      (r) => `<div class="rung" style="--rung:${r.color}">
      <div class="rung-n">${r.n}</div>
      <div class="rung-name">${esc(r.name)}</div>
      <div class="rung-blurb">${esc(r.blurb)}</div>
    </div>`
    ).join('\n    ')}
  </section>

  <section class="bonuses-key">
    <h2>Bonus multipliers</h2>
    <ul>
      <li>Unexpected <b>+1</b></li>
      <li>Relatable <b>+1</b></li>
      <li>Timing <b>+1</b></li>
      <li>Originality <b>+1</b></li>
      <li>Visual Aid <b>+1</b></li>
      <li>Slant Rhyme <b>+0.5</b></li>
      <li>Audience Amplifier <b>&times;2</b></li>
      <li>Repeat Value <b>&times;2</b></li>
      <li>Legendary <b>&times;3</b></li>
    </ul>
  </section>

  <section class="register">
    <h2>The register</h2>
    <p class="lede">Certified specimens, ranked by measured reading. Readings may decrease as you keep measuring.</p>
    <div class="specimens">
      ${ranked.map(jokeCard).join('\n      ')}
    </div>
    ${synthetic.length ? `<p class="annex-link"><a href="synthetic.html">Annex: ${synthetic.length} synthetic attempts</a> <span class="dim">Jokes written by AI, withdrawn from the register.</span></p>` : ''}
  </section>

  <section class="vacancy">
    ${holder
      ? `<h2>Position 11 &mdash; Filled</h2>
    <p><b>He Ran Out Of Oxygen And Died</b> is held by Specimen ${esc(holder.id)}, <i>${esc(holder.title)}</i>, by conferral. The Inspectorate did not expect to fill this position, and it was not filled by arithmetic: Legendary is awarded only on evidence of third-hand transmission, meaning laughter from someone who encountered neither the joke nor anyone's first-hand reaction to it.</p>
    <p>Further applications will be held to the same standard.</p>`
      : `<h2>Position 11 &mdash; Vacant</h2>
    <p>No specimen has yet achieved <b>He Ran Out Of Oxygen And Died</b>. The Inspectorate does not expect to fill this position and is not accepting speculative applications.</p>`}
    <p class="dim">Submissions: <a href="mailto:jokes@laughterscale.com">jokes@laughterscale.com</a></p>
  </section>
`,
});

const annex = page({
  title: 'Synthetic Attempts — LaughterScale',
  description: 'Jokes written by AI, scored by the same AI, and withdrawn from the LaughterScale register.',
  body: `
  <header class="masthead">
    <p class="eyebrow"><a href="./">The Laughter Scale</a> &middot; Annex</p>
    <h1>Synthetic Attempts</h1>
    <p class="tagline">Fake jokes, generated by AI.</p>
    <p class="stamp">${synthetic.length} specimens withdrawn &middot; certified readings 0</p>
  </header>

  <section class="register">
    <h2>Notice of withdrawal</h2>
    <p class="lede">These specimens were written by the Inspectorate's own instrument, a language model, which then scored them itself and awarded 6s and 7s. On review the Management ruled: <i>&ldquo;AI trying to simulate why something could be funny doesn't work.&rdquo;</i></p>
    <p class="lede">The Inspectorate concurs. A joke built to resemble a joke can carry every mechanism on the bonus sheet and still not make anyone laugh, and a machine that wrote a joke and marked it has no business certifying either. Compare Specimens 011 and 012, where the machine is the subject rather than the author. The specimens are kept below as the record, with their original self-assessed readings. None of them counts.</p>
    <div class="specimens">
      ${synthetic.map(jokeCard).join('\n      ')}
    </div>
    <p class="annex-link"><a href="./">Back to the register</a></p>
  </section>
`,
});

writeFileSync(new URL('./index.html', import.meta.url), home);
writeFileSync(new URL('./synthetic.html', import.meta.url), annex);
console.log(`Built index.html — ${ranked.length} certified, top reading ${best}; synthetic.html — ${synthetic.length} withdrawn.`);
