
/**
 * @imports
 */
import { _$functionArgs } from './util.js';
import { parse, compile } from './compiler/index.js';
import { $eval } from './runtime/index.js';
import AbstractStatefulScript from './AbstractStatefulScript.js';
import State from './runtime/State.js';

/** -------------- APIs */

export { State }

export function StatefulFunction( ...args ) {
    const { source, params } = _$functionArgs( args );
    return $eval( 'function', parseCompileCallback, source, params );
}

export function StatefulAsyncFunction( ...args ) {
    const { source, params } = _$functionArgs( args );
    return $eval( 'async-function', parseCompileCallback, source, params );
}

export class StatefulScript extends AbstractStatefulScript {
    static sourceType = 'script';
    static parseCompileCallback = parseCompileCallback;
}

export class StatefulModule extends AbstractStatefulScript {
    static sourceType = 'module';
    static parseCompileCallback = parseCompileCallback;
}

/** -------------- parse-compile */

function parseCompileCallback( source, params ) {
    const ast = parse( source, params.parserParams );
    return compile( ast, params.compilerParams );
}