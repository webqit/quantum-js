
/**
 * @import
 */
import Observer from '@webqit/observer';
import Autorun from './Autorun.js';
import Scope from './Scope.js';

export default class AutoIteration extends Autorun {

    rounds = new Map;

    constructor( context, type, spec, serial, scope, closure ) {
        const async = closure.constructor.name === 'AsyncFunction';
        if ( spec.iteratee ) {
            spec.$closure = closure;
            closure = async ? async () => { await this.iterate(); } : () => { this.iterate(); };
        }
        super( context, type, spec, serial, scope, closure );
        this.async = async;
        this.manage( () => {
            delete this.breakpoint;
            this.rounds.clear();
        } );
    }

    add( key, round ) {
        this.rounds.set( key, round );
        if ( this.lastRound ) {
            this.lastRound.nextRound = round;
            round.prevRound = this.lastRound;
        }
        this.lastRound = round;
        return round;
    }

    createRound( production ) {
        const index = this.rounds.size;
        const scope = new Scope( this.scope, 'round', { [ this.spec.production ]: production } );
        const round = new Autorun( this, 'round', { index }, this.serial, scope, this.spec.$closure );
        return this.add( this.spec.kind === 'for-in' ? production : index, round );
    }

    async iterate() {
        // Get iteratee and implicitly bind instance to the ref
        this.iteratee = this.spec.iteratee();
        // Do for "for-in" loop
        if ( this.spec.kind === 'for-in' ) {
            let broken;
            for ( const key in this.iteratee ) {
                const round = this.createRound( key );
                if ( broken ) continue;
                this.async ? await this.runtime.push( round ) : this.runtime.push( round );
                if ( this.hardBreak() ) { break; }
                if ( this.terminated() ) { broken = true; }
            }
            this.watchMode();
        }
        if ( this.spec.kind === 'for-of' ) {
            let broken;
            for ( const val of this.iteratee ) {
                const round = this.createRound( val );
                if ( broken ) continue;
                this.async ? await this.runtime.push( round ) : this.runtime.push( round );
                if ( this.hardBreak() ) { break; }
                if ( this.terminated() ) { broken = true; }
            }
            this.watchMode();
        }
    }

    terminated() { return this.breakpoint && !this.breakpoint.flowControlApplied( 'continue', this.spec.label ) && this.breakpoint.flowControlApplied(); }

    hardBreak() { return this.terminated() && this.runtime.$params.experimentalFeatures === false; }

    watchMode() {
        const handleMutations = mutations => {
            const forSchedule = new Set;
            for ( const mutation of mutations ) {
                if ( Array.isArray( this.iteratee ) && mutation.key === 'length' ) continue;
                const production = this.spec.kind === 'for-in' ? mutation.key : mutation.value;
                const key = this.spec.kind === 'for-in' ? mutation.key : parseInt( mutation.key );
                const existingRound = this.rounds.get( key );
                let newRound;
                if ( existingRound ) {
                    Observer.set( existingRound.scope.state, this.spec.production, production );
                    if ( mutation.type === 'deleteProperty' ) {
                        // Fired above for the last time and now should die
                        existingRound.abort( true ); // See below. And also Autorun.handleRestRounds()
                    } else if ( existingRound.state === 'inert' ) {
                        // Treat as new round
                        existingRound.state = 'resuming';
                        newRound = existingRound;
                    }
                } else if ( mutation.type !== 'deleteProperty' ) {
                    // Create new round
                    newRound = this.createRound( production );
                }
                if ( newRound && !this.terminated() ) {
                    forSchedule.add( newRound );
                }
            }
            if ( forSchedule.size ) { this.runtime.schedule( ...forSchedule ); }
        };
        this.once( Observer.observe( this.iteratee, handleMutations ) );
    }
    
}