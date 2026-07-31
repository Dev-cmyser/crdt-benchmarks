/*
 * Why [B1.7], [B2.4] and [B4] are skipped.
 *
 * `$giper_baza_pawn.units()` calls `$giper_baza_land.sand_ordered`, which rebuilds the order of
 * the whole Pawn from scratch: it sorts every Sand of that head and relinks them through their
 * `lead` references. Every write invalidates it, so an edit costs a full pass over the Pawn, and
 * the pass itself is quadratic once the Sands stop arriving in `lead` order — which is what
 * deletions do, since a delete posts a tombstone that keeps the Self and rewrites the chain.
 *
 * Tombstones are never dropped from the Pawn, so the cost keeps growing after the deleted text
 * is gone: below, the document stays a few hundred characters wide while the time per edit grows
 * by an order of magnitude every time the edit count doubles.
 *
 *   node order-cost.mjs
 */

import { GiperBazaFactory, prepareAuths } from './factory.js'

prepareAuths(4)
const factory = new GiperBazaFactory()

console.log('edits  time      live chars  ms/edit')

for (const count of [125, 250, 500]) {
  const doc = factory.create(() => {})
  let text = ''

  const started = Date.now()

  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * (text.length + 1))

    if (text.length === index || i % 2 === 0) {
      const word = 'abcdefghij'.slice(0, 2 + (i % 9))
      text = text.slice(0, index) + word + text.slice(index)
      doc.insertText(index, word)
    } else {
      const length = Math.min(1 + (i % 9), text.length - index)
      if (length <= 0) continue
      text = text.slice(0, index) + text.slice(index + length)
      doc.deleteText(index, length)
    }
  }

  const elapsed = Date.now() - started

  if (doc.getText() !== text) throw new Error('Diverged')

  console.log(
    String(count).padStart(5),
    (elapsed + ' ms').padStart(9),
    String(text.length).padStart(11),
    (elapsed / count).toFixed(1).padStart(9)
  )
}

process.exit(0)
