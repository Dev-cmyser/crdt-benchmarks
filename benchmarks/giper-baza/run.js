import { GiperBazaFactory, prepareAuths } from './factory.js'
import { runBenchmarks, writeBenchmarkResultsToFile } from '../../js-lib/index.js'

// [B3] spins up 20√N concurrent clients and every one of them needs its own Auth key.
prepareAuths(1600)

/*
 * Skipped by default, see the "Giper Baza" section of the root README. All three hit the same
 * wall: `$giper_baza_land.sand_ordered` rebuilds the order of a Pawn from scratch on every
 * write and is quadratic in the number of Sands it holds, tombstones included. Text is a
 * character sequence here, so a delete-heavy trace piles up Sands fast and the total cost grows
 * with the cube of the edit count.
 *
 * [B1.7] / [B2.4] mix inserts with deletes and do not finish.
 * [B4] / [B4x100] replay a 259,778 edit trace and do not finish.
 *
 * Set GIPER_BAZA_ALL=1 to run everything anyway.
 */
const skipped = /^\[(B1\.7|B2\.4|B4)/
const filter = process.env.GIPER_BAZA_ALL
  ? (/** @type {string} */ _testName) => true
  : (/** @type {string} */ testName) => !skipped.test(testName)

;(async () => {
  await runBenchmarks(new GiperBazaFactory(), filter)
  writeBenchmarkResultsToFile('../results.json', (/** @type {string} */ _testName) => true)
})()
