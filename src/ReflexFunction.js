
/**
 * @imports
 */
import { resolveParams } from './params.js';
import { normalizeTabs } from './util.js';
import { parse, compile, serialize } from './compiler/index.js';
import Runtime from './runtime/Runtime.js';
import inspect from './runtime/inspect.js';

/**
 * @ReflexFunction
 */
export default function ReflexFunction( ...args ) {
    const params = resolveParams( typeof args[ args.length - 1 ] === 'object' ? args.pop() : {} );
    const source = normalizeTabs( args.pop() || '' );
    const parameters = args;
    // --------------------
    const ast = parse( source, params.parserParams );
    const compilation = compile( ast, params.compilerParams );
    return Runtime.createFunction( undefined, compilation, parameters, params.runtimeParams, this, source );
}

/**
 * @inspect
 */
Object.defineProperty( ReflexFunction, 'inspect', { value: inspect } );
