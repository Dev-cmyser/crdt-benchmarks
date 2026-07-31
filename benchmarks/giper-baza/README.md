# Giper Baza benchmark

```sh
npm start                              # B1 + B3, writes ../results.json
GIPER_BAZA_ALL=1 node --expose-gc run.js   # everything, including the skipped B2 / B4
node merge-bug.mjs                     # reproducer of the B2 merge bug
```

Methodology, what is stubbed out and why B2 / B4 are skipped: see the "Giper Baza" section of
the [root README](../../README.md).

## Files

| file | what it is |
| :- | :- |
| `factory.js` | the `CrdtFactory` / `AbstractCrdt` adapter, plus synchronous Ed25519 through `node:crypto` and the Auth key pool |
| `crdtbench.node.ts` | source of the MAM module the bundle is built from, kept here for reference |
| `giper-baza.cjs` | prebuilt bundle of Giper Baza + `crdtbench.node.ts`, committed so the benchmark runs without the MAM toolchain |
| `merge-bug.mjs` | minimal reproducer of the `sand_ordered` merge bug |
| `run.js`, `measure-bundle.js` | entry points used by the npm scripts |

## Rebuilding the bundle

`crdtbench.node.ts` is a MAM module. Inside a MAM workspace that has `giper/baza` checked out,
put it at `giper/baza/crdtbench/crdtbench.node.ts` and build from the workspace root:

```sh
npx mam giper/baza/crdtbench
cp giper/baza/crdtbench/-/node.js <this dir>/giper-baza.cjs
```

Never run `npx mam` from inside a subdirectory: it clones the workspace there.
