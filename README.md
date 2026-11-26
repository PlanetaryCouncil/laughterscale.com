# laughterscale.com

An independent laboratory for comedic performance. Jokes measured 0–11, certified by the
Joke Regulation Authority, Inspectorate of Satire (fictitious, satirical).

## Structure

| File | Role |
| --- | --- |
| `jokes.json` | The corpus. The only file you edit to publish a joke. |
| `build.mjs` | Generates `index.html` from `jokes.json`. No dependencies. |
| `index.html`, `synthetic.html` | Generated output. Committed, so the folder deploys as-is. |
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

Optional `"image": { "src", "alt", "width", "height", "caption" }` renders an exhibit
under the joke. Images live in `img/`, named after the specimen id. Add `"thumb": true`
for a cropped thumbnail that opens in a lightbox (use it for tall screenshots).

Non-English specimens keep the original in `"text"` with `"lang"` (e.g. `"pl"`) and add an
English `"translation"`. See 013. A submission may carry `"images"` (exhibits, same shape as
`"image"`).

Specimens about real people get `"response": { "author", "quote", "url" }` (their own
words, linked; optional `"where"`, `"linkText"`; an array for several) and a `"disclaimer"`.
See 010.

A subject that files on its own behalf gets `"submission": { "author", "readings":
[{ "label", "value", "note" }], "paragraphs" }`, rendered verbatim. See 011. Machine
subjects are annotated SEL (Synthetic Expressive Laughter); the badge still scores the
joke's effect on human readers, never the teller's amusement.

Independent confirmation of an existing finding goes on that specimen as
`"replications": [{ "title", "date", "text", "image", "readings", "paragraphs" }]`, not as a
new specimen. The Inspectorate does not certify the same discovery twice. See 011. An optional
`"label"` renames the block, e.g. `"Follow-up reading"` for a re-measurement over time (010).

`"withdrawn": true` moves a specimen off the register onto `synthetic.html`, the annex of
jokes written by AI and self-scored. They stay on file, uncounted. Jokes the inspector writes
itself are never certified.

Valid bonuses: `Unexpected +1`, `Relatable +1`, `Timing +1`, `Originality +1`,
`Visual Aid +1`, `Slant Rhyme +0.5`, `Audience Amplifier x2`, `Repeat Value x2`, `Legendary x3`.

Specimens are sorted by score at build time — `id` is a permanent catalogue number,
not a position.

## House rules

- **11 is conferred, not computed.** Without the `Legendary` multiplier the instrument
  tops out at 10, however high the raw reading goes — the card shows the raw figure and
  where the needle stopped. Multipliers can therefore be awarded honestly without
  arithmetic filling the top rung by accident. Rung 11's own caption is "Legendary".
- **Legendary requires third-hand transmission.** Laughter from someone who encountered
  neither the joke nor anyone's first-hand reaction to it — only an account of the
  situation. Seeing someone laugh is `Audience Amplifier`; laughing at the retelling of
  it is `Legendary`. This is what keeps 11 rare.
- **Specimen 009 (Due Diligence) is the Gold Standard**, the upper reference, first
  holder of position 11. Optional `"designation"` renders a tag beside the specimen id.
- **Specimen 002 (the chicken) never moves.** It is the calibration standard, the lower reference. Its score
  is 1 by design, not by oversight.
- **Scores are honest.** The bureaucratic voice is a bit; the judgment underneath isn't.
  A register of straight 8s measures nothing.

## Preview

```bash
python3 -m http.server 8000
```

## Deploy

GitHub Pages from `main` at `/`, behind Cloudflare. Run `node build.mjs`, commit the
generated HTML, push.
