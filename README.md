# laughterscale.com

An independent laboratory for comedic performance. Jokes measured 0–11, certified by the
Joke Regulation Authority, Inspectorate of Satire (fictitious, satirical).

## Structure

| File | Role |
| --- | --- |
| `jokes.json` | The corpus. The only file you edit to publish a joke. |
| `build.mjs` | Generates `index.html` from `jokes.json`. No dependencies. |
| `index.html` | Generated output. Committed, so the folder deploys as-is. |
| `styles.css` | Hand-written, no build step. |

## Publishing a joke

Add an entry to `jokes.json`, then rebuild:

```bash
node build.mjs
```

The final score is computed by the build — additive bonuses first, then multipliers,
i.e. `(base + adds) × mults`. Don't store the total in the data; it would drift.

```json
{
  "id": "008",
  "title": "Short title",
  "text": "The joke itself.",
  "submittedBy": "Attribution",
  "base": 5,
  "baseLabel": "Laugh",
  "bonuses": [
    { "label": "Originality", "value": "+1", "why": "One line defending the bonus." },
    { "label": "Repeat Value", "value": "x2", "why": "Multipliers use x, not +." }
  ],
  "note": "Inspector's note. The editorial voice lives here."
}
```

Valid bonuses: `Unexpected +1`, `Relatable +1`, `Timing +1`, `Originality +1`,
`Visual Aid +1`, `Audience Amplifier x2`, `Repeat Value x2`, `Legendary x3`.

Specimens are sorted by score at build time — `id` is a permanent catalogue number,
not a position.

## House rules

- **Position 11 stays vacant.** The empty top of the scale is a load-bearing joke.
  Filling it costs more than it earns.
- **Specimen 002 (the chicken) never moves.** It is the calibration standard. Its score
  is 1 by design, not by oversight.
- **Scores are honest.** The bureaucratic voice is a bit; the judgment underneath isn't.
  A register of straight 8s measures nothing.

## Preview

```bash
python3 -m http.server 8000
```

## Deploy

Static — no server needed. Point the domain at the folder via Cloudflare Pages, Netlify,
Vercel, or GitHub Pages. Build command `node build.mjs`, output directory `.`.

Not currently a git repository. `git init` before wiring up a host.
