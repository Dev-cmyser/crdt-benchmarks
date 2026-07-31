/*
 * Minimal reproducer of the merge bug that keeps [B2] out of the default run.
 *
 * A single stock `$giper_baza_land`. No sync, no packs, no signatures, no fibers.
 * Two peers edit the same text one after another. `$giper_baza_text.write` replaces a token
 * by posting a new Sand that reuses `self` of the previous one, so the Land ends up with two
 * Sands sharing one `self` under two different Lords. `$giper_baza_land.sand_ordered` keeps
 * `by_key` (self -> list node) and `by_self` (self -> winning node) in sync only while the
 * winner is met first. `$giper_baza_unit_sand.compare` orders same-second Sands by Lord, so
 * when the second peer's Lord sorts before the first one's, the loser node is linked first,
 * then evicted from `by_key` while `by_self` still points at it. Everything that leads on
 * that node is attached to a node that is no longer in the list, and falls out of the result.
 *
 * Deterministic: the outcome only depends on the lexicographic order of the two Lords.
 *
 *   node merge-bug.mjs
 */

import * as crypto from 'node:crypto'
import { createRequire } from 'node:module'

const $ = createRequire(import.meta.url)('./giper-baza.cjs')

const ctx = $.$mol_ambient.apply($, [{}]) // eslint-disable-line no-useless-call
ctx.$giper_baza_mine = $.$giper_baza_mine_temp

const HEAD = $.$giper_baza_link.from_int(2)

const makeAuth = () => {
  for (;;) {
    const jwk = crypto.generateKeyPairSync('ed25519').privateKey.export({ format: 'jwk' })
    if (Buffer.from(jwk.x, 'base64url')[0] !== 0xFF) continue
    const cipher = crypto.generateKeyPairSync('x25519').privateKey.export({ format: 'jwk' })
    const auth = $.$giper_baza_auth.from(jwk.x + cipher.x + jwk.d + cipher.d)
    if (/[æÆ]/.test(auth.pass().lord().str)) continue
    return auth
  }
}

const edit = (authA, authB) => {
  const land = $.$giper_baza_land.make({ $: ctx })
  land.auth = $.$mol_const(authA)
  // The repro needs no storage, no bus and no master.
  land.sync = function () { this.loading(); return this }

  land.join()
  land.give(authB.pass(), $.$giper_baza_rank_rule)

  const text = land.Pawn($.$giper_baza_text).Head(HEAD)

  text.write('init.', 0, 0)
  text.write('AAA ', 0, 0)

  land.auth = $.$mol_const(authB) // the second peer keeps editing the same text
  text.write('BBB ', 0, 0)

  return text.str()
}

let lost = 0
for (let i = 0; i < 6; i++) {
  const a = makeAuth()
  const b = makeAuth()
  for (const [x, y] of [[a, b], [b, a]]) {
    const text = edit(x, y)
    const ok = text === 'BBB AAA init.'
    if (!ok) lost++
    console.log(
      ok ? 'OK  ' : 'LOST',
      'first=' + x.pass().lord().str.slice(0, 6),
      'second=' + y.pass().lord().str.slice(0, 6),
      'second < first:', y.pass().lord().str < x.pass().lord().str,
      JSON.stringify(text)
    )
  }
}
console.log(`\n${lost} of 12 merges lost text. Expected in every run: "BBB AAA init."`)
process.exit(0)
