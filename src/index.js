
/**
 * @imports
 */
import Observer from '@webqit/observer';
import { _$functionArgs } from './util.js';
import { parse, compile } from './compiler/index.js';
import { $eval } from './runtime/index.js';
import AbstractQuantumScript from './AbstractQuantumScript.js';
import State from './runtime/State.js';

/** -------------- APIs */

export { Observer, State }

export function QuantumFunction( ...args ) {
    const { source, params } = _$functionArgs( args );
    return $eval( 'function', parseCompileCallback, source, params );
}

export function QuantumAsyncFunction( ...args ) {
    const { source, params } = _$functionArgs( args );
    return $eval( 'async-function', parseCompileCallback, source, params );
}

export class QuantumScript extends AbstractQuantumScript {
    static sourceType = 'script';
    static parseCompileCallback = parseCompileCallback;
}

export class QuantumAsyncScript extends AbstractQuantumScript {
    static sourceType = 'async-script';
    static parseCompileCallback = parseCompileCallback;
}

export class QuantumModule extends AbstractQuantumScript {
    static sourceType = 'module';
    static parseCompileCallback = parseCompileCallback;
}

/** -------------- parse-compile */

function parseCompileCallback( source, params ) {
    const ast = parse( source, params.parserParams );
    return compile( ast, params.compilerParams );
}