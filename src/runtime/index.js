
/**
 * @imports
 */
import { _await } from '../util.js';
import { resolveParams } from '../params.js';
import Runtime from './Runtime.js';
import Scope from './Scope.js';
import State from './State.js';

export { State, Runtime }

export function $eval( sourceType, parseCompileCallback, source, params ) {
    // params could have: env, functionParams, parserParams, compilerParams, runtimeParams
    const { env, functionParams = [], packageName, fileName } = params;
    const { parserParams, compilerParams, runtimeParams, } = resolveParams( params );

    // Format source? Mode can be: function, async-function, script, async-script, module
    if ( sourceType === 'module' ) {
        parserParams.sourceType = sourceType;
        parserParams.allowAwaitOutsideFunction = true;
    } else if ( [ 'function', 'async-function' ].includes( sourceType ) ) {
        // Design the actual stateful function
        const body = `  ` + source.split( `\n` ).join( `\n  ` );
        source = `return ${ sourceType === 'async-function' ? 'async ' : '' }function**(${ functionParams.join( ', ' ) }) {\n${ body }\n}`;
        compilerParams.startStatic = true;
    } else if ( ![ 'script', 'async-script' ].includes( sourceType ) ) {
        throw new Error( `Unrecognized sourceType specified: "${ sourceType }".` );
    }

    // Proceed to parse-compile
    compilerParams.sourceType = sourceType;
    const compiledSource = parseCompileCallback( source, { parserParams, compilerParams } );
    if ( compiledSource instanceof Promise && ![ 'async-function', 'async-script', 'module' ].includes( sourceType ) ) {
        throw new Error( `Parse-compile can only return a Promise for sourceTypes: async-function, async-script, module.` );
    }

    // Proceed to eval
    runtimeParams.sourceType = sourceType;
    runtimeParams.packageName = packageName;
    runtimeParams.fileName = fileName;
    return _await( compiledSource, compiledSource => {
        // Below, "async-function" would already has async in the returned function
        // And no need to ask compiledSource.topLevelAwait
        const asyncEval = [ 'async-script', 'module' ].includes( sourceType );
        const $eval = ( params, source ) => {
            if ( runtimeParams.compileFunction ) return runtimeParams.compileFunction( source, params );
            return new ( asyncEval ? ( async function() {} ).constructor : Function )( ...params.concat( source ) );
        };
        const main = $eval( [ compiledSource.identifier + '' ], compiledSource + '' );
        const isFunction = [ 'function', 'async-function' ].includes( sourceType );
        const createRuntime = thisContext => {
            let $main = main;
            if ( thisContext ) { $main = $main.bind( thisContext ); }
            // There's always a global scope
            let contextType = 'global', scope = new Scope( undefined, contextType, globalThis );
            // Then this, for script scope, which may also directly reflect/mutate any provided "env"
            if ( sourceType.endsWith( 'script' ) || env ) { contextType = 'env'; scope = new Scope( scope, contextType, env ); }
            // Or this for module scope. And where "env" was provided, the "env" scope above too
            if ( sourceType === 'module' ) { contextType = 'module'; scope = new Scope( scope, contextType ); }
            //if ( typeof thisContext !== 'undefined' ) { scope = new Scope( scope, 'this', { [ 'this' ]: thisContext } ); }
            return new Runtime( undefined, contextType, { ...runtimeParams, originalSource: compiledSource.originalSource, isStatefulFunction: !isFunction }, scope, $main );

        };
        return isFunction
            ? createRuntime().execute() // Produces the actual stateful function designed above
            : { createRuntime, compiledSource };
    } );
}
