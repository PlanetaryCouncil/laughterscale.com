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

const exhibit = (img) =>
  img
    ? `<figure class="exhibit">
          <img src="${esc(img.src)}" alt="${esc(img.alt)}" width="${esc(img.width)}" height="${esc(img.height)}" loading="lazy">
          <figcaption>${esc(img.caption)}</figcaption>
        </figure>`
    : '';

const jokeCard = (joke) => {
  const { raw, final, rung, capped, ceiling, formula } = score(joke);
  const adds = (joke.bonuses ?? [])
    .map(
      (b) => `<li><span class="bonus-tag">${esc(b.label)} <b>${esc(b.value)}</b></span>
            <span class="bonus-why">${esc(b.why)}</span></li>`
    )
    .join('\n          ');

  return `<article class="specimen" style="--rung:${rung.color}">
        <header class="specimen-head">
          <div class="specimen-id">Specimen ${esc(joke.id)}${joke.designation ? ` <span class="designation">${esc(joke.designation)}</span>` : ''}</div>
          <h3>${esc(joke.title)}</h3>
        </header>
        <blockquote>${esc(joke.text)}</blockquote>
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
          </div>
        </div>
        <footer class="note"><b>Inspector's note.</b> ${esc(joke.note)}</footer>
      </article>`;
};

const jokes = JSON.parse(readFileSync(new URL('./jokes.json', import.meta.url), 'utf8'));
const ranked = [...jokes].sort((a, b) => score(b).final - score(a).final || score(b).raw - score(a).raw);
const best = score(ranked[0]).final;
const holder = ranked.find((j) => score(j).final === 11);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LaughterScale — Measure the impact. Feel the effect.</title>
<meta name="description" content="An independent laboratory for comedic performance. Jokes measured 0 to 11, certified by the Joke Regulation Authority, Inspectorate of Satire.">
<meta property="og:title" content="LaughterScale">
<meta property="og:description" content="Jokes, measured 0 to 11. Officially absurd.">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='26' font-size='26'>%F0%9F%A6%A9</text></svg>">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="glow"></div>
<main>

  <header class="masthead">
    <p class="eyebrow">Independent Laboratory for Comedic Performance</p>
    <h1>The Laughter Scale</h1>
    <p class="tagline">Measure the impact. Feel the effect.</p>
    <p class="stamp">${jokes.length} specimens certified &middot; highest reading ${best} LOL units${best < 11 ? ' &middot; position 11 remains vacant' : ''}</p>
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

  <footer class="disclaimer">
    <p><b>Disclaimer.</b> The Joke Regulation Authority, the Inspectorate of Satire, and Prof. F. L. Amingo, Ph.D. are fictitious entities created for satirical purposes. Any resemblance to real organisations is either coincidental, intentional, or hilariously inevitable.</p>
    <p class="creed">Laugh freely. Question everything. Scale responsibly.</p>
  </footer>

</main>
</body>
</html>
`;

writeFileSync(new URL('./index.html', import.meta.url), html);
console.log(`Built index.html — ${jokes.length} specimens, top reading ${best}.`);
