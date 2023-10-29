
/**
 * @imports
 */
import Observer from '@webqit/observer';
import { _$functionArgs } from './util.js';
import { $eval } from './runtime/index.js';
import AbstractStatefulScript from './AbstractStatefulScript.js';
import State from './runtime/State.js';

/** -------------- APIs */

export { Observer, State }

export function StatefulAsyncFunction( ...args ) {
    const { source, params } = _$functionArgs( args );
    const compiledFunction = $eval( 'async-function', parseCompileCallback, source, params );
    if ( !( compiledFunction instanceof Promise ) ) return compiledFunction;
    // Introduce a wrapper function that awaits main function
    const wrapperFunction = async function( ...args ) { return ( await compiledFunction ).apply( this, ...args ); }
    Object.defineProperty( wrapperFunction, 'toString', { value: async function( ...args ) { return ( await compiledFunction ).toString( ...args ) } } )
    return wrapperFunction;
}

export class StatefulAsyncScript extends AbstractStatefulScript {
    static sourceType = 'async-script';
    static parseCompileCallback = parseCompileCallback;
}

export class StatefulModule extends AbstractStatefulScript {
    static sourceType = 'module';
    static parseCompileCallback = parseCompileCallback;
}

/** -------------- parse-compile */

function parseCompileCallback( ...args ) {
    const params = typeof args[ args.length - 1 ] === 'object' ? args.pop() : {};
    const source = args.pop() || '';
    // $fCompiler has been loaded sync?
    if ( globalThis.webqit?.$fCompiler ) {
        const { parse, compile } = globalThis.webqit.$fCompiler;
        const ast = parse( source, params.parserParams );
        return compile( ast, params.compilerParams );
    }
    // Load and run $fCompiler async - in the background?
    globalThis.webqit = globalThis.webqit || {};
    if ( !globalThis.webqit.$fCompilerWorker ) {
        const customUrl = document.querySelector( 'meta[name="$f-compiler-url"]' );
        const compilerUrls = ( customUrl?.content.split( ',' ) || [] ).concat( 'https://unpkg.com/@webqit/stateful-js/dist/compiler.js' );
        const workerScriptText = `
        const compilerUrls = [ '${ compilerUrls.join( `','` ) }' ];
        ( function importScript() {
            try { importScripts( compilerUrls.shift().trim() ) } catch( e ) { if ( compilerUrls.length ) { importScript(); } }
        } )();
        const { parse, compile } = globalThis.webqit.$fCompiler;
        globalThis.onmessage = e => {
            const { source, params } = e.data;
            const ast = parse( source, params.parserParams );
            const compilation = compile( ast, params.compilerParams );
            e.ports[ 0 ]?.postMessage( {
                identifier: compilation.identifier,
                originalSource: compilation.originalSource,
                compiledSource: compilation + '',
                topLevelAwait: compilation.topLevelAwait
            } );
        };`;
        globalThis.webqit.$fCompilerWorker = new Worker( `data:text/javascript;base64,${ btoa( workerScriptText ) }` );
    }
    return new Promise( res => {
        let messageChannel = new MessageChannel;
        webqit.$fCompilerWorker.postMessage( { source, params }, [ messageChannel.port2 ] );
        messageChannel.port1.onmessage = e => {
            const { compiledSource, ...compilation } = e.data;
            Object.defineProperty( compilation, 'toString', { value: () => compiledSource } );
            res( compilation );
        }
    } );
}