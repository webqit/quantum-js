
/**
 * @imports
 */
import Observer from '@webqit/observer';
import { _$functionArgs } from './util.js';
import { $eval } from './runtime/index.js';
import AbstractQuantumScript from './AbstractQuantumScript.js';
import State from './runtime/State.js';

/** -------------- APIs */

export { Observer, State }

export let QuantumFunction;

export function QuantumAsyncFunction( ...args ) {
    const { source, params } = _$functionArgs( args );
    const compiledFunction = $eval( 'async-function', parseCompileCallback, source, params );
    if ( !( compiledFunction instanceof Promise ) ) return compiledFunction;
    // Introduce a wrapper function that awaits main function
    const wrapperFunction = async function( ...args ) { return ( await compiledFunction ).call( this, ...args ); }
    Object.defineProperty( wrapperFunction, 'toString', { value: async function( ...args ) { return ( await compiledFunction ).toString( ...args ) } } )
    return wrapperFunction;
}

export let QuantumScript;

export class QuantumAsyncScript extends AbstractQuantumScript {
    static sourceType = 'async-script';
    static parseCompileCallback = parseCompileCallback;
}

export class QuantumModule extends AbstractQuantumScript {
    static sourceType = 'module';
    static parseCompileCallback = parseCompileCallback;
}

/** -------------- parse-compile */

function parseCompileCallback( ...args ) {
    const params = typeof args[ args.length - 1 ] === 'object' ? args.pop() : {};
    const source = args.pop() || '';
    // $qCompiler has been loaded sync?
    if ( globalThis.webqit?.$qCompiler ) {
        const { parse, compile } = globalThis.webqit.$qCompiler;
        const ast = parse( source, params.parserParams );
        return compile( ast, params.compilerParams );
    }
    // Load and run $qCompiler async - in the background?
    globalThis.webqit = globalThis.webqit || {};
    if ( !globalThis.webqit.$qCompilerWorker ) {
        const customUrl = document.querySelector( 'meta[name="$q-compiler-url"]' );
        const compilerUrls = ( customUrl?.content.split( ',' ) || [] ).concat( 'https://unpkg.com/@webqit/quantum-js/dist/compiler.js' );
        const workerScriptText = `
        const compilerUrls = [ '${ compilerUrls.join( `','` ) }' ];
        ( function importScript() {
            try { importScripts( compilerUrls.shift().trim() ) } catch( e ) { if ( compilerUrls.length ) { importScript(); } }
        } )();
        const { parse, compile } = globalThis.webqit.$qCompiler;
        globalThis.onmessage = e => {
            const { source, params } = e.data;
            const ast = parse( source, params.parserParams );
            const compilation = compile( ast, params.compilerParams );
            e.ports[ 0 ]?.postMessage( { ...compilation } );
        };`;
        globalThis.webqit.$qCompilerWorker = new Worker( `data:text/javascript;base64,${ btoa( workerScriptText ) }` );
    }
    return new Promise( res => {
        let messageChannel = new MessageChannel;
        webqit.$qCompilerWorker.postMessage( { source, params }, [ messageChannel.port2 ] );
        messageChannel.port1.onmessage = e => {
            const { ...compilation } = e.data;
            Object.defineProperty( compilation, 'toString', {
                value: base64 => base64 === 'base64' ? compilation.compiledSourceBase64 : compilation.compiledSource
            } );
            res( compilation );
        }
    } );
}