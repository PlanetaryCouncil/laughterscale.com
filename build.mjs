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
function score(joke) {
  const bonuses = joke.bonuses ?? [];
  const adds = bonuses.filter((b) => b.value.startsWith('+'));
  const mults = bonuses.filter((b) => !b.value.startsWith('+'));
  const summed = adds.reduce((t, b) => t + Number(b.value.slice(1)), joke.base);
  const raw = mults.reduce((t, b) => t * Number(b.value.replace(/[^\d.]/g, '')), summed);
  const capped = Math.min(raw, 11);
  return { raw, rung: SCALE[capped], overflow: raw > 11 };
}

const jokeCard = (joke) => {
  const { raw, rung, overflow } = score(joke);
  const adds = (joke.bonuses ?? [])
    .map(
      (b) => `<li><span class="bonus-tag">${esc(b.label)} <b>${esc(b.value)}</b></span>
            <span class="bonus-why">${esc(b.why)}</span></li>`
    )
    .join('\n          ');

  return `<article class="specimen" style="--rung:${rung.color}">
        <header class="specimen-head">
          <div class="specimen-id">Specimen ${esc(joke.id)}</div>
          <h3>${esc(joke.title)}</h3>
        </header>
        <blockquote>${esc(joke.text)}</blockquote>
        <div class="attrib">Submitted by ${esc(joke.submittedBy)}</div>
        <div class="verdict">
          <div class="badge">
            <span class="badge-num">${esc(raw)}${overflow ? '<sup>+</sup>' : ''}</span>
            <span class="badge-name">${esc(rung.name)}</span>
          </div>
          <div class="breakdown">
            <div class="math">Base <b>${esc(joke.base)}</b> <span class="dim">(${esc(joke.baseLabel)})</span></div>
            ${adds ? `<ul class="bonuses">\n          ${adds}\n          </ul>` : '<div class="dim">No bonuses awarded.</div>'}
          </div>
        </div>
        <footer class="note"><b>Inspector's note.</b> ${esc(joke.note)}</footer>
      </article>`;
};

const jokes = JSON.parse(readFileSync(new URL('./jokes.json', import.meta.url), 'utf8'));
const ranked = [...jokes].sort((a, b) => score(b).raw - score(a).raw);
const best = score(ranked[0]).raw;

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
    <p class="stamp">${jokes.length} specimens certified &middot; highest reading ${best} LOL units &middot; position 11 remains vacant</p>
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
    <h2>Position 11 &mdash; Vacant</h2>
    <p>No specimen has yet achieved <b>He Ran Out Of Oxygen And Died</b>. The Inspectorate does not expect to fill this position and is not accepting speculative applications.</p>
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
