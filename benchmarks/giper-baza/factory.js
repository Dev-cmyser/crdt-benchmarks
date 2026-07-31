import * as crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { AbstractCrdt, CrdtFactory } from '../../js-lib/index.js' // eslint-disable-line

// Prebuilt MAM bundle of Giper Baza together with the `$giper_baza_crdtbench` adapter.
// Source: hyoo-ru/mam -> giper/baza/crdtbench/crdtbench.node.ts, built by `npx mam giper/baza/crdtbench`.
// It is a CommonJS bundle that exports the whole `$` namespace of the framework.
const $ = createRequire(import.meta.url)('./giper-baza.cjs')

export const name = 'giper-baza'

/*
 * Giper Baza signs every batch of units with Ed25519. WebCrypto, which Baza uses in the
 * browser, exposes sign/verify as promises only, while this harness drives a CRDT through a
 * strictly synchronous API. So the very same curve is plugged in through `node:crypto`,
 * which does have a synchronous API. Nothing is skipped: every unit is still encoded,
 * signed, packed, parsed and verified.
 */

const privates = new WeakMap()
const publics = new WeakMap()

const signSync = (signer, data) => {
  let key = privates.get(signer)
  if (key === undefined) {
    key = crypto.createPrivateKey({
      key: { kty: 'OKP', crv: 'Ed25519', x: signer.toString(), d: signer.toStringPrivate() },
      format: 'jwk'
    })
    privates.set(signer, key)
  }
  return new Uint8Array(crypto.sign(null, data, key))
}

const verifySync = (auditor, data, sign) => {
  let key = publics.get(auditor)
  if (key === undefined) {
    key = crypto.createPublicKey({
      key: { kty: 'OKP', crv: 'Ed25519', x: auditor.toString() },
      format: 'jwk'
    })
    publics.set(auditor, key)
  }
  return crypto.verify(null, data, key, sign)
}

/*
 * GIPER_BAZA_NO_SIGN=1 replaces Ed25519 by a constant Seal signature that always verifies.
 * This is NOT a configuration Baza supports — a Seal is mandatory for every foreign Unit — it
 * only exists to attribute the running time between the CRDT layer and the signatures. Every
 * other step (encoding, sealing, packing, parsing, rights checks) stays exactly the same.
 */
const fakeSign = new Uint8Array(64)

$.$giper_baza_crdtbench_crypto(
  process.env.GIPER_BAZA_NO_SIGN ? () => fakeSign : signSync,
  process.env.GIPER_BAZA_NO_SIGN ? () => true : verifySync
)

/**
 * A Baza Auth key is an Ed25519 pair plus an X25519 pair. The public Ed25519 part must start
 * with 0xFF, because that byte is how a Pass is discriminated inside a Pack, so keys are found
 * by rejection sampling (~256 tries). That is identity setup, not a CRDT operation, so the pool
 * is prepared once before the benchmarks start and reused by every document.
 *
 * @param {number} count
 */
export const prepareAuths = (count) => {
  const auths = []
  while (auths.length < count) {
    let jwk = null
    for (;;) {
      jwk = crypto.generateKeyPairSync('ed25519').privateKey.export({ format: 'jwk' })
      if (Buffer.from(jwk.x, 'base64url')[0] === 0xFF) break
    }
    const cipher = crypto.generateKeyPairSync('x25519').privateKey.export({ format: 'jwk' })
    const serial = jwk.x + cipher.x + jwk.d + cipher.d
    // Baza skips lords whose id contains the base64ae specific letters.
    if (/[æÆ]/.test($.$giper_baza_auth.from(serial).pass().lord().str)) continue
    auths.push(serial)
  }
  $.$giper_baza_crdtbench.auths = auths
}

/**
 * @implements {CrdtFactory}
 */
export class GiperBazaFactory {
  /**
   * @param {function(Uint8Array):void} updateHandler
   */
  create (updateHandler) {
    return new GiperBazaCRDT(updateHandler)
  }

  /**
   * @param {function(Uint8Array):void} updateHandler
   * @param {Uint8Array} bin
   * @return {AbstractCrdt}
   */
  load (updateHandler, bin) {
    const crdt = new GiperBazaCRDT(updateHandler)
    crdt.applyUpdate(bin)
    return crdt
  }

  getName () {
    return name
  }
}

/**
 * @implements {AbstractCrdt}
 */
export class GiperBazaCRDT {
  /**
   * @param {function(Uint8Array):void} updateHandler
   */
  constructor (updateHandler) {
    this.doc = $.$giper_baza_crdtbench.doc(updateHandler)
  }

  /**
   * @return {Uint8Array}
   */
  getEncodedState () {
    return this.doc.state()
  }

  /**
   * @param {Uint8Array} update
   */
  applyUpdate (update) {
    this.doc.apply(update)
  }

  /**
   * @param {number} index
   * @param {Array<any>} elems
   */
  insertArray (index, elems) {
    this.doc.list_insert(index, elems)
  }

  /**
   * @param {number} index
   * @param {number} len
   */
  deleteArray (index, len) {
    this.doc.list_delete(index, len)
  }

  /**
   * @return {Array<any>}
   */
  getArray () {
    return this.doc.list_read()
  }

  /**
   * @param {number} index
   * @param {string} text
   */
  insertText (index, text) {
    this.doc.text_insert(index, text)
  }

  /**
   * @param {number} index
   * @param {number} len
   */
  deleteText (index, len) {
    this.doc.text_delete(index, len)
  }

  /**
   * @return {string}
   */
  getText () {
    return this.doc.text_read()
  }

  /**
   * @param {function (AbstractCrdt): void} f
   */
  transact (f) {
    this.doc.transact(() => f(this))
  }

  /**
   * @param {string} key
   * @param {any} val
   */
  setMap (key, val) {
    this.doc.dict_set(key, val)
  }

  /**
   * @return {Object<string, any>}
   */
  getMap () {
    return this.doc.dict_read()
  }
}
