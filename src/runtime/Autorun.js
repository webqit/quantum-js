
/**
 * @import
 */
import EventTarget from './EventTarget.js';
import { _call } from '../util.js';

export default class Autorun extends EventTarget {

    state;

    constructor( context, type, spec, serial, scope, closure ) {
        super();
        // We are to be managed by context
        context?.once( this );
        this.context = context;
        this.type = type;
        this.spec = spec;
        this.scope = scope;
        if ( context?.scope !== scope ) {
            // It's own scope, so we manage it
            this.manage( scope );
        }
        this.serial = serial;
        this.closure = closure;
        if ( context?.type === 'iteration' ) { this.path = context.path.concat( this.spec.index ); }
        else if ( context?.type === 'round' ) { this.path = context.path.concat( this.serial ); }
        else { this.path = ( context?.path || [] ).slice( 0, -1 ).concat( this.serial ); }
        this.flowControl = new Map;
    }

    get runtime() { return this.context.runtime; }

    contains( node ) { return this === node.context || ( node.context && this.contains( node.context ) ); }

    order( node ) {
        if ( !node ) return this;
        const [ a, b ] = node.path.length < this.path.length ? [ node, this ] : [ this, node ];
        return a.path.reduce( ( prev, key, i ) => {
            return prev && key <= b.path[ i ];
        }, true ) && a || b;
    }

    execute( callback = null ) {
        const stateBefore = this.before();
        const args = this === this.runtime || !this.context ? [ this ] : ( this.spec.args || [] );
        return _call( this.closure, undefined, ...args, returnValue => {
            if ( this.spec.complete ) { returnValue = this.spec.complete( returnValue, this ); }
            this.after( stateBefore );
            return callback ? callback( returnValue, this ) : returnValue;
        } );
    }

    continue( label ) { return this.apply( 'continue', label ); }

    break( label ) { return this.apply( 'break', label ); }

    return( arg ) { return this.apply( 'return', arg ); }

    flowControlApplied( cmd, arg ) {
        if ( !arguments.length ) return this.flowControl.size;
        if ( arguments.length === 1 ) return this.flowControl.has( cmd );
        return this.flowControl.get( cmd )?.arg === arg;
    }

    apply( cmd, arg, unset = false ) {
        const sizeBefore = this.flowControl.size;
        if ( unset ) { this.flowControl.delete( cmd ); }
        else { this.flowControl.set( cmd, { arg } ); }
        if ( this.type === 'round' ) { this.context.breakpoint = this; }
        if ( this.type === 'round' && [ 'break', 'continue' ].includes( cmd ) && arg === this.context?.spec.label ) {
            if ( !unset ) { this.flowControl.get( cmd ).endpoint = true; }
            if ( this.state !== 'running' ) { this.handleRestRounds( this.flowControl.size, sizeBefore ); }
            return;
        }
        // Notice that no hoisting and no "rest" handling if in active scope
        // as that would be done at after() hook!
        if ( this.state !== 'running' ) {
            this.handleRestBlock( this.flowControl.size, sizeBefore );
            this.hoist( ...arguments );
        }
    }

    hoist( ...args ) { return this.context?.apply( ...args ); }

    handleRestBlock( sizeAfter, sizeBefore ) {
        let restBlock;
        if ( this.type !== 'block' // If this is "rest", the "rest" you see from parent scope will be self
        || !( restBlock = this.context?.restBlock ) ) return;
        if ( sizeAfter ) { restBlock.abort(); }
        else if ( sizeBefore ) {
            restBlock.state = 'resuming'; // Just something other than "aborted"
            this.runtime.schedule( restBlock );
        }
    }

    handleRestRounds( sizeAfter, sizeBefore ) {
        if ( this.type !== 'round' ) return;
        let nextRound = this, forSchedule = new Set;
        while( nextRound = nextRound.nextRound ) {
            if ( sizeAfter ) { nextRound.abort(); }
            else if ( sizeBefore && nextRound.state !== 'inert' ) {
                nextRound.state = 'resuming'; // Just something other than "aborted"
                forSchedule.add( nextRound );
            }
        }
        if ( forSchedule.size ) { this.runtime.schedule( ...forSchedule ); }
    }

    before() {
        this.state = 'running';
        // Get record and reset
        const flowControlBefore = this.flowControl;
        this.flowControl = new Map;
        return flowControlBefore;
    }

    after( flowControlBefore ) {
        this.state = 'complete';
        // Compare records... and hoist differences
        const flowControlAfter = this.flowControl;
        // Handle rest block
        this.handleRestBlock( flowControlAfter.size, flowControlBefore.size );
        this.handleRestRounds( flowControlAfter.size, flowControlBefore.size );
        for ( const cmd of [ 'break', 'continue', 'return' ] ) {
            if ( flowControlAfter.has( cmd ) && !flowControlAfter.get( cmd ).endpoint ) { this.hoist( cmd, flowControlAfter.get( cmd ).arg ); }
            else if ( flowControlBefore.has( cmd ) && !flowControlBefore.get( cmd ).endpoint ) { this.hoist( cmd, flowControlBefore.get( cmd ).arg, true ); }
        }
    }

    abort( total = false ) {
        if ( total ) {
            if ( this.context?.breakpoint === this ) { delete this.context.breakpoint; }
            this.flowControl.clear();
        }
        this.state = total ? 'inert' : 'aborted';
        return super.abort( total );
    }
    
}