
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
    const { env, functionParams = [], exportNamespace, fileName } = params;
    const { parserParams, compilerParams, runtimeParams, } = resolveParams( params );
    const inBrowser = Object.getOwnPropertyDescriptor(globalThis, 'window')?.get?.toString().includes('[native code]') ?? false;
    const asyncEval = [ 'async-script', 'module' ].includes( sourceType );

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
    parserParams.inBrowser = inBrowser;
    const compiledSource = parseCompileCallback( source, { parserParams, compilerParams, base64: asyncEval && inBrowser && `export default async function(%0) {%1}` } );
    if ( compiledSource instanceof Promise && ![ 'async-function', 'async-script', 'module' ].includes( sourceType ) ) {
        throw new Error( `Parse-compile can only return a Promise for sourceTypes: async-function, async-script, module.` );
    }

    // Proceed to eval
    runtimeParams.sourceType = sourceType;
    runtimeParams.inBrowser = inBrowser;
    runtimeParams.exportNamespace = exportNamespace;
    runtimeParams.fileName = fileName;
    return _await( compiledSource, compiledSource => {
        const isFunction = [ 'function', 'async-function' ].includes( sourceType );
        // Below, "async-function" would already has async in the returned function
        // And no need to ask compiledSource.topLevelAwait
        const $eval = ( $qIdentifier, source ) => {
            if ( runtimeParams.compileFunction ) return runtimeParams.compileFunction( source.toString(), [ $qIdentifier ] );
            if ( asyncEval && runtimeParams.inBrowser ) { /* @experimental */
                const impt = () => import( `data:text/javascript;base64,${ source.toString( 'base64' ) }` ).then( m => m.default );
                if ( window.webqit?.realdom?.schedule ) return window.webqit?.realdom?.schedule( 'write', impt, true );
                return impt();
            }
            return new ( asyncEval ? ( async function() {} ).constructor : Function )( $qIdentifier, source.toString() );
        };
        return _await( $eval( compiledSource.identifier + '', compiledSource ), main => {
            const createRuntime = ( thisContext, $env = env ) => {
                let $main = main;
                if ( thisContext ) { $main = $main.bind( thisContext ); }
                // There's always a global scope
                let contextType = 'global', scope = new Scope( undefined, contextType, globalThis );
                // Then this, for script scope, which may also directly reflect/mutate any provided "env"
                if ( sourceType.endsWith( 'script' ) || $env ) { contextType = 'env'; scope = new Scope( scope, contextType, $env ); }
                // Or this for module scope. And where "env" was provided, the "env" scope above too
                if ( sourceType === 'module' ) { contextType = 'module'; scope = new Scope( scope, contextType ); }
                if ( typeof thisContext !== 'undefined' ) { scope = new Scope( scope, 'this', { [ 'this' ]: thisContext } ); }
                return new Runtime( undefined, contextType, { ...runtimeParams, originalSource: compiledSource.originalSource, isQuantumFunction: !isFunction }, scope, $main );
            };
            return isFunction
                ? createRuntime().execute() // Produces the actual stateful function designed above
                : { createRuntime, compiledSource };
        } );
    } );
}
