import { GiperBazaFactory, prepareAuths } from './factory.js'
import { runBenchmarks, writeBenchmarkResultsToFile } from '../../js-lib/index.js'

// [B3] spins up 20√N concurrent clients and every one of them needs its own Auth key.
prepareAuths(1600)

/*
 * [B2] and [B4] are skipped by default, see the "Giper Baza" section of the root README.
 *
 * [B2] hits a merge bug in `$giper_baza_land.sand_ordered`: when two peers edit the same
 *      token and the second peer's Lord sorts before the first one's, part of the text is
 *      dropped. `node merge-bug.mjs` reproduces it on stock Baza in a dozen lines.
 * [B4] Baza re-sorts every Sand of a Pawn on each write, so replaying the 259,778 edit trace
 *      grows superlinearly: 1k edits 0.2 s, 2k 1.0 s, 4k 9.5 s. The full trace does not finish.
 *
 * Set GIPER_BAZA_ALL=1 to run everything anyway.
 */
const skipped = /^\[(B2|B4)/
const filter = process.env.GIPER_BAZA_ALL
  ? (/** @type {string} */ _testName) => true
  : (/** @type {string} */ testName) => !skipped.test(testName)

;(async () => {
  await runBenchmarks(new GiperBazaFactory(), filter)
  writeBenchmarkResultsToFile('../results.json', (/** @type {string} */ _testName) => true)
})()
