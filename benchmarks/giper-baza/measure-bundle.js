#!/usr/bin/env node
/*
 * Giper Baza is not published to npm as a standalone library: it is a MAM module that is
 * bundled by its own build tool. `giper-baza.cjs` next to this script is exactly that bundle,
 * built by `npx mam giper/baza/crdtbench` inside the MAM workspace, and it carries both Giper
 * Baza and the part of the $mol runtime it needs. Unlike the other benchmarks here the bundle
 * is not run through rollup + terser, so the number below is an unminified upper bound.
 */
import { setBenchmarkResult, writeBenchmarkResultsToFile } from '../../js-lib/index.js'
import fs from 'fs'
import { gzipSync } from 'zlib'

const bundle = new URL('./giper-baza.cjs', import.meta.url)
const source = fs.readFileSync(bundle)

setBenchmarkResult('giper-baza', 'Version', 'mam@' + new Date(fs.statSync(bundle).mtime).toISOString().slice(0, 10))
setBenchmarkResult('giper-baza', 'Bundle size', `${source.length} bytes`)
setBenchmarkResult('giper-baza', 'Bundle size (gzipped)', `${gzipSync(source, { level: 9 }).length} bytes`)

writeBenchmarkResultsToFile('../results.json', () => true)
