# Giper Baza benchmark

```sh
npm start                                     # writes ../results.json
GIPER_BAZA_ALL=1 node --expose-gc run.js      # everything, including the skipped [B1.7] / [B2.4] / [B4]
GIPER_BAZA_NO_SIGN=1 node --expose-gc run.js  # same, with the Ed25519 Seal stubbed out
node merge-bug.mjs                            # reproducer of the sand_ordered merge bug
```

Text is a sequence of single characters: one Sand per character in a `$giper_baza_list`, the
same granularity every other CRDT in this suite uses. `$giper_baza_text` is the idiomatic Pawn
for text in Baza, but it stores whole word tokens and rewrites a token in place on edit, which
measures something else — see the "Giper Baza" section of the [root README](../../README.md).

Proof of work is zero in this benchmark: the shared Land grants
`$giper_baza_rank_post('just')`, and at the `just` rate the sealing loop
`while (seal.rate_min() > rate)` always exits on the first signature.

Methodology, what is stubbed out and why [B1.7] / [B2.4] / [B4] are skipped: see the root README.

## Files

| file | what it is |
| :- | :- |
| `factory.js` | the `CrdtFactory` / `AbstractCrdt` adapter, plus synchronous Ed25519 through `node:crypto` and the Auth key pool |
| `crdtbench.node.ts` | source of the MAM module the bundle is built from, kept here for reference |
| `giper-baza.cjs` | prebuilt bundle of Giper Baza + `crdtbench.node.ts`, committed so the benchmark runs without the MAM toolchain |
| `merge-bug.mjs` | minimal reproducer of the `sand_ordered` merge bug on the word token path |
| `run.js`, `measure-bundle.js` | entry points used by the npm scripts |

## Rebuilding the bundle

`crdtbench.node.ts` is a MAM module. Inside a MAM workspace that has `giper/baza` checked out,
put it at `giper/baza/crdtbench/crdtbench.node.ts` and build from the workspace root:

```sh
npx mam giper/baza/crdtbench
cp giper/baza/crdtbench/-/node.js <this dir>/giper-baza.cjs
```

Never run `npx mam` from inside a subdirectory: it clones the workspace there.
