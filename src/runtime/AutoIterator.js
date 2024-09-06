
/**
 * @import
 */
import { _await } from '../util.js';
import Observer from '@webqit/observer';
import Autorun from './Autorun.js';
import Scope from './Scope.js';

export default class AutoIterator extends Autorun {

    rounds = new Map;

    constructor( context, type, spec, serial, scope, closure ) {
        spec.$closure = closure;
        super( context, type, spec, serial, scope );
        this.manage( () => {
            delete this.breakpoint;
            this.rounds.clear();
        } );
    }

    pseudorun( callback ) {
        this.runtime.iThread.unshift( this );
        return _await( callback(), returnValue => {
            this.runtime.iThread.pop();
            return returnValue;
        } );
    }

    createIterator() {
        if ( this.spec.kind === 'for-in' ) return ( function* () { for ( let key in this.iteratee ) yield key; } ).call( this );
        if ( this.spec.kind === 'for-of' ) return ( function* () { for ( let val of this.iteratee ) yield val; } ).call( this );
        return { next: () => ({ done: !this.pseudorun( () => this.spec.test( this ) ), }), };
    }

    closure() {
        if ( [ 'for-of', 'for-in' ].includes( this.spec.kind ) ) {
            [ this.production, this.iteratee ] = this.spec.parameters( this );
            this.iterator = this.createIterator();
            this.iterator.original = true;
            this.watchMode();
        } else {
            if ( this.spec.kind === 'for' ) { this.spec.init( this ); }
            this.iterator = this.createIterator();
        }
        this.iterate();
    }

    terminated() { return this.breakpoint && !this.breakpoint.flowControlApplied( 'continue', this.spec.label ) && this.breakpoint.flowControlApplied(); }
    advance() { if ( this.spec.kind === 'for' ) { this.pseudorun( () => this.spec.advance( this ) ); } }

    iterate() {
        this.iterating = true;
        const $test = () => !this.terminated()/* must come before */ && !( this.cursor = this.iterator.next() ).done;
        const $round = () => {
            const round = this.createRound( this.cursor.value );
            round.execute();
            this.advance();
        };
        if ( this.spec.kind === 'do-while' ) { do $round(); while ( $test() ); }
        else { while ( $test() ) $round(); }
        this.iterating = false;
    }

    createRound( production ) {
        const index = this.rounds.size, spec = { index };
        // The scope instance starts life with the variables that the iteration round should see.
        const state = [ 'for-in', 'for-of' ].includes( this.spec.kind ) ? { [ this.production ]: production } : { ...this.scope.state };
        const scope = new Scope( this.scope, 'round', state );
        this.scope.symbols.forEach( ( meta, name ) => { scope.symbols.set( name, meta ); } );
        const round = new Autorun( this, 'round', spec, this.serial, scope, this.spec.$closure );
        const key = this.spec.kind === 'for-in' ? production : index;
        this.rounds.set( key, round );
        if ( this.lastRound ) {
            this.lastRound.nextRound = round;
            round.prevRound = this.lastRound;
        }
        this.lastRound = round;
        return round;
    }

    watchMode() {
        if ( this.spec.static ) return;
        const handleMutations = ( mutations, currentCursor ) => {
            const deletions = new Set, extension = new Set;
            for ( const mutation of mutations ) {
                if ( Array.isArray( this.iteratee ) && mutation.key === 'length' ) continue;
                const production = this.spec.kind === 'for-in' ? mutation.key : mutation.value;
                const key = this.spec.kind === 'for-in' ? mutation.key : parseInt( mutation.key );
                const existingRound = this.rounds.get( key ); // Note that we're not using has()
                if ( existingRound ) {
                    // This is an existing round
                    Observer.set( existingRound.scope.state, this.production, production );
                    if ( mutation.type === 'delete' ) {
                        this.rounds.set( key, undefined ); // No actual deletions here as this.rounds.size is our index
                        if ( existingRound.prevRound ) { existingRound.prevRound.nextRound = existingRound.nextRound; }
                        if ( existingRound.nextRound ) { existingRound.nextRound.prevRound = existingRound.prevRound; }
                        // Fired above for the last time and now should die
                        deletions.add( existingRound );
                    }
                } else if ( mutation.type !== 'delete' && !mutation.isUpdate ) {
                    // This is a brand new entry
                    // Deletions and updates that didn't have an existing round above are obviously awaiting visit from a paused loop
                    if ( this.spec.kind === 'for-of' && this.iterator.original && !currentCursor.done ) continue; // A live iteration is going on
                    extension.add( production );
                }
            }
            this.runtime.on( 'reflection', () => {
                deletions.forEach( deletion => deletion.abort( true ) );
            }, { once: true } );
            if ( extension.size ) {
                this.iterator = ( function* ( parent ) {
                    yield* parent;
                    yield* extension;
                } )( this.iterator );
                if ( currentCursor.done ) { this.iterate(); }
            }
        };
        this.once( Observer.observe( this.iteratee, mutations => {
            _await( this.cursor, currentCursor => handleMutations( mutations, currentCursor ) );
        } ) );
    }
    
}