
/**
 * @imports
 */
import { _await } from './util.js';
import { $eval, State } from './runtime/index.js';

/**
 * @Script
 */
export default class AbstractStatefulScript {
    constructor( ...args ) {
        const $static = this.constructor;
        const params = typeof args[ args.length - 1 ] === 'object' ? args.pop() : {};
        const source = args.pop() || '';
        this.$program = $eval( $static.sourceType, $static.parseCompileCallback, source, params );
    }

    execute() {
        return _await( this.$program, ( { runtime } ) => {
            runtime.abort();
            return runtime.execute( () => new State( runtime ) );
        } );
    }

    toString( $fSource = false ) {
        return _await( this.$program, ( { compiledSource } ) => {
            if ( $fSource ) return compiledSource + '';
            return compiledSource.originalSource;
        } );
    }
}