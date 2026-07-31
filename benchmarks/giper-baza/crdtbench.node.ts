namespace $ {

	/**
	 * Adapter of Giper Baza for the `crdt-benchmarks` harness (github.com/dmonad/crdt-benchmarks).
	 *
	 * The harness drives a CRDT through a strictly synchronous API, while Baza leans on
	 * WebCrypto, which is promise-only. So the runner plugs in Node native Ed25519 here
	 * and this module keeps every other step of the write path free of suspended fibers.
	 * Nothing is stubbed out: units are really encoded, signed, packed, parsed and verified.
	 */
	export class $giper_baza_crdtbench extends $mol_object2 {

		/** Auth keys prepared by the runner. Key generation is pure rejection sampling, not a CRDT cost. */
		static auths = [] as string[]

		static auth_cursor = 0

		static auth_next() {
			const str = this.auths[ this.auth_cursor ++ % this.auths.length ]
			if( !str ) return $mol_fail( new Error( 'Auth pool is empty' ) )
			return $giper_baza_auth.from( str )
		}

		/** Independent `$` context with own Glob, Yard and Auth. One per document. */
		static isolate( auth: $giper_baza_auth ) {

			const $ = $$.$mol_ambient({})

			$.$giper_baza_mine = $giper_baza_mine_temp
			$.$giper_baza_land = $giper_baza_crdtbench_land

			class Yard extends $giper_baza_yard {}
			Yard.masters = $mol_const( [] as string[] )
			$.$giper_baza_yard = Yard

			class Auth extends $giper_baza_auth {
				static embryos = [] as string[]
				static override current() {
					return auth
				}
			}
			$.$giper_baza_auth = Auth

			class Glob extends $giper_baza_glob {
				static override $ = $
				static override lands_touched = new $mol_wire_set< string >()
			}
			$.$giper_baza_glob = Glob

			return $
		}

		/** Land shared by every document of the run, granted to any Peer. */
		static land_link = null as null | $giper_baza_link

		/** Full state of the freshly granted Land. Every document starts from it. */
		static land_boot = null as null | Uint8Array< ArrayBuffer >

		static setup() {

			if( this.land_link ) return

			const king = this.auth_next()
			const $ = this.isolate( this.auth_next() )
			$.$giper_baza_auth.embryos = [ king.toString() + king.toStringPrivate() ]

			/**
			 * Proof of Work per Seal is tuned by the rate nibble of the Peer rank. Sealing loops
			 * `while( seal.rate_min() > rate )`, and every value of `$giper_baza_rank_work_rates`
			 * is `<= 0xF`, so the `just` rate exits on the first signature: PoW is zero here.
			 * `late` (`0x0`) would be the opposite end, ~2**32 signatures per Seal.
			 */
			const land = $.$giper_baza_glob.land_grab([ [ null, $giper_baza_rank_post( 'just' ) ] ])

			this.land_link = land.link()
			this.land_boot = $giper_baza_pack.make( land.diff_parts() ).asArray().slice()

		}

		static doc( update: ( bin: Uint8Array< ArrayBuffer > )=> void ) {
			this.setup()
			return new $giper_baza_crdtbench_doc( update )
		}

	}


	/**
	 * Heads of three shared containers inside the benchmark Land.
	 * `text` and `list` are both `$giper_baza_list`, but they are separate Pawns,
	 * so the text benchmarks and the array benchmarks never share Units.
	 */
	export const $giper_baza_crdtbench_head = {
		text: $giper_baza_link.from_int( 2 ),
		list: $giper_baza_link.from_int( 3 ),
		dict: $giper_baza_link.from_int( 4 ),
	}


	/**
	 * Land without storage, bus and network, with synchronous encoding and signing.
	 * Also remembers Units posted since the last emitted Pack, so a delta costs O(delta)
	 * instead of a full `diff_units` rescan of the Land.
	 */
	export class $giper_baza_crdtbench_land extends $giper_baza_land {

		/** Units posted locally and not packed yet. */
		fresh_units = [] as $giper_baza_unit_base[]

		/** Neither storage, nor bus, nor master. */
		override sync() {
			this.loading()
			return this
		}

		override broadcast() {}

		override destructor() {}

		override post(
			lead: $giper_baza_link,
			head: $giper_baza_link,
			self: $giper_baza_link | null,
			vary: $giper_baza_vary_type,
			tag: keyof typeof $giper_baza_unit_sand_tag = 'term',
		) {
			const sand = super.post( lead, head, self, vary, tag )
			this.sand_seal_ready( sand )
			return sand
		}

		/** Lands are public here, so encoding of a Sand is just moving the open buffer to the Ball. */
		sand_seal_ready( sand: $giper_baza_unit_sand ) {
			if( !sand.encoded() ) sand.ball( sand._open! )
			this.fresh_units.push( sand )
		}

		override sand_encoding() {

			this.loading()

			for( const kids of this._sand.values() ) {
				for( const units of kids.values() ) {
					for( const sand of units.values() ) {
						if( sand._vary === undefined ) continue
						if( sand._ball ) continue
						sand.ball( sand._open! )
					}
				}
			}

		}

		override units_signing() {

			this.sand_encoding()

			for( let guard = 0; ; ++ guard ) {

				if( guard > 1024 ) return $mol_fail( new Error( 'Endless signing' ) )

				const news = this.units_unsigned()
				if( !news.length ) break

				this.units_seal( news )

			}

			this.fresh_units = []

		}

		/** Synchronous twin of `units_sign` limited to the given Units. */
		units_seal( units: readonly $giper_baza_unit_base[] ) {

			const auth = this.auth()
			const rate = $giper_baza_rank_rate_of( this.pass_rank( auth.pass() ) )
			const wide = Boolean( this.link().area().str )
			const seals = [] as $giper_baza_unit_seal[]

			for( const chunk of $mol_array_chunks( units.map( unit => unit.hash() ), $giper_baza_unit_seal_limit ) ) {

				const seal = $giper_baza_unit_seal.make( chunk.length, wide )

				seal.lord( auth.pass().lord() )
				seal.hash_list( chunk )
				seal._land = this

				do {
					seal.time_tick( this.faces.tick().time_tick )
					const sens = seal.shot().mix( wide ? this.link().lord() : this.link() )
					seal.sign( $giper_baza_crdtbench_sign( auth.signer(), sens ) )
				} while( seal.rate_min() > rate )

				for( const hash of seal.hash_list() ) seal.alive_items.add( hash.str )

				$giper_baza_unit_trusted_grant( seal )
				this.seal_add( seal )

				seals.push( seal )

			}

			return seals
		}

		/** Pack with everything posted since the previous call. */
		units_flush() {

			const fresh = this.fresh_units
			if( !fresh.length ) return null

			this.fresh_units = []

			const seals = this.units_seal( fresh )
			const pass = this.auth().pass()

			const faces = new $giper_baza_face_map
			const face = this.faces.get( pass.peer().str )
			if( face ) faces.set( pass.peer().str, face.clone() )

			return $giper_baza_pack.make([ [
				this.link().str,
				new $giper_baza_pack_part( [ pass, ... seals, ... fresh ], faces ),
			] ])

		}

		override sands_open( sands: readonly $giper_baza_unit_sand[] ) {
			for( const sand of sands ) {
				if( sand._open ) continue
				if( !sand._ball ) sand._ball = sand.big() ? this.mine().ball_load( sand ) : sand.data()
				sand._open = sand._ball
			}
			return undefined
		}

	}


	/** One benchmarked client: own `$` context, own Auth, shared Land. */
	export class $giper_baza_crdtbench_doc {

		readonly $: $
		readonly land: $giper_baza_crdtbench_land
		readonly text: $giper_baza_list
		readonly list: $giper_baza_list
		readonly dict: $giper_baza_dict

		depth = 0

		constructor(
			readonly update: ( bin: Uint8Array< ArrayBuffer > )=> void,
		) {

			const $ = this.$ = $giper_baza_crdtbench.isolate( $giper_baza_crdtbench.auth_next() )

			const link = $giper_baza_crdtbench.land_link!
			const land = this.land = $.$giper_baza_glob.Land( link ) as unknown as $giper_baza_crdtbench_land

			land.diff_apply( $giper_baza_pack.from( $giper_baza_crdtbench.land_boot! ).parts()[0][1].units )
			land.fresh_units = []

			this.text = land.Pawn( $giper_baza_list ).Head( $giper_baza_crdtbench_head.text )
			this.list = land.Pawn( $giper_baza_list ).Head( $giper_baza_crdtbench_head.list )
			this.dict = land.Pawn( $giper_baza_dict ).Head( $giper_baza_crdtbench_head.dict )

		}

		/** Emits a Pack with everything changed since the previous emit. */
		flush() {
			this.reap()
			if( this.depth ) return
			const pack = this.land.units_flush()
			if( pack ) this.update( pack.asArray() )
		}

		/**
		 * Every `@$mol_action` on the write path is a one-shot fiber, and $mol defers destruction
		 * of finished fibers to the next tick. The harness never gives the event loop a turn, so
		 * that queue would grow through the whole run — hundreds of thousands of dead fibers, tens
		 * of KB apiece, enough to blow the heap on [B2]. Draining it inline is exactly what the
		 * runtime does between ticks anyway.
		 *
		 * Only one-shot Tasks are collected. Memoized Atoms are the state of the document —
		 * `$giper_baza_glob.Land` among them — and dropping one would silently swap the Land
		 * under the running document instead of freeing garbage.
		 */
		reap() {

			const fibers = $mol_wire_fiber.reaping
			if( !fibers.size ) return

			$mol_wire_fiber.reaping = new Set

			for( const fiber of fibers ) {
				if( !( fiber instanceof $mol_wire_task ) ) continue
				if( !fiber.sub_empty ) continue
				fiber.destructor()
			}

		}

		transact( task: ()=> void ) {
			++ this.depth
			try {
				task()
			} finally {
				-- this.depth
			}
			this.flush()
		}

		state() {
			this.flush()
			return $giper_baza_pack.make( this.land.diff_parts() ).asArray()
		}

		apply( bin: Uint8Array< ArrayBuffer > ) {
			this.$.$giper_baza_glob.apply_pack( $giper_baza_pack.from( bin ) )
		}

		/**
		 * Text is a sequence of single characters, one Unit per character, like in every other
		 * CRDT of this suite. `$giper_baza_text` would be the idiomatic Pawn, but it keeps whole
		 * word tokens in the list and rewrites a token in place on edit, which is a coarser
		 * granularity than the harness measures.
		 *
		 * `from === to` leaves `$mol_reconcile` with the `insert` branch only, so every character
		 * gets a fresh `self_make()` Self and concurrent edits never collide on one Self.
		 */
		text_insert( index: number, str: string ) {
			this.text.splice( [ ... str ], index, index )
			this.flush()
		}

		/** `next` is empty, so `$mol_reconcile` takes the `drop` branch for every character. */
		text_delete( index: number, count: number ) {
			this.text.splice( [], index, index + count )
			this.flush()
		}

		text_read() {
			return this.text.items_vary().join( '' )
		}

		list_insert( index: number, items: readonly $giper_baza_vary_type[] ) {
			this.list.splice( items, index, index )
			this.flush()
		}

		list_delete( index: number, count: number ) {
			this.list.splice( [], index, index + count )
			this.flush()
		}

		list_read() {
			return [ ... this.list.items_vary() ]
		}

		dict_set( key: string, value: $giper_baza_vary_type ) {
			this.dict.dive( key, $giper_baza_atom, 'auto' )!.vary( value )
			this.flush()
		}

		dict_read() {
			const res = {} as Record< string, $giper_baza_vary_type >
			for( const key of this.dict.keys() ) {
				const atom = this.dict.dive( String( key ), $giper_baza_atom )
				if( atom ) res[ String( key ) ] = atom.vary()
			}
			return res
		}

	}


	/**
	 * Synchronous Ed25519 signing. WebCrypto has no synchronous API at all, so the runner
	 * replaces it by `node:crypto`. Same curve, same work, just without a Promise around it.
	 */
	export let $giper_baza_crdtbench_sign = (
		key: $mol_crypto2_signer,
		data: Uint8Array< ArrayBuffer >,
	): Uint8Array< ArrayBuffer > => $mol_fail( new Error( 'Synchronous signer is not installed' ) )

	/** Synchronous Ed25519 verification. */
	export let $giper_baza_crdtbench_verify = (
		key: $mol_crypto2_auditor,
		data: Uint8Array< ArrayBuffer >,
		sign: Uint8Array< ArrayBuffer >,
	): boolean => $mol_fail( new Error( 'Synchronous auditor is not installed' ) )

	export function $giper_baza_crdtbench_crypto(
		sign: typeof $giper_baza_crdtbench_sign,
		verify: typeof $giper_baza_crdtbench_verify,
	) {

		$giper_baza_crdtbench_sign = sign
		$giper_baza_crdtbench_verify = verify

		const signer = $mol_crypto2_signer.prototype as unknown as {
			sign( data: Uint8Array< ArrayBuffer > ): Uint8Array< ArrayBuffer >
		}
		signer.sign = function( data ) {
			return $giper_baza_crdtbench_sign( this as unknown as $mol_crypto2_signer, data )
		}

		const auditor = $mol_crypto2_auditor.prototype as unknown as {
			verify( data: Uint8Array< ArrayBuffer >, sign: Uint8Array< ArrayBuffer > ): boolean
		}
		auditor.verify = function( data, sign ) {
			return $giper_baza_crdtbench_verify( this as unknown as $mol_crypto2_auditor, data, sign )
		}

	}

}
