
/**
 * @imports
 */
import { _await } from './util.js';
import { $eval, State } from './runtime/index.js';

/**
 * @Script
 */
export default class AbstractQuantumScript {
    constructor( ...args ) {
        const $static = this.constructor;
        const params = typeof args[ args.length - 1 ] === 'object' ? args.pop() : {};
        const source = args.pop() || '';
        this.$program = $eval( $static.sourceType, $static.parseCompileCallback, source, params );
    }

    execute() { return _await( this.$program, ( { createRuntime } ) => createRuntime().execute() ); }

    bind( thisContext, env = undefined ) { return _await( this.$program, ( { createRuntime } ) => createRuntime( thisContext, env ) ); }

    toString( $qSource = false ) {
        return _await( this.$program, ( { compilation } ) => {
            if ( $qSource ) return compilation + '';
            return compilation.originalSource;
        } );
    }
}